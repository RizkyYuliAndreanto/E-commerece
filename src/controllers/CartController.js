// controllers/CartController.js
const cartService = require("../services/CartServices");

exports.getCartByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Menggunakan getCartItems untuk mendapatkan item keranjang, yang sudah termasuk cart detail
    const items = await cartService.getCartItems(userId); // Ini akan mengembalikan array items, bukan objek cart

    // Jika Anda ingin mengembalikan objek cart lengkap (termasuk is_active dll)
    // maka gunakan: const cart = await cartService.getOrCreateCart(userId);
    // dan kembalikan res.json({ success: true, data: cart });
    // Untuk konsistensi dengan /api/cart, mungkin lebih baik mengembalikan array item.

    res.json({
      success: true,
      data: items,
      message: "Item keranjang berhasil diambil berdasarkan user ID.",
    });
  } catch (err) {
    console.error("Error in getCartByUserId:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil keranjang berdasarkan user ID.",
      error: err.message,
    });
  }
};

exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Dipastikan ada dari authMiddleware

    // Basic validation
    if (!productId || typeof productId !== "number" || productId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID tidak valid." });
    }
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Kuantitas tidak valid." });
    }

    const cartItem = await cartService.addItemToCart(
      userId,
      productId,
      quantity
    );
    res.status(201).json({
      success: true,
      data: cartItem,
      message: "Item berhasil ditambahkan/diperbarui di keranjang.",
    });
  } catch (error) {
    console.error("Error in addItemToCart:", error);

    // Penanganan error yang lebih spesifik dari service
    if (
      error.message.includes("Product not found") ||
      error.message.includes("tidak ditemukan")
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes("tidak mencukupi")) {
      return res.status(400).json({ success: false, message: error.message }); // 400 karena permintaan tidak bisa diproses
    }
    if (
      error.message.includes("required") ||
      error.message.includes("valid quantity")
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan item ke keranjang.",
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Tidak terautentikasi: ID pengguna tidak ditemukan.",
      });
    }

    const items = await cartService.getCartItems(req.user.id);

    res.json({
      success: true,
      data: items,
      message: "Item keranjang berhasil diambil.",
    });
  } catch (err) {
    console.error("Error in getCart:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil item keranjang.",
      error: err.message,
    });
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10); // Pastikan ini di-parse sebagai integer
    const userId = req.user.id; // Dipastikan ada dari authMiddleware

    if (isNaN(productId) || productId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID tidak valid." });
    }

    await cartService.removeItemFromCart(userId, productId);
    res.json({
      success: true,
      message: "Item berhasil dihapus dari keranjang.",
    });
  } catch (err) {
    console.error("Error in removeItemFromCart:", err);

    if (
      err.message.includes("Item not found in cart") ||
      err.message.includes("tidak ditemukan")
    ) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Gagal menghapus item dari keranjang.",
      error: err.message,
    });
  }
};
