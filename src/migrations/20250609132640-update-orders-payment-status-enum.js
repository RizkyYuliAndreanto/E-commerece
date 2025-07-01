"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Migrasi untuk payment_status di tabel orders
    await queryInterface.changeColumn("orders", "payment_status", {
      type: Sequelize.ENUM(
        "pending",
        "capture",
        "settlement",
        "expire",
        "deny",
        "cancel",
        "refund",
        "partial_refund"
      ),
      defaultValue: "pending",
      allowNull: false,
    });

    // Migrasi untuk status di tabel orders (jika ada perubahan atau untuk memastikan)
    await queryInterface.changeColumn("orders", "status", {
      type: Sequelize.ENUM(
        "pending",
        "processing",
        "completed", // Pastikan tidak ada 'settlement' di sini
        "cancelled",
        "refunded",
        "failed"
      ),
      defaultValue: "pending",
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Logika untuk rollback jika diperlukan (kembalikan ke ENUM sebelumnya)
    await queryInterface.changeColumn("orders", "payment_status", {
      type: Sequelize.ENUM("pending", "success", "failed"), // Kembali ke ENUM lama
      defaultValue: "pending",
      allowNull: false,
    });
    await queryInterface.changeColumn("orders", "status", {
      type: Sequelize.ENUM(
        "pending",
        "processing",
        "completed",
        "cancelled",
        "refunded",
        "failed"
      ), // Sesuaikan jika down juga mengubah
      defaultValue: "pending",
      allowNull: false,
    });
  },
};
