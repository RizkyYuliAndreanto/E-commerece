// Backend/src/services/AdminServices.js
const {
  Order,
  Transaction,
  User,
  Product,
  OrderItem, // Pastikan ini OrderItem, bukan OrderDetail
  Discount,
  UserDiscount,
} = require("../models"); // Pastikan semua model yang relevan diimpor
const { Op, fn, col, literal, QueryTypes } = require("sequelize"); // Impor operator dan fungsi Sequelize
const moment = require("moment-timezone"); // Pastikan moment-timezone terinstal (npm install moment-timezone)

class AdminServices {
  constructor() {
    // Inisialisasi jika diperlukan
  }

  // ===========================================
  // Helper Functions for Database Dialect Compatibility
  // ===========================================
  // Pastikan Anda memiliki variabel lingkungan DB_DIALECT di file .env Anda (misal: DB_DIALECT=mysql atau DB_DIALECT=postgres)

  /**
   * Mengembalikan fungsi Sequelize untuk 'date_trunc' atau setara berdasarkan dialect database.
   * Digunakan untuk mengelompokkan data berdasarkan unit waktu (hari, bulan).
   * @param {string} unit - 'day', 'month', 'year'
   * @param {string} columnName - Nama kolom tanggal sebagai STRING (misal: 'Order.createdAt')
   * @returns {any} Fungsi Sequelize (fn) yang merepresentasikan DATE_TRUNC/DATE_FORMAT
   */
  getDatabaseDateTrunc(unit, columnName) {
    const dialect = process.env.DB_DIALECT || "postgres"; // Default ke postgres jika tidak disetel

    switch (dialect) {
      case "postgres":
        return fn("date_trunc", unit, col(columnName));
      case "mysql":
        if (unit === "day")
          return fn("DATE_FORMAT", col(columnName), "%Y-%m-%d");
        if (unit === "month")
          return fn("DATE_FORMAT", col(columnName), "%Y-%m-01");
        if (unit === "year")
          return fn("DATE_FORMAT", col(columnName), "%Y-01-01");
        break;
      case "sqlite":
        if (unit === "day") return fn("strftime", "%Y-%m-%d", col(columnName));
        if (unit === "month")
          return fn("strftime", "%Y-%m-01", col(columnName));
        if (unit === "year") return fn("strftime", "%Y-01-01", col(columnName));
        break;
      default:
        throw new Error(
          `Database dialect '${dialect}' is not supported for date_trunc emulation.`
        );
    }
  }

  /**
   * Mengembalikan fungsi Sequelize untuk memformat tanggal menjadi string (setara 'to_char').
   * Digunakan untuk label grafik.
   * @param {string} columnName - Nama kolom tanggal sebagai STRING
   * @param {string} format - Format yang diinginkan ('YYYY-MM-DD', 'YYYY-MM')
   * @returns {any} Fungsi Sequelize (fn) yang merepresentasikan TO_CHAR/DATE_FORMAT
   */
  getDatabaseDateFormat(columnName, format) {
    const dialect = process.env.DB_DIALECT || "postgres"; // Default ke postgres jika tidak disetel

    switch (dialect) {
      case "postgres":
        if (format === "YYYY-MM-DD")
          return fn("to_char", col(columnName), "YYYY-MM-DD");
        if (format === "YYYY-MM")
          return fn("to_char", col(columnName), "YYYY-MM");
        break;
      case "mysql":
        if (format === "YYYY-MM-DD")
          return fn("DATE_FORMAT", col(columnName), "%Y-%m-%d");
        if (format === "YYYY-MM")
          return fn("DATE_FORMAT", col(columnName), "%Y-%m");
        break;
      case "sqlite":
        if (format === "YYYY-MM-DD")
          return fn("strftime", "%Y-%m-%d", col(columnName));
        if (format === "YYYY-MM")
          return fn("strftime", "%Y-%m", col(columnName));
        break;
      default:
        throw new Error(
          `Database dialect '${dialect}' is not supported for date formatting.`
        );
    }
  }

  // ===========================================
  // Discount Management Services
  // ===========================================

