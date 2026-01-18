const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  cancelInvoice,
} = require("../controllers/invoiceController");

// POST /api/invoices - Create new invoice
router.post("/", createInvoice);

// GET /api/invoices - Get all invoices
router.get("/", getInvoices);

// GET /api/invoices/:id - Get invoice by ID
router.get("/:id", getInvoiceById);

// PUT /api/invoices/:id/cancel - Cancel invoice
router.put("/:id/cancel", cancelInvoice);

module.exports = router;
