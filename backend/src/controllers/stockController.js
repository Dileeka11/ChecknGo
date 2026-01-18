const Stock = require("../models/Stock");

/**
 * Get all available stock (remainingQty > 0)
 * GET /api/stock
 */
const getAvailableStock = async (req, res) => {
  try {
    const { itemId, status } = req.query;

    let query = {};

    // Filter by item
    if (itemId) {
      query.itemId = itemId;
    }

    // Filter by status, default to available
    if (status) {
      query.status = status;
    } else {
      query.remainingQty = { $gt: 0 };
    }

    const stock = await Stock.find(query)
      .populate("itemId", "code name category unit")
      .populate("grnId", "grnNumber")
      .sort({ receivedDate: 1 }); // FIFO: oldest first

    res.json({
      success: true,
      count: stock.length,
      data: stock,
    });
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock",
    });
  }
};

/**
 * Get stock for a specific item in FIFO order
 * GET /api/stock/item/:id
 */
const getStockByItem = async (req, res) => {
  try {
    const stock = await Stock.find({
      itemId: req.params.id,
      remainingQty: { $gt: 0 },
      status: "available",
    })
      .populate("grnId", "grnNumber")
      .sort({ receivedDate: 1 }); // FIFO: oldest first

    // Calculate total available quantity
    const totalAvailable = stock.reduce((sum, s) => sum + s.remainingQty, 0);

    res.json({
      success: true,
      count: stock.length,
      totalAvailable,
      data: stock,
    });
  } catch (error) {
    console.error("Error fetching stock by item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock",
    });
  }
};

/**
 * Deduct stock using FIFO method (for invoicing)
 * POST /api/stock/deduct
 * Body: { itemId, quantity }
 */
const deductStock = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide itemId and a positive quantity",
      });
    }

    // Get available stock in FIFO order
    const availableStock = await Stock.find({
      itemId,
      remainingQty: { $gt: 0 },
      status: "available",
    }).sort({ receivedDate: 1 });

    // Calculate total available
    const totalAvailable = availableStock.reduce((sum, s) => sum + s.remainingQty, 0);

    if (totalAvailable < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
      });
    }

    // Deduct using FIFO
    let remainingToDeduct = quantity;
    const deductions = [];

    for (const stock of availableStock) {
      if (remainingToDeduct <= 0) break;

      const deductFromThis = Math.min(stock.remainingQty, remainingToDeduct);
      stock.remainingQty -= deductFromThis;

      // Mark as depleted if no remaining quantity
      if (stock.remainingQty === 0) {
        stock.status = "depleted";
      }

      await stock.save();

      deductions.push({
        stockId: stock._id,
        grnItemId: stock.grnItemId,
        grnNumber: stock.grnNumber,
        deducted: deductFromThis,
        sellingPrice: stock.sellingPrice,
        costPrice: stock.costPrice,
      });

      remainingToDeduct -= deductFromThis;
    }

    res.json({
      success: true,
      message: `Successfully deducted ${quantity} units`,
      data: {
        itemId,
        totalDeducted: quantity,
        deductions,
      },
    });
  } catch (error) {
    console.error("Error deducting stock:", error);
    res.status(500).json({
      success: false,
      error: "Failed to deduct stock",
    });
  }
};

/**
 * Get stock summary by item (aggregated view)
 * GET /api/stock/summary
 */
const getStockSummary = async (req, res) => {
  try {
    const summary = await Stock.aggregate([
      {
        $match: { status: "available", remainingQty: { $gt: 0 } },
      },
      {
        $group: {
          _id: "$itemId",
          itemCode: { $first: "$itemCode" },
          itemName: { $first: "$itemName" },
          totalQuantity: { $sum: "$remainingQty" },
          batchCount: { $sum: 1 },
          oldestBatch: { $min: "$receivedDate" },
          newestBatch: { $max: "$receivedDate" },
        },
      },
      {
        $sort: { itemName: 1 },
      },
    ]);

    res.json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock summary",
    });
  }
};

/**
 * Search stock by item name (for checkout page)
 * GET /api/stock/search?name=<itemName>
 * Returns availability info including qty, weight, and FIFO price
 */
const searchStockByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Item name is required",
      });
    }

    // Find stock with matching item name (case-insensitive)
    const stocks = await Stock.find({
      itemName: { $regex: new RegExp(`^${name}$`, 'i') },
      remainingQty: { $gt: 0 },
      status: "available",
    }).sort({ receivedDate: 1 }); // FIFO order

    if (stocks.length === 0) {
      return res.json({
        success: true,
        inStock: false,
        data: null,
        message: `${name} is not available in stock`,
      });
    }

    // Calculate totals
    const totalQty = stocks.reduce((sum, s) => sum + s.remainingQty, 0);
    const totalWeight = stocks.reduce((sum, s) => sum + s.itemWeight, 0);
    const avgWeightPerUnit = totalQty > 0 ? totalWeight / totalQty : 0;
    
    // FIFO price is from the oldest batch
    const fifoPrice = stocks[0].sellingPrice;
    const firstItemId = stocks[0].itemId;
    const firstItemCode = stocks[0].itemCode;

    // Prepare batch details
    const batches = stocks.map(s => ({
      stockId: s._id,
      grnItemId: s.grnItemId,
      grnNumber: s.grnNumber,
      remainingQty: s.remainingQty,
      itemWeight: s.itemWeight,
      sellingPrice: s.sellingPrice,
      receivedDate: s.receivedDate,
    }));

    res.json({
      success: true,
      inStock: true,
      data: {
        itemId: firstItemId,
        itemCode: firstItemCode,
        itemName: name,
        availableQty: totalQty,
        availableWeight: totalWeight,
        avgWeightPerUnit: Math.round(avgWeightPerUnit * 100) / 100,
        fifoPrice,
        batchCount: stocks.length,
        batches,
      },
    });
  } catch (error) {
    console.error("Error searching stock by name:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search stock",
    });
  }
};

module.exports = {
  getAvailableStock,
  getStockByItem,
  deductStock,
  getStockSummary,
  searchStockByName,
};
