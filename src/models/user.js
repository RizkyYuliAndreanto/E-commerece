// Backend/src/models/user.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Asosiasi ke Cart
      this.hasOne(models.Cart, {
        foreignKey: "user_id",
        as: "cart",
      });
      // Asosiasi ke Order
      this.hasMany(models.Order, {
        foreignKey: "user_id",
        as: "orders",
      });
      // Asosiasi ke Transaction
      this.hasMany(models.Transaction, {
        foreignKey: "user_id",
        as: "transactions",
      });
      // Asosiasi ke UserDiscount (jika ada)
      this.hasMany(models.UserDiscount, {
        foreignKey: "user_id",
        as: "userDiscounts",
      });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.ENUM("admin", "user", "owner"),
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
