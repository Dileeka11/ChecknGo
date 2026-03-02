const express = require("express");
const router = express.Router();
const { getSalesPrediction } = require("../controllers/salesPredictionController");

// GET /api/sales-prediction
router.get("/", getSalesPrediction);

module.exports = router;
