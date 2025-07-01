// Backend/src/routes/OrderRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // Impor auth middleware
const OrderController = require("../controllers/OrderController"); // Impor OrderController
const { body, query } = require("express-validator"); // Impor query untuk validasi


router.post(
  "/post",
  auth(["user", "admin"]),
  [
    body("cartId")
      .isInt()
      .withMessage("Cart ID is required and must be an integer."),
    body("name").notEmpty().withMessage("Nama lengkap wajib diisi."),
    body("phone").notEmpty().withMessage("Nomor telepon wajib diisi."),
    body("address").notEmpty().withMessage("Alamat wajib diisi."),
    body("discountCode")
      .optional()
      .isString()
      .withMessage("Discount code must be a string if provided."),
  ],
  OrderController.createOrder
);

// Rute untuk menangani notifikasi pembayaran dari Midtrans (ini adalah POST dari Midtrans)
router.post("/payment-notification", OrderController.paymentNotification);

// Rute untuk mendapatkan riwayat transaksi pengguna
router.get(
  "/transactions",
  auth(["user", "admin"]), // Hanya user atau admin yang bisa melihat riwayat transaksi
  OrderController.getTransactionHistory
);

/**
 * @desc    Memvalidasi kode diskon secara real-time
 * @route   GET /api/orders/validate-discount
 * @access  Private (user)
 */
router.get(
  "/validate-discount",
  auth(["user", "admin"]), // Hanya user/admin yang bisa memvalidasi diskon
  [
    query("code").notEmpty().withMessage("Kode diskon wajib diisi."),
    query("subtotalCart") // Ambil subtotalCart dari query
      .isFloat({ min: 0 })
      .withMessage("Subtotal keranjang harus angka positif atau nol."),
  ],
  OrderController.validateDiscount // Panggil fungsi validateDiscount dari OrderController
);

module.exports = router;
