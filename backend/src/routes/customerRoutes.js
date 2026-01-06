const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getNextCode,
} = require("../controllers/customerController");

// GET /api/customers/next-code - Get next customer code (must be before /:id route)
router.get("/next-code", getNextCode);

// GET /api/customers - Get all customers
router.get("/", getAllCustomers);

// GET /api/customers/:id - Get single customer
router.get("/:id", getCustomerById);

// POST /api/customers - Create new customer
router.post("/", createCustomer);

// PUT /api/customers/:id - Update customer
router.put("/:id", updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", deleteCustomer);

module.exports = router;
