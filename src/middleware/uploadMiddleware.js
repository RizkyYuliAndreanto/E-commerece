// Backend/src/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tentukan BASE_DIR sebagai root untuk perhitungan path upload.
// Karena file ini ada di 'Backend/src/middleware', dan folder 'Public' ada di 'Backend/src/Public',
// kita perlu naik satu level ('..') dari 'middleware' ke 'src', lalu masuk ke 'Public'.
const publicDirForUpload = path.resolve(__dirname, "../Public"); // Ini akan menunjuk ke Backend/src/Public

// Direktori dasar untuk semua upload relatif terhadap publicDirForUpload
const baseUploadDir = path.join(publicDirForUpload, "uploads"); // Ini akan menunjuk ke Backend/src/Public/uploads

// Pastikan direktori dasar ada
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const storageConfig = (folderName) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const targetDir = path.join(baseUploadDir, folderName);
      // Pastikan sub-direktori spesifik ada
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir); // Path absolut ke folder target
    },
    filename: function (req, file, cb) {
      // Memberi nama file unik
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

// Konfigurasi upload untuk produk
const uploadProduct = multer({
  storage: storageConfig("products"), // Simpan di Backend/src/Public/uploads/products
  limits: { fileSize: 5 * 1024 * 1024 }, // Batasan ukuran file (5MB)
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Hanya gambar yang diizinkan (jpeg, jpg, png, gif)!"));
  },
});

// Konfigurasi upload untuk diskon
const uploadDiscount = multer({
  storage: storageConfig("discounts"), // Simpan di Backend/src/Public/uploads/discounts
  limits: { fileSize: 3 * 1024 * 1024 }, // Misalnya, batasan 3MB untuk diskon
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Error: Hanya gambar yang diizinkan untuk diskon (jpeg, jpg, png, gif)!"
      )
    );
  },
});

module.exports = { uploadProduct, uploadDiscount };
