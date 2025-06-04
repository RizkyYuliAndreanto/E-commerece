// src/app.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const { authMiddleware, roleMiddleware } = require("./src/utils/auth");
const productRoutes = require("./src/routes/ProductsRoutes");
const cartRoutes = require("./src/routes/CartRoutes");
const OrderRoutes = require("./src/routes/OrderRoutes");
const { sequelize } = require("./src/models");

const path = require("path");

const fs = require("fs");
dotenv.config();

const app = express();

// Body parser
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", OrderRoutes);

// Protected admin route
app.get(
  "/api/admin/dashboard",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  (req, res) => {
    res.json({ success: true, message: "Welcome to admin dashboard" });
  }
);

// File upload path
const uploadDir = path.join(__dirname, "public/uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

module.exports = app;
