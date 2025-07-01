const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // Pastikan path ini benar
const AdminController = require("../controllers/AdminController"); // Pastikan path ini benar dan controller ini diimpor untuk fungsi diskon
const { body, query } = require("express-validator"); // Penting: Pastikan ini diimpor untuk validator

// Impor controller otentikasi utama Anda
const { register, login, getMe } = require("../controllers/authController");

// Rute Autentikasi Dasar

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", register); //

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post("/login", login); //

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user's profile
 * @access Private (user, admin)
 */
// Pastikan middleware auth digunakan dengan benar
router.get("/me", auth(["user", "admin"]), getMe); //

// Rute Terkait Diskon (Tambahan)

/**
 * @route POST /api/auth/discounts/claim
 * @desc Allow a user to claim a discount
 * @access Private (user, admin)
 */
router.post(
  "/discounts/claim",
  [
    auth(["user", "admin"]), // Middleware otentikasi dan otorisasi
    // Validator untuk body request
    body("discountId")
      .isInt({ gt: 0 }) // discountId harus integer positif
      .withMessage("ID diskon harus berupa angka integer positif."),
  ],
  AdminController.claimDiscount // Fungsi controller untuk mengklaim diskon
);

/**
 * @route GET /api/auth/users/me/discounts
 * @desc Get all discounts claimed by the authenticated user
 * @access Private (user, admin)
 */
router.get(
  "/users/me/discounts",
  [
    auth(["user", "admin"]), // Middleware otentikasi dan otorisasi
    // Tidak ada validator body atau query spesifik yang diperlukan untuk rute ini
  ],
  AdminController.getUserClaimedDiscounts // Fungsi controller untuk mendapatkan diskon yang diklaim
);

module.exports = router;
