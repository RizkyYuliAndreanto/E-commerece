"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  // PERBAIKI NAMA CLASS DI SINI: dari CartItem menjadi OrderItem (jika sebelumnya salah)
  class OrderItem extends Model {
    static associate(models) {
      this.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
      this.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  OrderItem.init(
    {
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      price: { type: DataTypes.FLOAT, allowNull: false },
      subtotal: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "orderitems",
    }
  );
  return OrderItem;
};
