const Item = require("../models/Item");

/**
 * Generate next item code based on existing items
 * Finds the highest code number and increments by 1
 */
const generateNextItemCode = async () => {
  const lastItem = await Item.findOne({}, { code: 1 })
    .sort({ code: -1 })
    .lean();
  
  if (!lastItem) {
    return "ITM0001";
  }
  
  const codeNumber = parseInt(lastItem.code.replace("ITM", ""), 10);
  const nextNumber = codeNumber + 1;
  
  return `ITM${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Get all items
 * GET /api/items
 */
const getAllItems = async (req, res) => {
  try {
    const { search, isActive, category } = req.query;
    
    let query = {};
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    
    const items = await Item.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch items",
    });
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }
    
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch item",
    });
  }
};

/**
 * Create new item
 * POST /api/items
 */
const createItem = async (req, res) => {
  try {
    const { name, category, unit, costPrice, sellingPrice, reorderLevel, isActive } = req.body;
    
    // Validate required fields
    if (!name || !category || !unit || costPrice === undefined || sellingPrice === undefined || reorderLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields: name, category, unit, costPrice, sellingPrice, reorderLevel",
      });
    }
    
    // Check if item with same name already exists
    const existingItem = await Item.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: "An item with this name already exists",
      });
    }
    
    // Auto-generate item code based on existing items
    const code = await generateNextItemCode();
    
    const item = await Item.create({
      code,
      name,
      category,
      unit,
      costPrice,
      sellingPrice,
      reorderLevel,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "An item with this code or name already exists",
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
      error: error.message || "Failed to create item",
    });
  }
};

/**
 * Update item
 * PUT /api/items/:id
 */
const updateItem = async (req, res) => {
  try {
    const { name, category, unit, costPrice, sellingPrice, reorderLevel, isActive } = req.body;
    
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }
    
    // Check if name is being changed to an existing name
    if (name && name.toLowerCase() !== item.name.toLowerCase()) {
      const existingItem = await Item.findOne({ 
        name: { $regex: `^${name}$`, $options: "i" },
        _id: { $ne: req.params.id }
      });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          error: "An item with this name already exists",
        });
      }
    }
    
    // Update fields
    if (name) item.name = name;
    if (category) item.category = category;
    if (unit) item.unit = unit;
    if (costPrice !== undefined) item.costPrice = costPrice;
    if (sellingPrice !== undefined) item.sellingPrice = sellingPrice;
    if (reorderLevel !== undefined) item.reorderLevel = reorderLevel;
    if (isActive !== undefined) item.isActive = isActive;
    
    await item.save();
    
    res.json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "An item with this name already exists",
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
      error: error.message || "Failed to update item",
    });
  }
};

/**
 * Delete item
 * DELETE /api/items/:id
 */
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }
    
    await Item.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Item deleted successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete item",
    });
  }
};

/**
 * Get next item code (for preview)
 * GET /api/items/next-code
 */
const getNextCode = async (req, res) => {
  try {
    const nextCode = await generateNextItemCode();
    
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
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getNextCode,
};
