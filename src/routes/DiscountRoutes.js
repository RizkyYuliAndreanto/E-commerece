// Backend/src/routes/DiscountRoutes.js
const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController"); // Gunakan controller yang sama
const authMiddleware = require("../middleware/authMiddleware"); // Middleware untuk user terautentikasi
const { body } = require("express-validator");

// Endpoint untuk mendapatkan semua diskon aktif (tidak perlu admin, tapi tidak perlu auth juga untuk melihat)
/**
 * @desc    Get all active discount codes for display to users
 * @route   GET /api/discounts/active
 * @access  Public
 */
router.get("/active", AdminController.getAllActiveDiscounts);

// Endpoint untuk mengklaim diskon (membutuhkan otentikasi user)
/**
 * @desc    Claim a discount code by a user
 * @route   POST /api/discounts/claim
 * @access  Private (user and admin)
 */
router.post(
  "/claim",
  authMiddleware(["user", "admin", "owner"]), // Hanya user terautentikasi yang bisa klaim
  [
    body("discountId")
      .isInt()
      .withMessage("ID diskon harus berupa angka.")
      .notEmpty()
      .withMessage("ID diskon wajib diisi."),
  ],
  AdminController.claimDiscount
);

// Endpoint untuk mendapatkan diskon yang diklaim oleh user (membutuhkan otentikasi user)
/**
 * @desc    Get all claimed discounts for a specific user
 * @route   GET /api/users/me/discounts
 * @access  Private (user and admin)
 */
router.get(
  "/users/me/discounts",
  authMiddleware(["user", "admin", "owner"]), // Hanya user terautentikasi yang bisa melihat klaimnya
  AdminController.getUserClaimedDiscounts
);

module.exports = router;
