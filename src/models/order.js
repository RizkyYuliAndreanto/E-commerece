"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Relasi ke User
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Relasi ke Cart
      this.belongsTo(models.Cart, {
        foreignKey: "cart_id", // ✅ Diperbaiki: foreignKey benar
        as: "cart",
      });

      // Relasi ke Discount
      this.belongsTo(models.Discount, {
        foreignKey: "discount_id", // ✅ Diperbaiki
        as: "discount",
      });

      // Relasi ke OrderItem — satu order bisa punya banyak item
      this.hasMany(models.OrderItem, {
        foreignKey: "order_id", // ✅ Diperbaiki dari "Oreder_id"
        as: "items",
      });
    }
  }

  Order.init(
    {
      user_id: DataTypes.INTEGER,
      cart_id: DataTypes.INTEGER,
      total_price: DataTypes.FLOAT,
      discount_id: DataTypes.INTEGER,
      final_price: DataTypes.FLOAT,
      payment_status: {
        type: DataTypes.ENUM("pending", "success", "failed"),
      },
      payment_method: DataTypes.STRING,
      midtrans_order_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders", // ✅ Tambahkan ini untuk pastikan nama tabel cocok
    }
  );

  return Order;
};
