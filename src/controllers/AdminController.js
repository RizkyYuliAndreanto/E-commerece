// Backend/src/controllers/AdminController.js
const AdminServices = require("../services/AdminServices");
const { validationResult } = require("express-validator");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize"); // Penting untuk filter tanggal dan lainnya

// Pastikan model-model ini diimpor jika digunakan langsung di controller (meskipun lebih baik melalui service)
// const { User, Order, OrderDetail, Product } = require("../models");

const allowedIndonesiaTimezones = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
];

const adminServices = new AdminServices();

// Tentukan UPLOADS_DIR_FOR_DELETE agar menunjuk ke Backend/src/Public/uploads/discounts
const UPLOADS_DIR_FOR_DELETE = path.resolve(
  __dirname,
  "../Public/uploads/discounts"
);

class AdminController {
  /**
   * @desc    Create a new discount code
   * @route   POST /api/admin/discounts
   * @access  Private (admin only)
   */
  static async createDiscount(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        // Hapus file yang mungkin sudah diupload Multer jika validasi gagal
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              "Gagal menghapus file yang diupload setelah validasi:",
              err
            );
        });
      }
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const {
        code,
        type,
        value,
        active = true,
        valid_until,
        start_date,
        usage_limit_per_user,
        timezone,
      } = req.body;

      let imageUrl = null;
      if (req.file) {
        // Dapatkan URL gambar yang bisa diakses publik
        const fileName = req.file.filename;
        imageUrl = `${
          process.env.BACKEND_URL || "http://localhost:5000"
        }/uploads/discounts/${fileName}`;
      }

      // Validasi zona waktu jika ada
      if (timezone && !allowedIndonesiaTimezones.includes(timezone)) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error(
                "Gagal menghapus file yang diupload karena timezone tidak valid:",
                err
              );
          });
        }
        return res.status(400).json({
          success: false,
          message: `Zona waktu '${timezone}' tidak valid. Gunakan salah satu dari: ${allowedIndonesiaTimezones.join(
            ", "
          )}.`,
        });
      }

      const discount = await adminServices.createDiscount({
        code,
        type,
        value,
        active,
        valid_until,
        start_date,
        image: imageUrl, // Kirim URL gambar ke service
        usage_limit_per_user,
        timezone: timezone || "Asia/Jakarta", // Default timezone
      });
      res.status(201).json({
        success: true,
        data: discount,
        message: "Diskon berhasil dibuat.",
      });
    } catch (error) {
      console.error("Error creating discount:", error);
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              "Gagal menghapus file yang diupload karena error service:",
              err
            );
        });
      }
      res
        .status(
          error.message.includes("sudah ada") ||
            error.message.includes("tidak valid")
            ? 409
            : 500 // 409 Conflict untuk duplikasi/validasi, 500 Internal Server Error
        )
        .json({
          success: false,
          message: error.message || "Gagal membuat diskon.",
        });
    }
  }

  /**
   * @desc    Get all discount codes
   * @route   GET /api/admin/discounts
   * @access  Private (admin only)
   */
  static async getAllDiscounts(req, res) {
    try {
      const discounts = await adminServices.getAllDiscounts();
      res.status(200).json({ success: true, data: discounts });
    } catch (error) {
      console.error("Error fetching discounts:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengambil daftar diskon.",
      });
    }
  }

  /**
   * @desc    Get a single discount code by ID
   * @route   GET /api/admin/discounts/:id
   * @access  Private (admin only)
   */
  static async getDiscountById(req, res) {
    try {
      const requestedTimezone = req.query.timezone || "Asia/Jakarta";
      if (!allowedIndonesiaTimezones.includes(requestedTimezone)) {
        return res.status(400).json({
          success: false,
          message: `Zona waktu '${requestedTimezone}' tidak valid untuk tampilan. Gunakan salah satu dari: ${allowedIndonesiaTimezones.join(
            ", "
          )}.`,
        });
      }
      const discount = await adminServices.getDiscountById(
        req.params.id,
        requestedTimezone
      );
      res.status(200).json({ success: true, data: discount });
    } catch (error) {
      console.error("Error fetching discount by ID:", error);
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message || "Gagal mengambil diskon.",
      });
    }
  }

  /**
   * @desc    Update a discount code
   * @route   PUT /api/admin/discounts/:id
   * @access  Private (admin only)
   */
  static async updateDiscount(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              "Gagal menghapus file yang diupload setelah validasi:",
              err
            );
        });
      }
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { timezone, ...restBody } = req.body;
      let imageUrl = undefined; // Gunakan undefined agar tidak mengupdate jika tidak ada perubahan

      // Dapatkan data diskon lama terlebih dahulu
      const oldDiscount = await adminServices.getDiscountById(req.params.id);
      if (!oldDiscount) {
        if (req.file) {
          // Jika ada file baru tapi diskon tidak ditemukan, hapus file baru
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error(
                "Gagal menghapus file baru karena diskon tidak ditemukan:",
                err
              );
          });
        }
        return res
          .status(404)
          .json({ success: false, message: "Diskon tidak ditemukan." });
      }

      // Logika penanganan gambar:
      // 1. Ada file baru diupload
      if (req.file) {
        imageUrl = `${
          process.env.BACKEND_URL || "http://localhost:5000"
        }/uploads/discounts/${req.file.filename}`;
        // Hapus gambar lama jika ada dan ada gambar baru
        if (oldDiscount.image) {
          const oldFileName = path.basename(oldDiscount.image);
          const oldImagePath = path.join(UPLOADS_DIR_FOR_DELETE, oldFileName);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err)
                console.error(
                  `Gagal menghapus gambar lama: ${oldImagePath}`,
                  err
                );
            });
          }
        }
      }
      // 2. Ada sinyal dari frontend untuk menghapus gambar yang ada
      else if (restBody.image === "REMOVE_EXISTING_IMAGE") {
        imageUrl = null; // Set di DB menjadi null
        // Hapus gambar lama dari sistem file
        if (oldDiscount.image) {
          const oldFileName = path.basename(oldDiscount.image);
          const oldImagePath = path.join(UPLOADS_DIR_FOR_DELETE, oldFileName);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err)
                console.error(
                  `Gagal menghapus gambar lama karena diset null: ${oldImagePath}`,
                  err
                );
            });
          }
        }
      }
      // 3. Tidak ada file baru dan tidak ada sinyal hapus, tapi ada `image` di body
      //    Ini berarti frontend mempertahankan URL gambar yang ada atau mengirim URL baru tanpa upload file
      else if (restBody.image !== undefined) {
        imageUrl = restBody.image; // Gunakan URL yang dikirim dari body
      }
      // 4. Jika 'image' tidak ada di body dan tidak ada file, biarkan imageUrl tetap undefined agar tidak diupdate di DB

      // Validasi zona waktu jika diubah
      if (timezone && !allowedIndonesiaTimezones.includes(timezone)) {
        if (req.file) {
          // Hapus file baru jika timezone tidak valid
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error(
                "Gagal menghapus file yang diupload karena timezone tidak valid:",
                err
              );
          });
        }
        return res.status(400).json({
          success: false,
          message: `Zona waktu '${timezone}' tidak valid. Gunakan salah satu dari: ${allowedIndonesiaTimezones.join(
            ", "
          )}.`,
        });
      }

      const updateData = {
        ...restBody,
        // Hanya update 'image' jika imageUrl diubah (bukan undefined)
        ...(imageUrl !== undefined ? { image: imageUrl } : {}),
        timezone: timezone || oldDiscount.timezone, // Pertahankan timezone lama jika tidak diubah
      };

      const discount = await adminServices.updateDiscount(
        req.params.id,
        updateData
      );
      res.status(200).json({
        success: true,
        data: discount,
        message: "Diskon berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Error updating discount:", error);
      if (req.file) {
        // Hapus file baru jika ada error service
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              "Gagal menghapus file yang diupload karena error service:",
              err
            );
        });
      }
      let statusCode = 500;
      if (error.message.includes("tidak ditemukan")) statusCode = 404;
      else if (
        error.message.includes("sudah ada") ||
        error.message.includes("tidak valid")
      )
        statusCode = 409;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Gagal memperbarui diskon.",
      });
    }
  }

  /**
   * @desc    Delete a discount code
   * @route   DELETE /api/admin/discounts/:id
   * @access  Private (admin only)
   */
  static async deleteDiscount(req, res) {
    try {
      const discountToDelete = await adminServices.getDiscountById(
        req.params.id
      );
      if (!discountToDelete) {
        return res
          .status(404)
          .json({ success: false, message: "Diskon tidak ditemukan." });
      }

      await adminServices.deleteDiscount(req.params.id);

      // Hapus file gambar fisik setelah diskon dihapus dari DB
      if (discountToDelete.image) {
        const fileName = path.basename(discountToDelete.image);
        const imagePath = path.join(UPLOADS_DIR_FOR_DELETE, fileName);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err)
              console.error(`Gagal menghapus gambar fisik: ${imagePath}`, err);
          });
        }
      }
      res
        .status(200)
        .json({ success: true, message: "Diskon berhasil dihapus." });
    } catch (error) {
      console.error("Error deleting discount:", error);
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message || "Gagal menghapus diskon.",
      });
    }
  }

  /**
   * @desc    Get all active discount codes for display to users
   * @route   GET /api/discounts/active
   * @access  Public
   */
  static async getAllActiveDiscounts(req, res) {
    try {
      const discounts = await adminServices.getAllActiveDiscounts();
      res.status(200).json({ success: true, data: discounts });
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengambil daftar promo aktif.",
      });
    }
  }

  /**
   * @desc    Claim a discount (for users)
   * @route   POST /api/discounts/claim
   * @access  Private (user and admin)
   */
  static async claimDiscount(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { discountId } = req.body;
      const userId = req.user.id;
      const userDiscount = await adminServices.claimDiscount(
        userId,
        discountId
      );
      res.status(201).json({
        success: true,
        data: userDiscount,
        message: "Diskon berhasil diklaim.",
      });
    } catch (error) {
      console.error("Error claiming discount:", error);
      let statusCode = 500;
      if (error.message.includes("tidak ditemukan")) statusCode = 404;
      else if (
        error.message.includes("tidak aktif") ||
        error.message.includes("kedaluwarsa") ||
        error.message.includes("belum dimulai") ||
        error.message.includes("batas penggunaan")
      )
        statusCode = 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Gagal mengklaim diskon.",
      });
    }
  }

  /**
   * @desc    Get all claimed discounts for a user
   * @route   GET /api/users/me/discounts
   * @access  Private (user and admin)
   */
  static async getUserClaimedDiscounts(req, res) {
    try {
      const userId = req.user.id;
      const claimedDiscounts = await adminServices.getUserClaimedDiscounts(
        userId
      );
      res.status(200).json({ success: true, data: claimedDiscounts });
    } catch (error) {
      console.error("Error fetching user claimed discounts:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengambil diskon yang diklaim.",
      });
    }
  }

  /**
   * @desc    Get dashboard summary data for admin
   * @route   GET /api/admin/dashboard-summary
   * @access  Private (admin only)
   */
  static async getDashboardSummary(req, res) {
    try {
      const summary = await adminServices.getDashboardSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil ringkasan dashboard.",
        });
    }
  }

  /**
   * @desc    Get sales data for charts (weekly, monthly, yearly)
   * @route   GET /api/admin/sales-data
   * @access  Private (admin only)
   */
  static async getSalesData(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    try {
      const { period, monthYear, year } = req.query;
      const salesData = await adminServices.getSalesData({
        period,
        monthYear,
        year,
      });
      res.status(200).json({ success: true, data: salesData });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil data penjualan.",
        });
    }
  }

  /**
   * @desc    Get transactions by period
   * @route   GET /api/admin/transactions-by-period
   * @access  Private (admin only)
   */
  static async getTransactionsByPeriod(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    try {
      const { period, monthYear, year } = req.query;
      const transactions = await adminServices.getTransactionsByPeriod({
        period,
        monthYear,
        year,
      });
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      console.error("Error fetching transactions by period:", error);
      res
        .status(500)
        .json({
          success: false,
          message:
            error.message || "Gagal mengambil transaksi berdasarkan periode.",
        });
    }
  }

  /**
   * @desc    Get all users for admin
   * @route   GET /api/admin/users
   * @access  Private (admin/owner only)
   */
  static async getAllUsers(req, res) {
    try {
      const users = await adminServices.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error("Error fetching all users for admin:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil daftar pengguna.",
        });
    }
  }

  /**
   * @desc    Get a single user by ID for admin
   * @route   GET /api/admin/users/:id
   * @access  Private (admin/owner only)
   */
  static async getUserById(req, res) {
    try {
      const user = await adminServices.getUserById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Pengguna tidak ditemukan." });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error("Error fetching user by ID for admin:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil pengguna.",
        });
    }
  }

  /**
   * @desc    Update a user's information
   * @route   PUT /api/admin/users/:id
   * @access  Private (admin/owner only)
   */
  static async updateUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    try {
      const { name, email, role } = req.body;
      // Validasi peran di sini atau di service
      if (role && !["user", "admin", "owner"].includes(role)) {
        return res
          .status(400)
          .json({ success: false, message: "Peran pengguna tidak valid." });
      }
      const user = await adminServices.updateUser(req.params.id, {
        name,
        email,
        role,
      });
      res
        .status(200)
        .json({
          success: true,
          data: user,
          message: "Pengguna berhasil diperbarui.",
        });
    } catch (error) {
      console.error("Error updating user:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal memperbarui pengguna.",
        });
    }
  }

  /**
   * @desc    Delete a user
   * @route   DELETE /api/admin/users/:id
   * @access  Private (admin/owner only)
   */
  static async deleteUser(req, res) {
    try {
      await adminServices.deleteUser(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Pengguna berhasil dihapus." });
    } catch (error) {
      console.error("Error deleting user:", error);
      res
        .status(error.message.includes("tidak ditemukan") ? 404 : 500)
        .json({
          success: false,
          message: error.message || "Gagal menghapus pengguna.",
        });
    }
  }

  /**
   * @desc    Get all orders with optional filters for admin
   * @route   GET /api/admin/orders
   * @access  Private (admin/owner only)
   */
  static async getAllOrders(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { status, startDate, endDate } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          filters.createdAt[Op.gte] = moment
            .tz(startDate, "Asia/Jakarta")
            .startOf("day")
            .toDate();
        }
        if (endDate) {
          filters.createdAt[Op.lte] = moment
            .tz(endDate, "Asia/Jakarta")
            .endOf("day")
            .toDate();
        }
      }

      const orders = await adminServices.getAllOrders(filters);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching all orders for admin:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil daftar pesanan.",
        });
    }
  }

  /**
   * @desc    Get a single order by ID for admin (with details)
   * @route   GET /api/admin/orders/:id
   * @access  Private (admin/owner only)
   */
  static async getOrderById(req, res) {
    try {
      const order = await adminServices.getOrderById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Pesanan tidak ditemukan." });
      }
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error("Error fetching order by ID for admin:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Gagal mengambil pesanan.",
        });
    }
  }

  /**
   * @desc    Update an order's status
   * @route   PUT /api/admin/orders/:id/status
   * @access  Private (admin/owner only)
   */
  static async updateOrderStatus(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { status } = req.body;
      const order = await adminServices.updateOrderStatus(
        req.params.id,
        status
      );
      res
        .status(200)
        .json({
          success: true,
          data: order,
          message: "Status pesanan berhasil diperbarui.",
        });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message || "Gagal memperbarui status pesanan.",
      });
    }
  }
}

module.exports = AdminController;
