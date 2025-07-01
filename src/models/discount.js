"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Discount extends Model {
    static associate(models) {
      // define association here
      Discount.hasMany(models.UserDiscount, {
        foreignKey: "discount_id",
        as: "userDiscounts",
      });
    }
  }
  Discount.init(
    {
      code: DataTypes.STRING,
      type: DataTypes.ENUM("percentage", "fixed"),
      value: DataTypes.FLOAT,
      active: DataTypes.BOOLEAN,
      valid_until: DataTypes.DATE,
      start_date: DataTypes.DATE, // Tambahkan kolom start_date
      image: DataTypes.STRING, // Tambahkan kolom image (URL gambar)
      usage_limit_per_user: DataTypes.INTEGER, // Tambahkan batasan penggunaan per user
    },
    {
      sequelize,
      modelName: "Discount",
    }
  );
  return Discount;
};