  async createDiscount(discountData) {
    const {
      code,
      type,
      value,
      active = true,
      valid_until,
      start_date,
      image,
      usage_limit_per_user,
      timezone,
    } = discountData;

    const existingDiscount = await Discount.findOne({ where: { code } });
    if (existingDiscount) {
      throw new Error("Kode diskon sudah ada.");
    }

    const parsedStartDate = moment
      .tz(start_date, timezone || "Asia/Jakarta")
      .startOf("day")
      .toDate();
    const parsedValidUntil = moment
      .tz(valid_until, timezone || "Asia/Jakarta")
      .endOf("day")
      .toDate();

    if (parsedStartDate.getTime() >= parsedValidUntil.getTime()) {
      throw new Error("Tanggal mulai harus sebelum tanggal berakhir.");
    }

    const discount = await Discount.create({
      code,
      type,
      value,
      active,
      start_date: parsedStartDate,
      valid_until: parsedValidUntil,
      image,
      usage_limit_per_user,
      timezone: timezone || "Asia/Jakarta",
    });
    return discount;
  }

  async getAllDiscounts() {
    const discounts = await Discount.findAll({
      order: [["createdAt", "DESC"]],
    });
    return discounts;
  }

  async getDiscountById(id) {
    const discount = await Discount.findByPk(id);
    if (!discount) {
      throw new Error("Diskon tidak ditemukan.");
    }
    return discount;
  }

  async updateDiscount(id, updateData) {
    const discount = await Discount.findByPk(id);
    if (!discount) {
      throw new Error("Diskon tidak ditemukan.");
    }

    if (updateData.code && updateData.code !== discount.code) {
      const existingDiscount = await Discount.findOne({
        where: { code: updateData.code },
      });
      if (existingDiscount && existingDiscount.id !== parseInt(id)) {
        throw new Error("Kode diskon sudah ada.");
      }
    }

    const effectiveTimezone =
      updateData.timezone || discount.timezone || "Asia/Jakarta";

    if (updateData.start_date) {
      updateData.start_date = moment
        .tz(updateData.start_date, effectiveTimezone)
        .startOf("day")
        .toDate();
    }
    if (updateData.valid_until) {
      updateData.valid_until = moment
        .tz(updateData.valid_until, effectiveTimezone)
        .endOf("day")
        .toDate();
    }

    const finalStartDate =
      updateData.start_date !== undefined
        ? updateData.start_date
        : discount.start_date;
    const finalValidUntil =
      updateData.valid_until !== undefined
        ? updateData.valid_until
        : discount.valid_until;

    if (
      finalStartDate &&
      finalValidUntil &&
      finalStartDate.getTime() >= finalValidUntil.getTime()
    ) {
      throw new Error("Tanggal mulai harus sebelum tanggal berakhir.");
    }

    await discount.update(updateData);
    return discount;
  }

  async deleteDiscount(id) {
    const discount = await Discount.findByPk(id);
    if (!discount) {
      throw new Error("Diskon tidak ditemukan.");
    }
    await discount.destroy();
    return true;
  }

  async getAllActiveDiscounts() {
    const now = moment().tz("Asia/Jakarta").toDate();
    const discounts = await Discount.findAll({
      where: {
        active: true,
        start_date: { [Op.lte]: now },
        valid_until: { [Op.gte]: now },
      },
      order: [["createdAt", "DESC"]],
    });
    return discounts;
  }

  async claimDiscount(userId, discountId) {
    const discount = await Discount.findByPk(discountId);
    if (!discount) {
      throw new Error("Diskon tidak ditemukan.");
    }
    if (!discount.active) {
      throw new Error("Diskon tidak aktif.");
    }

    const now = moment().tz(discount.timezone || "Asia/Jakarta");
    const startDate = moment.tz(
      discount.start_date,
      discount.timezone || "Asia/Jakarta"
    );
    const validUntil = moment.tz(
      discount.valid_until,
      discount.timezone || "Asia/Jakarta"
    );

    if (now.isBefore(startDate)) {
      throw new Error("Diskon belum dimulai.");
    }
    if (now.isAfter(validUntil)) {
      throw new Error("Diskon sudah kedaluwarsa.");
    }

    if (discount.usage_limit_per_user > 0) {
      const userClaimsCount = await UserDiscount.count({
        where: { userId, discountId },
      });
      if (userClaimsCount >= discount.usage_limit_per_user) {
        throw new Error(
          "Anda telah mencapai batas penggunaan untuk diskon ini."
        );
      }
    }

    const userDiscount = await UserDiscount.create({ userId, discountId });
    return userDiscount;
  }

