const express = require("express");
const router = express.Router();
const {
  getAvailableStock,
  getStockByItem,
  deductStock,
  getStockSummary,
  searchStockByName,
} = require("../controllers/stockController");

// GET /api/stock - Get all available stock
router.get("/", getAvailableStock);

// GET /api/stock/summary - Get stock summary by item
router.get("/summary", getStockSummary);

// GET /api/stock/search - Search stock by item name
router.get("/search", searchStockByName);

// GET /api/stock/item/:id - Get stock for specific item (FIFO order)
router.get("/item/:id", getStockByItem);

// POST /api/stock/deduct - Deduct stock using FIFO
router.post("/deduct", deductStock);

module.exports = router;

