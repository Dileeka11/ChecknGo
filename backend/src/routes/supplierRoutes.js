const express = require("express");
const router = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getNextCode,
} = require("../controllers/supplierController");

// GET /api/suppliers/next-code - Get next supplier code (must be before /:id route)
router.get("/next-code", getNextCode);

// GET /api/suppliers - Get all suppliers
router.get("/", getAllSuppliers);

// GET /api/suppliers/:id - Get single supplier
router.get("/:id", getSupplierById);

// POST /api/suppliers - Create new supplier
router.post("/", createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put("/:id", updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier
router.delete("/:id", deleteSupplier);

module.exports = router;
