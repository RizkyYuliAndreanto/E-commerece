// controllers/OrderController.js
const { Order, Transaction, User } = require("../models");
const OrderServices = require("../services/OrderServices");
const { validationResult } = require("express-validator");

// Buat instance OrderServices sekali untuk digunakan di semua method
const orderServices = new OrderServices();

class OrderController {
  /**
   * @desc    Membuat pesanan baru
   * @route   POST /api/orders/post
   * @access  Private (user)
   */
  static async createOrder(req, res) {
    // Tangani hasil validasi dari express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    } 

    try {
      const { items, name, phone, description, address, cartId, discountCode } =
        req.body;
      const user = req.user; // Data user dari authMiddleware

      if (!user || !user.id || !user.email) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User data missing.",
        });
      }

      const result = await orderServices.createOrder({
        userId: user.id,
        email: user.email,
        items,
        name,
        phone,
        address,
        description,
        cartId,
        discountCode,
      });

      res.status(201).json({
        success: true,
        data: {
          order_id: result.order.id,
          payment_url: result.payment_url,
          transaction_id: result.transaction.id,
          snap_token: result.transaction.snap_token,
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      // Penanganan error lebih spesifik
      if (
        error.message.includes("Keranjang kosong") ||
        error.message.includes("Produk dengan ID") ||
        error.message.includes("Stok produk")
      ) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes("Diskon")) {
        // Untuk error validasi diskon
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Gagal membuat pesanan",
      });
    }
  }

  /**
   * @desc    Menangani notifikasi webhook pembayaran Midtrans
   * @route   POST /api/orders/payment-notification
   * @access  Public (dipanggil oleh Midtrans)
   */
  static async paymentNotification(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("Webhook notification received with empty body.");
        return res
          .status(400)
          .json({ success: false, message: "Empty notification body" });
      }

      await orderServices.handlePaymentNotification(req.body);

      res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (error) {
      console.error("Error handling payment notification:", error);
      if (error.message.includes("Invalid signature key")) {
        return res.status(403).json({ success: false, message: error.message }); // 403 Forbidden untuk signature tidak valid
      }
      if (error.message.includes("Order dengan ID internal")) {
        return res.status(404).json({ success: false, message: error.message }); // 404 Not Found untuk order tidak ditemukan
      }
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memproses notifikasi pembayaran",
      });
    }
  }

  /**
   * @desc    Mendapatkan riwayat transaksi pengguna
   * @route   GET /api/orders/transactions
   * @access  Private (user)
   */
  static async getTransactionHistory(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID not found.",
        });
      }

      // Menggunakan method dari OrderServices untuk mendapatkan riwayat transaksi
      const transactions = await orderServices.getUserTransactionHistory(
        req.user.id
      );

      res.json({ success: true, data: transactions });
    } catch (error) {
      console.error("Error getting transaction history:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengambil riwayat transaksi",
      });
    }
  }

  /**
   * @desc    Memvalidasi kode diskon secara real-time
   * @route   GET /api/orders/validate-discount
   * @access  Private (user)
   */
  static async validateDiscount(req, res) {
    try {
      // Ambil 'code' DAN 'subtotalCart' dari query parameter
      const { code, subtotalCart } = req.query;
      const userId = req.user.id;

      if (!code) {
        return res
          .status(400)
          .json({ success: false, message: "Kode diskon wajib diisi" });
      }

      // Pastikan subtotalCart adalah angka. Gunakan parseFloat karena datang dari query string.
      // Berikan nilai default 0 jika tidak ada atau tidak valid, untuk mencegah NaN.
      const parsedSubtotalCart = parseFloat(subtotalCart) || 0;

      // Teruskan `subtotalCart` ke service
      const { discount, discountAmount } = await orderServices.validateDiscount(
        { userId, code, subtotalCart: parsedSubtotalCart }
      );

      res.status(200).json({
        success: true,
        discount,
        discountAmount,
        message: "Diskon berhasil divalidasi.", // Tambah pesan sukses
      });
    } catch (error) {
      console.error("Error validating discount:", error);
      // Pesan error dari service sudah cukup informatif
      res.status(400).json({
        // Biasanya 400 untuk validasi input/kondisi
        success: false,
        message: error.message || "Kode diskon tidak valid",
      });
    }
  }
}

module.exports = OrderController;
