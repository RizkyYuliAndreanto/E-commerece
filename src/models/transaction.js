"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      this.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    }
  }

  Transaction.init(
    {
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      payment_status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        allowNull: false,
      },
      payment_method: { type: DataTypes.STRING, allowNull: true },
      snap_token: { type: DataTypes.STRING, allowNull: true },
      midtrans_response: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
    }
  );
  return Transaction;
};
