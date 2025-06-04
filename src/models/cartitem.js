'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      // Asosiasi ke Cart
      this.belongsTo(models.Cart, {
        foreignKey: "cart_id",
        as: "cart",
      });

      // Asosiasi ke Product
      this.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }
  CartItem.init({
    cart_id: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    subtotal: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'CartItem',
  });
  return CartItem;
};