  async getUserClaimedDiscounts(userId) {
    const claimedDiscounts = await UserDiscount.findAll({
      where: { userId },
      include: [
        {
          model: Discount,
          as: "discount",
          attributes: [
            "id",
            "code",
            "type",
            "value",
            "active",
            "valid_until",
            "start_date",
            "image",
            "usage_limit_per_user",
            "timezone",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return claimedDiscounts;
  }

  // ===========================================
  // Dashboard and Reporting Services
  // ===========================================

  async getDashboardSummary() {
    const totalSales = await Transaction.sum("amount", {
      where: {
        payment_status: { [Op.in]: ["success", "settlement"] }, // Pastikan status di Transaction
      },
    });

    const productsSoldResult = await OrderItem.sum("quantity", {
      // PERBAIKAN: Gunakan OrderItem, bukan OrderDetail
      include: {
        model: Order,
        where: { status: { [Op.in]: ["success", "settlement"] } },
        attributes: [],
      },
    });
    const productsSold = productsSoldResult || 0;

    const thirtyDaysAgo = moment().subtract(30, "days").toDate();
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
    });

    const completedOrders = await Order.count({
      where: {
        status: { [Op.in]: ["completed"] }, // Hanya 'completed' untuk pesanan selesai
      },
    });

    const recentTransactions = await Order.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["name", "email"] }], // PERBAIKAN: Tambah alias 'as: user'
    });

