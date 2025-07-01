// Backend/src/models/order.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      this.belongsTo(models.Cart, { foreignKey: "cart_id", as: "cart" });
      this.belongsTo(models.Discount, {
        foreignKey: "discount_id",
        as: "discount",
      });
      // PERBAIKAN: Pastikan ini merujuk ke models.OrderItem
      this.hasMany(models.OrderItem, { foreignKey: "order_id", as: "items" }); // MENGGUNAKAN OrderItem
      this.hasOne(models.Transaction, {
        foreignKey: "order_id",
        as: "transaction",
      });
    }
  }

  Order.init(
    {
      user_id: DataTypes.INTEGER,
      cart_id: DataTypes.INTEGER,
      total_price: DataTypes.FLOAT, // Total harga sebelum diskon
      discount_id: { type: DataTypes.INTEGER, allowNull: true }, // Izinkan null jika tanpa diskon
      final_price: DataTypes.FLOAT, // Harga setelah diskon
      // Tambahkan kolom untuk total_amount jika itu yang digunakan di service
      total_amount: {
        // Kolom ini akan digunakan di AdminServices.getSalesData
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
      },
      payment_status: {
        type: DataTypes.ENUM(
          "pending",
          "capture",
          "settlement",
          "expire",
          "deny",
          "cancel",
          "refund",
          "partial_refund",
          "challenge"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      payment_method: { type: DataTypes.STRING, allowNull: true },
      midtrans_order_id: { type: DataTypes.STRING, allowNull: true },
      status: {
        // Status internal pesanan
        type: DataTypes.ENUM(
          "pending", // Pesanan dibuat, menunggu pembayaran (atau sedang diproses)
          "processed", // Pembayaran diterima, pesanan sedang disiapkan
          "shipped", // Pesanan sudah dikirim
          "completed", // Pesanan sudah diterima pelanggan
          "cancelled", // Pesanan dibatalkan
          "refunded", // Pesanan dikembalikan dana
          "failed" // Pembayaran gagal atau pesanan gagal dipenuhi
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      midtrans_response_webhook: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
    }
  );
  return Order;
};
