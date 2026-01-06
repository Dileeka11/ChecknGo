const Customer = require("../models/Customer");
const DocumentTracking = require("../utils/DocumentTracking");

/**
 * Get all customers
 * GET /api/customers
 */
const getAllCustomers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    
    let query = {};
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customers",
    });
  }
};

/**
 * Get single customer by ID
 * GET /api/customers/:id
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }
    
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer",
    });
  }
};

/**
 * Generate next customer code based on existing customers
 * Finds the highest code number and increments by 1
 */
const generateNextCustomerCode = async () => {
  // Get the highest customer code
  const lastCustomer = await Customer.findOne({}, { code: 1 })
    .sort({ code: -1 })
    .lean();
  
  if (!lastCustomer) {
    // No customers exist, start from CUST0001
    return "CUST0001";
  }
  
  // Extract number from code (e.g., "CUST0002" -> 2)
  const codeNumber = parseInt(lastCustomer.code.replace("CUST", ""), 10);
  const nextNumber = codeNumber + 1;
  
  return `CUST${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Create new customer
 * POST /api/customers
 */
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, isActive } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields: name, email, phone, address",
      });
    }
    
    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "A customer with this email already exists",
      });
    }
    
    // Auto-generate customer code based on existing customers
    const code = await generateNextCustomerCode();
    
    const customer = await Customer.create({
      code,
      name,
      email,
      phone,
      address,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A customer with this email already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create customer",
    });
  }
};

/**
 * Update customer
 * PUT /api/customers/:id
 */
const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, isActive } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }
    
    // Check if email is being changed to an existing email
    if (email && email.toLowerCase() !== customer.email) {
      const existingCustomer = await Customer.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: "A customer with this email already exists",
        });
      }
    }
    
    // Update fields
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (isActive !== undefined) customer.isActive = isActive;
    
    await customer.save();
    
    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A customer with this email already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update customer",
    });
  }
};

/**
 * Delete customer
 * DELETE /api/customers/:id
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }
    
    await Customer.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Customer deleted successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete customer",
    });
  }
};

/**
 * Get next customer code (for preview)
 * GET /api/customers/next-code
 */
const getNextCode = async (req, res) => {
  try {
    const nextCode = await generateNextCustomerCode();
    
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
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getNextCode,
};
