"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      this.belongsTo(models.Order, { foreignKey: "order_id" });
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
  }

  Transaction.init(
    {
      order_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      amount: DataTypes.FLOAT,
      payment_status: {
        type: DataTypes.STRING,
      },
      payment_method: DataTypes.STRING,
      snap_token: DataTypes.STRING,
      midtrans_response: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions", // opsional: custom nama tabel
    }
  );

  return Transaction;
};
