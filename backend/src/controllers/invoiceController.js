const Invoice = require("../models/Invoice");
const Stock = require("../models/Stock");
const DocumentTracker = require("../models/DocumentTracker");

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
 * Create a new invoice with FIFO stock deduction
 * POST /api/invoices
 */
const createInvoice = async (req, res) => {
  try {
    const { 
      customerId, 
      customerName, 
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

    // Process each item and deduct stock using FIFO
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { itemId, itemCode, itemName, quantity, weight } = item;

      // Get available stock in FIFO order
      const availableStock = await Stock.find({
        itemId,
        remainingQty: { $gt: 0 },
        status: "available",
      }).sort({ receivedDate: 1 }); // FIFO: oldest first

      // Calculate total available
      const totalAvailableQty = availableStock.reduce((sum, s) => sum + s.remainingQty, 0);

      if (totalAvailableQty < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${itemName}. Available: ${totalAvailableQty}, Requested: ${quantity}`,
        });
      }

      // Deduct using FIFO and track deductions
      let remainingQtyToDeduct = quantity;
      let remainingWeightToDeduct = weight;
      const deductions = [];
      let itemTotalPrice = 0;

      for (const stock of availableStock) {
        if (remainingQtyToDeduct <= 0) break;

        const qtyFromThis = Math.min(stock.remainingQty, remainingQtyToDeduct);
        // Calculate proportional weight for this batch
        const weightFromThis = remainingQtyToDeduct <= stock.remainingQty 
          ? remainingWeightToDeduct 
          : (qtyFromThis / remainingQtyToDeduct) * remainingWeightToDeduct;

        // Calculate price for this portion
        const portionPrice = qtyFromThis * stock.sellingPrice;
        itemTotalPrice += portionPrice;

        // Update stock
        stock.remainingQty -= qtyFromThis;
        if (stock.remainingQty === 0) {
          stock.status = "depleted";
        }
        await stock.save();

        // Record deduction for potential restoration
        deductions.push({
          grnItemId: stock.grnItemId,
          stockId: stock._id,
          qtyDeducted: qtyFromThis,
          weightDeducted: weightFromThis,
          priceApplied: stock.sellingPrice,
        });

        remainingQtyToDeduct -= qtyFromThis;
        remainingWeightToDeduct -= weightFromThis;
      }

      // Use FIFO price (first batch price) as unit price for display
      const unitPrice = deductions.length > 0 ? deductions[0].priceApplied : 0;

      processedItems.push({
        itemId,
        itemCode,
        itemName,
        quantity,
        weight,
        unitPrice,
        totalPrice: itemTotalPrice,
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
      items: processedItems,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      createdBy,
      status: "completed",
    });

    await invoice.save();

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
          // Restore quantity and weight
          stock.remainingQty += deduction.qtyDeducted;
          
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
