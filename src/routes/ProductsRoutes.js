// Backend/src/routes/ProductsRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const { uploadProduct } = require("../middleware/uploadMiddleware"); // Pastikan ini diimpor
const authMiddleware = require("../middleware/authMiddleware"); // Tambahkan import ini
const { body, param } = require("express-validator"); // Tambahkan import ini untuk validasi input

// Rute Publik (siapa saja bisa melihat produk)
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Rute yang Dilindungi (hanya untuk admin/owner)
router.post(
  "/",
  authMiddleware(["admin", "owner"]), // Lindungi rute create
  uploadProduct.single("image"), // Middleware untuk upload gambar
  [
    body("name").notEmpty().withMessage("Nama produk wajib diisi."),
    body("description").notEmpty().withMessage("Deskripsi produk wajib diisi."),
    body("price").isFloat({ gt: 0 }).withMessage("Harga harus angka positif."),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stok harus angka non-negatif."),
    body("category").notEmpty().withMessage("Kategori wajib diisi."),
    // Multer sudah memastikan file ada, express-validator bisa validasi lebih lanjut jika diperlukan
  ],
  productController.create
);

router.put(
  "/:id",
  authMiddleware(["admin", "owner"]), // Lindungi rute update
  uploadProduct.single("image"), // Middleware untuk upload gambar (opsional)
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID produk harus berupa angka positif."),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama produk tidak boleh kosong jika diisi."),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Deskripsi produk tidak boleh kosong jika diisi."),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Harga harus angka positif jika diisi."),
    body("stock")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stok harus angka non-negatif jika diisi."),
    body("category")
      .optional()
      .notEmpty()
      .withMessage("Kategori tidak boleh kosong jika diisi."),
    // Custom validation for image_url handling (for existing URL or 'REMOVE_EXISTING_IMAGE' signal)
    body("image_url") // This 'image_url' field in body is for existing URL or 'REMOVE_EXISTING_IMAGE' signal
      .optional()
      .custom((value, { req }) => {
        // If there's a new file upload, 'image_url' in body might be ignored or used for old URL
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
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware(["admin", "owner"]), // Lindungi rute delete
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID produk harus berupa angka positif."),
  ],
  productController.deleteProduct
);

module.exports = router;
