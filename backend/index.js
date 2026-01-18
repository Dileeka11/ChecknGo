require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Allow any localhost origin for development
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow any localhost origin for development
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ChecknGo Backend is running" });
});

// API Routes
app.use('/api/customers', require('./src/routes/customerRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));
app.use('/api/items', require('./src/routes/itemRoutes'));
app.use('/api/grns', require('./src/routes/grnRoutes'));
app.use('/api/stock', require('./src/routes/stockRoutes'));
app.use('/api/predict', require('./src/routes/predictRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
