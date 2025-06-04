const express = require("express");
const router = express.Router();
const cartController = require("../controllers/CartController");
const authMiddleware = require("../middleware/authMiddleware");
const { check, param } = require("express-validator");

// Middleware untuk validasi input
const validateAddItem = [
  check("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID harus berupa angka positif"),
  check("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity harus angka positif minimal 1"),
];

const validateUserId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID harus berupa angka positif"),
];

const validateProductId = [
  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID harus berupa angka positif"),
];

// Apply auth middleware to all cart routes
router.use(authMiddleware(["user", "admin"]));

// Rute untuk mendapatkan keranjang user yang sedang login
router.get("/", cartController.getCart);

// Rute untuk menambahkan item ke keranjang
router.post("/add", validateAddItem, cartController.addItemToCart);

// Rute untuk menghapus item dari keranjang
router.delete(
  "/:productId",
  validateProductId,
  cartController.removeItemFromCart
);

// Rute untuk mendapatkan keranjang by user ID (untuk admin)
router.get("/user/:id", validateUserId, cartController.getCartByUserId);

module.exports = router;
