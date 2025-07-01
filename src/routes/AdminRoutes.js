// Backend/src/routes/AdminRoutes.js
const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");
const authMiddleware = require("../middleware/authMiddleware");
const { body, param, query } = require("express-validator");
const { uploadDiscount } = require("../middleware/uploadMiddleware"); // Pastikan ini diimpor dan berfungsi

router.use(authMiddleware(["admin", "owner"])); // Semua rute di sini hanya untuk admin/owner

const allowedIndonesiaTimezones = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
];

/**
 * @desc    Create a new discount code
 * @route   POST /api/admin/discounts
 * @access  Private (admin only)
 */
router.post(
  "/discounts",
  uploadDiscount.single("image"), // Middleware untuk upload gambar
  [
    body("code").notEmpty().withMessage("Kode diskon wajib diisi."),
    body("type")
      .isIn(["percentage", "fixed"])
      .withMessage("Tipe diskon harus 'percentage' atau 'fixed'."),
    body("value")
      .isFloat({ gt: 0 })
      .withMessage("Nilai diskon harus angka positif."),
    body("active")
      .isBoolean()
      .optional()
      .withMessage("Status aktif harus boolean."),
    body("valid_until")
      .isISO8601()
      .withMessage(
        "Tanggal kedaluwarsa harus format tanggal YYYY-MM-DD yang valid."
      ),
    body("start_date")
      .isISO8601()
      .withMessage("Tanggal mulai harus format tanggal YYYY-MM-DD yang valid."),
    body("usage_limit_per_user")
      .isInt({ gt: -1 })
      .optional()
      .withMessage(
        "Batas penggunaan per user harus angka integer positif atau nol."
      ),
    body("timezone")
      .optional()
      .isIn(allowedIndonesiaTimezones)
      .withMessage(
        `Zona waktu harus salah satu dari: ${allowedIndonesiaTimezones.join(
          ", "
        )}.`
      ),
  ],
  AdminController.createDiscount
);

/**
 * @desc    Get all discount codes
 * @route   GET /api/admin/discounts
 * @access  Private (admin only)
 */
router.get("/discounts", AdminController.getAllDiscounts);

/**
 * @desc    Get a single discount code by ID
 * @route   GET /api/admin/discounts/:id
 * @access  Private (admin only)
 */
router.get(
  "/discounts/:id",
  [
    param("id").isInt().withMessage("ID diskon harus berupa angka positif."),
    query("timezone") // Ini untuk kebutuhan tampilan di frontend
      .optional()
      .isIn(allowedIndonesiaTimezones)
      .withMessage(
        `Zona waktu untuk tampilan harus salah satu dari: ${allowedIndonesiaTimezones.join(
          ", "
        )}.`
      ),
  ],
  AdminController.getDiscountById
);

/**
 * @desc    Update a discount code
 * @route   PUT /api/admin/discounts/:id
 * @access  Private (admin only)
 */
router.put(
  "/discounts/:id",
  uploadDiscount.single("image"), // Middleware untuk upload gambar (opsional)
  [
    param("id").isInt().withMessage("ID diskon harus berupa angka positif."),
    body("code")
      .optional()
      .notEmpty()
      .withMessage("Kode diskon tidak boleh kosong jika diisi."),
    body("type")
      .optional()
      .isIn(["percentage", "fixed"])
      .withMessage("Tipe diskon harus 'percentage' atau 'fixed'."),
    body("value")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Nilai diskon harus angka positif."),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Status aktif harus boolean."),
    body("valid_until")
      .optional()
      .isISO8601()
      .withMessage(
        "Tanggal kedaluwarsa harus format tanggal YYYY-MM-DD yang valid jika diisi."
      ),
    body("start_date")
      .optional()
      .isISO8601()
      .withMessage(
        "Tanggal mulai harus format tanggal YYYY-MM-DD yang valid jika diisi."
      ),
    body("usage_limit_per_user")
      .isInt({ gt: -1 })
      .optional()
      .withMessage(
        "Batas penggunaan per user harus angka integer positif atau nol."
      ),
    body("timezone")
      .optional()
      .isIn(allowedIndonesiaTimezones)
      .withMessage(
        `Zona waktu harus salah satu dari: ${allowedIndonesiaTimezones.join(
          ", "
        )}.`
      ),
    // Custom validation for image handling
    body("image") // This 'image' field in body is for existing URL or 'REMOVE_EXISTING_IMAGE' signal
      .optional()
      .custom((value, { req }) => {
        // If there's a new file upload, 'image' in body might be ignored or used for old URL
        // If value is a string and it's not 'REMOVE_EXISTING_IMAGE' and no new file, it's an old URL, which is fine
        // If value is 'REMOVE_EXISTING_IMAGE', it's a signal to delete
        if (
          value === "REMOVE_EXISTING_IMAGE" ||
          typeof value === "string" ||
          req.file
        ) {
          return true;
        }
        return false; // Should not reach here if logic is correct
      })
      .withMessage(
        "Format gambar tidak valid atau sinyal penghapusan tidak dikenal."
      ),
  ],
  AdminController.updateDiscount
);