    return {
      totalSales: totalSales || 0,
      productsSold,
      newUsers,
      completedOrders,
      recentTransactions,
    };
  }

  /**
   * Mengambil data penjualan untuk grafik (mingguan, bulanan, tahunan).
   * Menggunakan helper untuk kompatibilitas database.
   * @param {string} period - 'weekly', 'monthly', 'yearly'
   * @param {string} [monthYear] - 'YYYY-MM' for monthly/weekly
   * @param {number} [year] - for yearly
   */
  async getSalesData({ period, monthYear, year }) {
    let groupByUnit; // Unit untuk grouping ('day', 'month', 'year')
    let labelFormat; // Format string untuk label tanggal
    let startDate;
    let endDate;
    const orderCreatedAtCol = "Order.createdAt"; // Nama kolom sebagai STRING

    switch (period) {
      case "weekly":
      case "monthly":
        if (!monthYear || !moment(monthYear, "YYYY-MM", true).isValid()) {
          throw new Error(
            "monthYear wajib diisi dan valid untuk periode bulanan/mingguan (YYYY-MM)."
          );
        }
        startDate = moment
          .tz(monthYear, "Asia/Jakarta")
          .startOf("month")
          .toDate();
        endDate = moment.tz(monthYear, "Asia/Jakarta").endOf("month").toDate();
        groupByUnit = "day";
        labelFormat = "YYYY-MM-DD";
        break;
      case "yearly":
        const parsedYear = parseInt(year, 10);
        if (
          isNaN(parsedYear) ||
          parsedYear < 2000 ||
          parsedYear > moment().year() + 1
        ) {
          throw new Error("Tahun wajib diisi dan valid untuk periode tahunan.");
        }
        startDate = moment
          .tz(`${parsedYear}-01-01`, "Asia/Jakarta")
          .startOf("year")
          .toDate();
        endDate = moment
          .tz(`${parsedYear}-12-31`, "Asia/Jakarta")
          .endOf("year")
          .toDate();
        groupByUnit = "month";
        labelFormat = "YYYY-MM";
        break;
      default:
        throw new Error("Periode tidak didukung.");
    }

    // Mendapatkan ekspresi untuk ORDER BY (sama dengan label)
    const orderByExpression = this.getDatabaseDateFormat(
      orderCreatedAtCol,
      labelFormat
    );

    const sales = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        status: { [Op.in]: ["success", "settlement"] },
      },
      attributes: [
        [
          this.getDatabaseDateFormat(orderCreatedAtCol, labelFormat), // Memberikan nama kolom sebagai STRING
          "label",
        ],
        [fn("sum", col("total_amount")), "totalSales"], // Menggunakan col("total_amount")
      ],
      group: [this.getDatabaseDateTrunc(groupByUnit, orderCreatedAtCol)], // Memberikan nama kolom sebagai STRING
      order: [[orderByExpression, "ASC"]], // PERBAIKAN: Gunakan ekspresi lengkap di ORDER BY
      raw: true,
    });

    if (period === "yearly") {
      return sales.map((item) => ({
        label: moment(item.label).format("MMM"),
        totalSales: parseFloat(item.totalSales),
      }));
    }
    return sales.map((item) => ({
      label: item.label,
      totalSales: parseFloat(item.totalSales),
    }));
  }

  /**
   * Mengambil detail transaksi berdasarkan periode.
   * @param {string} period - 'weekly', 'monthly', 'yearly'
   * @param {string} [monthYear] - 'YYYY-MM' for monthly/weekly
   * @param {number} [year] - for yearly
   */
  async getTransactionsByPeriod({ period, monthYear, year }) {
    let startDate;
    let endDate;
    let whereClause = {};

    switch (period) {
      case "weekly":
      case "monthly":
        if (!monthYear || !moment(monthYear, "YYYY-MM", true).isValid()) {
          throw new Error(
            "monthYear wajib diisi dan valid untuk periode bulanan/mingguan (YYYY-MM)."
          );
        }
        startDate = moment
          .tz(monthYear, "Asia/Jakarta")
          .startOf("month")
          .toDate();
        endDate = moment.tz(monthYear, "Asia/Jakarta").endOf("month").toDate();
        break;
      case "yearly":
        const parsedYear = parseInt(year, 10);
        if (
          isNaN(parsedYear) ||
          parsedYear < 2000 ||
          parsedYear > moment().year() + 1
        ) {
          throw new Error("Tahun wajib diisi dan valid untuk periode tahunan.");
        }
        startDate = moment
          .tz(`${parsedYear}-01-01`, "Asia/Jakarta")
          .startOf("year")
          .toDate();
        endDate = moment
          .tz(`${parsedYear}-12-31`, "Asia/Jakarta")
          .endOf("year")
          .toDate();
        break;
      default:
        throw new Error("Periode tidak didukung.");
    }

    whereClause.createdAt = {
      [Op.between]: [startDate, endDate],
    };

    const transactions = await Order.findAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ], // PERBAIKAN: Tambah alias 'as: user'
      order: [["createdAt", "DESC"]],
    });

    return transactions;
  }

  // --- User Management Services ---

  async getAllUsers(filters = {}) {
    const users = await User.findAll({
      where: filters,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    return users;
  }

  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    return user;
  }

  async updateUser(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    await user.update(updateData);
    return user;
  }

  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    await user.destroy();
    return true;
  }

  // --- Order Management Services ---

  async getAllOrders(filters = {}) {
    const orders = await Order.findAll({
      where: filters,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ], // PERBAIKAN: Tambah alias 'as: user'
      order: [["createdAt", "DESC"]],
    });
    return orders;
  }

  async getOrderById(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] }, // PERBAIKAN: Tambah alias 'as: user'
        {
          model: OrderItem, // PERBAIKAN: Gunakan OrderItem, bukan OrderDetail
          include: [
            { model: Product, attributes: ["id", "name", "image_url"] },
          ],
        },
      ],
    });
    if (!order) {
      throw new Error("Pesanan tidak ditemukan.");
    }
    return order;
  }

  async updateOrderStatus(orderId, newStatus) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error("Pesanan tidak ditemukan.");
    }
    await order.update({ status: newStatus });
    return order;
  }
}

module.exports = AdminServices;
