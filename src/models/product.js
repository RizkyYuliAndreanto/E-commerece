// Backend/src/models/product.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Asosiasi ke CartItem
      this.hasMany(models.CartItem, {
        foreignKey: "product_id",
        as: "cartItems",
      });
      // Asosiasi ke OrderItem
      this.hasMany(models.OrderItem, {
        foreignKey: "product_id",
        as: "orderItems",
      });
    }
  }
  Product.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      price: DataTypes.FLOAT,
      stock: DataTypes.INTEGER,
      image_url: DataTypes.STRING,
      category: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
