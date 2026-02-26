const express = require("express");
const router = express.Router();
const { readWeight } = require("../controllers/weightController");

// POST /api/weight/read - Read weight from scale image
router.post("/read", readWeight);

module.exports = router;
