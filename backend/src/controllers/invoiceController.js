const Invoice = require("../models/Invoice");
const Stock = require("../models/Stock");
const DocumentTracker = require("../models/DocumentTracker");
const { sendInvoiceEmail } = require("../utils/emailService");

/**
 * Generate next invoice number
 */
const generateInvoiceNumber = async () => {
  const tracker = await DocumentTracker.findOneAndUpdate(
    { documentType: "invoice" },
    { $inc: { lastNumber: 1 } },
    { upsert: true, new: true }
  );
  const paddedNumber = String(tracker.lastNumber).padStart(5, "0");
  return `INV-${paddedNumber}`;
};

/**
 * Create a new invoice with FIFO stock deduction (weight-based)
 * POST /api/invoices
 */
const createInvoice = async (req, res) => {
  try {
    const { 
      customerId, 
      customerName, 
      customerEmail,
      items, 
      discount = 0, 
      paymentMethod = "cash", 
      createdBy 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        error: "Created by is required",
      });
    }

    // Process each item and deduct stock using FIFO (by weight)
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { itemId, itemCode, itemName, weight } = item;

      if (!weight || weight <= 0) {
        return res.status(400).json({
          success: false,
          error: `Weight must be positive for ${itemName}`,
        });
      }

      // Get available stock in FIFO order
      const availableStock = await Stock.find({
        itemId,
        remainingWeight: { $gt: 0 },
        status: "available",
      }).sort({ receivedDate: 1 }); // FIFO: oldest first

      // Calculate total available weight
      const totalAvailableWeight = availableStock.reduce((sum, s) => sum + s.remainingWeight, 0);

      if (totalAvailableWeight < weight) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${itemName}. Available: ${totalAvailableWeight.toFixed(2)} kg, Requested: ${weight.toFixed(2)} kg`,
        });
      }

      // Deduct using FIFO and track deductions
      let remainingWeightToDeduct = weight;
      const deductions = [];
      let itemTotalPrice = 0;

      for (const stock of availableStock) {
        if (remainingWeightToDeduct <= 0) break;

        const weightFromThis = Math.min(stock.remainingWeight, remainingWeightToDeduct);

        // Calculate price for this portion (weight * selling price per kg)
        const portionPrice = weightFromThis * stock.sellingPrice;
        itemTotalPrice += portionPrice;

        // Update stock
        stock.remainingWeight -= weightFromThis;
        stock.remainingWeight = Math.round(stock.remainingWeight * 1000) / 1000; // Avoid floating point issues
        if (stock.remainingWeight === 0) {
          stock.status = "depleted";
        }
        await stock.save();

        // Record deduction for potential restoration
        deductions.push({
          grnItemId: stock.grnItemId,
          stockId: stock._id,
          weightDeducted: weightFromThis,
          priceApplied: stock.sellingPrice,
        });

        remainingWeightToDeduct -= weightFromThis;
      }

      // Use FIFO price (first batch price) as unit price for display
      const unitPrice = deductions.length > 0 ? deductions[0].priceApplied : 0;

      processedItems.push({
        itemId,
        itemCode,
        itemName,
        weight,
        unitPrice,
        totalPrice: Math.round(itemTotalPrice * 100) / 100,
        deductions,
      });

      subtotal += itemTotalPrice;
    }

    const totalAmount = subtotal - discount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      customerEmail: customerEmail || null,
      items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paymentMethod,
      createdBy,
      status: "completed",
    });

    await invoice.save();

    // Send email receipt asynchronously (don't block response)
    if (customerEmail) {
      sendInvoiceEmail(customerEmail, invoice.toObject()).catch((err) => {
        console.error("Email send failed (non-blocking):", err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create invoice",
      details: error.message,
    });
  }
};

/**
 * Get all invoices with pagination
 * GET /api/invoices
 */
const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) {
      query.status = status;
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("customerId", "code name"),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: invoices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoices",
    });
  }
};

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customerId", "code name email phone address");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoice",
    });
  }
};

/**
 * Cancel invoice and restore stock
 * PUT /api/invoices/:id/cancel
 */
const cancelInvoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Invoice is already cancelled",
      });
    }

    // Restore stock for each item
    for (const item of invoice.items) {
      for (const deduction of item.deductions) {
        const stock = await Stock.findById(deduction.stockId);
        
        if (stock) {
          // Restore weight
          stock.remainingWeight += deduction.weightDeducted;
          stock.remainingWeight = Math.round(stock.remainingWeight * 1000) / 1000; // Avoid floating point issues
          
          // Update status if was depleted
          if (stock.status === "depleted") {
            stock.status = "available";
          }
          
          await stock.save();
        }
      }
    }

    // Update invoice status
    invoice.status = "cancelled";
    invoice.cancelledAt = new Date();
    invoice.cancelReason = reason || "No reason provided";
    await invoice.save();

    res.json({
      success: true,
      message: "Invoice cancelled and stock restored successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error cancelling invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel invoice",
    });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  cancelInvoice,
};
