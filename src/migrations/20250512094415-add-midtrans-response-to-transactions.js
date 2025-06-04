"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Transactions", "midtrans_response", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Optional: juga tambahkan payment_status jika belum ada
    await queryInterface.addColumn("Transactions", "payment_status", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Transactions", "midtrans_response");
    await queryInterface.removeColumn("Transactions", "payment_status");
  },
};
