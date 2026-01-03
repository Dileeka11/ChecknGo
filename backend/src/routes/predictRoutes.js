const express = require("express");
const router = express.Router();
const { predictFruit } = require("../controllers/predictController");

// POST /api/predict - Predict fruit/vegetable from image
router.post("/", predictFruit);

module.exports = router;
