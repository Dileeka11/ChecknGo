const Supplier = require("../models/Supplier");

/**
 * Generate next supplier code based on existing suppliers
 * Finds the highest code number and increments by 1
 */
const generateNextSupplierCode = async () => {
  const lastSupplier = await Supplier.findOne({}, { code: 1 })
    .sort({ code: -1 })
    .lean();
  
  if (!lastSupplier) {
    return "SUP0001";
  }
  
  const codeNumber = parseInt(lastSupplier.code.replace("SUP", ""), 10);
  const nextNumber = codeNumber + 1;
  
  return `SUP${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Get all suppliers
 * GET /api/suppliers
 */
const getAllSuppliers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }
    
    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch suppliers",
    });
  }
};

/**
 * Get single supplier by ID
 * GET /api/suppliers/:id
 */
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }
    
    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch supplier",
    });
  }
};

/**
 * Create new supplier
 * POST /api/suppliers
 */
const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson, isActive } = req.body;
    
    if (!name || !email || !phone || !address || !contactPerson) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields: name, email, phone, address, contactPerson",
      });
    }
    
    const existingSupplier = await Supplier.findOne({ email: email.toLowerCase() });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: "A supplier with this email already exists",
      });
    }
    
    const code = await generateNextSupplierCode();
    
    const supplier = await Supplier.create({
      code,
      name,
      email,
      phone,
      address,
      contactPerson,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A supplier with this email already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create supplier",
    });
  }
};

/**
 * Update supplier
 * PUT /api/suppliers/:id
 */
const updateSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson, isActive } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }
    
    if (email && email.toLowerCase() !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          error: "A supplier with this email already exists",
        });
      }
    }
    
    if (name) supplier.name = name;
    if (email) supplier.email = email;
    if (phone) supplier.phone = phone;
    if (address) supplier.address = address;
    if (contactPerson) supplier.contactPerson = contactPerson;
    if (isActive !== undefined) supplier.isActive = isActive;
    
    await supplier.save();
    
    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A supplier with this email already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update supplier",
    });
  }
};

/**
 * Delete supplier
 * DELETE /api/suppliers/:id
 */
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Supplier deleted successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete supplier",
    });
  }
};

/**
 * Get next supplier code (for preview)
 * GET /api/suppliers/next-code
 */
const getNextCode = async (req, res) => {
  try {
    const nextCode = await generateNextSupplierCode();
    
    res.json({
      success: true,
      data: { nextCode },
    });
  } catch (error) {
    console.error("Error getting next code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get next code",
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getNextCode,
};
