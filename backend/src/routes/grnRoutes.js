const express = require("express");
const router = express.Router();
const {
  getAllGRNs,
  getGRNById,
  createGRN,
  updateGRN,
  deleteGRN,
  getNextNumber,
} = require("../controllers/grnController");

// GET /api/grns/next-number - Get next GRN number (must be before /:id route)
router.get("/next-number", getNextNumber);

// GET /api/grns - Get all GRNs
router.get("/", getAllGRNs);

// GET /api/grns/:id - Get single GRN
router.get("/:id", getGRNById);

// POST /api/grns - Create new GRN
router.post("/", createGRN);

// PUT /api/grns/:id - Update GRN
router.put("/:id", updateGRN);

// DELETE /api/grns/:id - Delete GRN
router.delete("/:id", deleteGRN);

module.exports = router;
