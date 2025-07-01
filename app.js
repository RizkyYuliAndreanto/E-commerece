// Backend/app.js (Lokasi di root folder Backend)
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Impor rute-rute Anda (jalur relatif dari app.js di root ke src/routes)
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/ProductsRoutes");
const cartRoutes = require("./src/routes/CartRoutes");
const OrderRoutes = require("./src/routes/OrderRoutes");
const adminRoutes = require("./src/routes/AdminRoutes.js");
const discountRoutes = require("./src/routes/DiscountRoutes");

// Impor middleware otentikasi (jalur relatif dari app.js di root ke src/middleware)
const authMiddleware = require("./src/middleware/authMiddleware");

const app = express();

app.use(express.json()); // Middleware untuk parsing JSON body

// Konfigurasi CORS untuk mengizinkan permintaan dari frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Sesuaikan dengan URL frontend Anda
    credentials: true,
  })
);

// --- KONFIGURASI PATH UPLOAD DAN SERVING FILE STATIS YANG BENAR UNTUK STRUKTUR SAAT INI ---

// Karena app.js ada di 'Backend/', dan folder Public ada di 'Backend/src/Public/',
// maka kita perlu menyusun path dengan benar.
const publicDir = path.join(__dirname, "src", "Public"); // Ini akan menunjuk ke Backend/src/Public

// Direktori dasar untuk semua upload dan file statis
const uploadsRootPath = path.join(publicDir, "uploads"); // Ini akan menunjuk ke Backend/src/Public/uploads

// Tambahkan logging untuk memverifikasi jalur
console.log("BASE DIRECTORY (app.js __dirname):", __dirname);
console.log("Public Directory Path (Corrected):", publicDir);
console.log("Uploads Root Path (untuk serving statis):", uploadsRootPath);

// Direktori spesifik untuk gambar produk dan diskon
const productUploadDir = path.join(uploadsRootPath, "products");
const discountUploadDir = path.join(uploadsRootPath, "discounts");

// Pastikan direktori uploads dan sub-direktorinya ada
if (!fs.existsSync(uploadsRootPath)) {
  console.log(
    "Membuat direktori uploadsRootPath karena tidak ada:",
    uploadsRootPath
  );
  fs.mkdirSync(uploadsRootPath, { recursive: true });
}
if (!fs.existsSync(productUploadDir)) {
  console.log(
    "Membuat direktori productUploadDir karena tidak ada:",
    productUploadDir
  );
  fs.mkdirSync(productUploadDir, { recursive: true });
}
if (!fs.existsSync(discountUploadDir)) {
  console.log(
    "Membuat direktori discountUploadDir karena tidak ada:",
    discountUploadDir
  );
  fs.mkdirSync(discountUploadDir, { recursive: true });
}

// Menyajikan file statis dari direktori 'uploadsRootPath'
// Ini berarti file di 'Backend/src/Public/uploads/' akan dapat diakses
// melalui URL '/uploads/' (misal: http://localhost:5000/uploads/discounts/image.png)
app.use("/uploads", express.static(uploadsRootPath));

// --- Penggunaan Rute-Rute Aplikasi ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", authMiddleware(), cartRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/discounts", discountRoutes);

app.get(
  "/api/admin/dashboard",
  authMiddleware(["admin", "owner"]),
  (req, res) => {
    res.json({ success: true, message: "Selamat datang di dasbor admin" });
  }
);

// Middleware penanganan kesalahan umum
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Ada yang tidak beres!");
});

module.exports = app;
