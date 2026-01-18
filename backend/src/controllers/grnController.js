const GRN = require("../models/GRN");

/**
 * Generate next GRN number based on current year
 * Format: GRN-YYYY-NNN (e.g., GRN-2026-001)
 */
const generateNextGRNNumber = async () => {
  const currentYear = new Date().getFullYear();
  const pattern = `^GRN-${currentYear}-`;
  
  const lastGRN = await GRN.findOne({
    grnNumber: new RegExp(pattern)
  }).sort({ grnNumber: -1 }).lean();
  
  if (!lastGRN) {
    return `GRN-${currentYear}-001`;
  }
  
  const lastNumber = parseInt(lastGRN.grnNumber.split('-')[2], 10);
  const nextNumber = lastNumber + 1;
  
  return `GRN-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Get all GRNs
 * GET /api/grns
 */
const getAllGRNs = async (req, res) => {
  try {
    const { search, supplierId, status, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by supplier
    if (supplierId) {
      query.supplierId = supplierId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.receivedDate = {};
      if (startDate) {
        query.receivedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.receivedDate.$lte = new Date(endDate);
      }
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { grnNumber: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
      ];
    }
    
    const grns = await GRN.find(query)
      .populate('supplierId', 'code name')
      .sort({ receivedDate: -1 });
    
    res.json({
      success: true,
      count: grns.length,
      data: grns,
    });
  } catch (error) {
    console.error("Error fetching GRNs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch GRNs",
    });
  }
};

/**
 * Get single GRN by ID
 * GET /api/grns/:id
 */
const getGRNById = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('supplierId', 'code name email phone contactPerson');
    
    if (!grn) {
      return res.status(404).json({
        success: false,
        error: "GRN not found",
      });
    }
    
    res.json({
      success: true,
      data: grn,
    });
  } catch (error) {
    console.error("Error fetching GRN:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch GRN",
    });
  }
};

/**
 * Create new GRN
 * POST /api/grns
 */
const createGRN = async (req, res) => {
  try {
    const { supplierId, supplierName, items, receivedDate, createdBy, status } = req.body;
    
    // Validate required fields
    if (!supplierId || !supplierName || !items || !items.length || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields: supplierId, supplierName, items, createdBy",
      });
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    
    // Auto-generate GRN number
    const grnNumber = await generateNextGRNNumber();
    
    const grn = await GRN.create({
      grnNumber,
      supplierId,
      supplierName,
      items,
      totalAmount,
      receivedDate: receivedDate || new Date(),
      createdBy,
      status: status || "received",
    });
    
    // Populate supplier details for response
    await grn.populate('supplierId', 'code name');
    
    res.status(201).json({
      success: true,
      message: "GRN created successfully",
      data: grn,
    });
  } catch (error) {
    console.error("Error creating GRN:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A GRN with this number already exists",
      });
    }
    
    // Handle validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create GRN",
    });
  }
};

/**
 * Update GRN (mainly for status changes)
 * PUT /api/grns/:id
 */
const updateGRN = async (req, res) => {
  try {
    const { status, items, receivedDate } = req.body;
    
    const grn = await GRN.findById(req.params.id);
    
    if (!grn) {
      return res.status(404).json({
        success: false,
        error: "GRN not found",
      });
    }
    
    // Update fields
    if (status) grn.status = status;
    if (receivedDate) grn.receivedDate = receivedDate;
    if (items) {
      grn.items = items;
      grn.totalAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    }
    
    await grn.save();
    await grn.populate('supplierId', 'code name');
    
    res.json({
      success: true,
      message: "GRN updated successfully",
      data: grn,
    });
  } catch (error) {
    console.error("Error updating GRN:", error);
    
    // Handle validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update GRN",
    });
  }
};

/**
 * Delete GRN
 * DELETE /api/grns/:id
 */
const deleteGRN = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id);
    
    if (!grn) {
      return res.status(404).json({
        success: false,
        error: "GRN not found",
      });
    }
    
    await GRN.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "GRN deleted successfully",
      data: grn,
    });
  } catch (error) {
    console.error("Error deleting GRN:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete GRN",
    });
  }
};

/**
 * Get next GRN number (for preview)
 * GET /api/grns/next-number
 */
const getNextNumber = async (req, res) => {
  try {
    const nextNumber = await generateNextGRNNumber();
    
    res.json({
      success: true,
      data: { nextNumber },
    });
  } catch (error) {
    console.error("Error getting next GRN number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get next GRN number",
    });
  }
};

module.exports = {
  getAllGRNs,
  getGRNById,
  createGRN,
  updateGRN,
  deleteGRN,
  getNextNumber,
};