/**
 * @desc    Delete a discount code
 * @route   DELETE /api/admin/discounts/:id
 * @access  Private (admin only)
 */
router.delete(
  "/discounts/:id",
  [param("id").isInt().withMessage("ID diskon harus berupa angka positif.")],
  AdminController.deleteDiscount
);

// --- Admin Dashboard & Reporting Routes ---
/**
 * @desc    Get dashboard summary data for admin
 * @route   GET /api/admin/dashboard-summary
 * @access  Private (admin only)
 */
router.get("/dashboard-summary", AdminController.getDashboardSummary);

/**
 * @desc    Get sales data for charts (weekly, monthly, yearly)
 * @route   GET /api/admin/sales-data
 * @access  Private (admin only)
 */
router.get(
  "/sales-data",
  [
    query("period")
      .isIn(["weekly", "monthly", "yearly"])
      .withMessage("Periode harus 'weekly', 'monthly', atau 'yearly'."),
    query("monthYear")
      .optional()
      .isString()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("Format monthYear harus YYYY-MM jika disediakan."),
    query("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 }) // Sesuaikan batas tahun
      .withMessage("Tahun harus angka 4 digit yang valid jika disediakan."),
  ],
  AdminController.getSalesData
);

/**
 * @desc    Get transactions by period (for detailed list)
 * @route   GET /api/admin/transactions-by-period
 * @access  Private (admin only)
 */
router.get(
  "/transactions-by-period",
  [
    query("period")
      .isIn(["weekly", "monthly", "yearly"])
      .withMessage("Periode harus 'weekly', 'monthly', atau 'yearly'."),
    query("monthYear")
      .optional()
      .isString()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("Format monthYear harus YYYY-MM jika disediakan."),
    query("year")
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage("Tahun harus angka 4 digit yang valid jika disediakan."),
  ],
  AdminController.getTransactionsByPeriod
);

// --- User Management Routes ---
/**
 * @desc    Get all users for admin
 * @route   GET /api/admin/users
 * @access  Private (admin/owner only)
 */
router.get("/users", AdminController.getAllUsers);

/**
 * @desc    Get a single user by ID for admin
 * @route   GET /api/admin/users/:id
 * @access  Private (admin/owner only)
 */
router.get(
  "/users/:id",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID pengguna harus berupa angka positif."),
  ],
  AdminController.getUserById
);

/**
 * @desc    Update a user's information
 * @route   PUT /api/admin/users/:id
 * @access  Private (admin/owner only)
 */
router.put(
  "/users/:id",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID pengguna harus berupa angka positif."),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama tidak boleh kosong jika diisi."),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Email tidak valid jika diisi."),
    body("role")
      .optional()
      .isIn(["user", "admin", "owner"])
      .withMessage("Peran pengguna tidak valid."),
  ],
  AdminController.updateUser
);

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin/owner only)
 */
router.delete(
  "/users/:id",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID pengguna harus berupa angka positif."),
  ],
  AdminController.deleteUser
);

// --- Order Management Routes ---
/**
 * @desc    Get all orders with optional filters
 * @route   GET /api/admin/orders
 * @access  Private (admin/owner only)
 */
router.get(
  "/orders",
  [
    query("status")
      .optional()
      .isString()
      .withMessage("Status harus berupa string."),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Format tanggal mulai harus YYYY-MM-DD jika disediakan."),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format tanggal akhir harus YYYY-MM-DD jika disediakan."),
  ],
  AdminController.getAllOrders
);


router.get(
  "/orders/:id",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID pesanan harus berupa angka positif."),
  ],
  AdminController.getOrderById
);

/**
 * @desc    Update an order's status
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private (admin/owner only)
 */
router.put(
  "/orders/:id/status",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID pesanan harus berupa angka positif."),
    body("status")
      .isIn([
        "pending",
        "processed",
        "shipped",
        "completed",
        "cancelled",
        "success",
        "settlement",
        "expire",
      ])
      .withMessage("Status pesanan tidak valid."),
  ],
  AdminController.updateOrderStatus
);

module.exports = router;
