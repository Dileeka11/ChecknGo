const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRecentTransactions,
  getDailySales,
  getTopSellers
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);
router.get("/recent-transactions", getRecentTransactions);
router.get("/daily-sales", getDailySales);
router.get("/top-sellers", getTopSellers);

module.exports = router;
