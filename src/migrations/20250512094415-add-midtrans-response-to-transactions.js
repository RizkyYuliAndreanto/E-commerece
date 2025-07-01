"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambahkan kolom 'status' ke tabel 'orders'
    // Jika kolom ini belum ada, ini akan menambahkannya.
    // Jika sudah ada (tapi tidak tercatat), akan ada error di sini jika tidak ditangani.
    // Asumsi ini adalah migrasi untuk menambahkan 'status' juga.
    try {
      await queryInterface.addColumn("orders", "status", {
        type: Sequelize.ENUM(
          "pending",
          "processing",
          "completed",
          "cancelled",
          "refunded",
          "failed"
        ),
        defaultValue: "pending",
        allowNull: false,
      });
      console.log("Column 'status' added to 'orders' table.");
    } catch (error) {
      if (
        error.sqlState === "42S22" ||
        error.original?.code === "ER_DUP_FIELDNAME"
      ) {
        console.log(
          "Column 'status' already exists or enum already defined. Skipping addColumn."
        );
      } else {
        throw error;
      }
    }

    // 2. Tambahkan/Ubah kolom 'midtrans_response_webhook' ke tabel 'orders'
    try {
      await queryInterface.addColumn("orders", "midtrans_response_webhook", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log(
        "Column 'midtrans_response_webhook' added to 'orders' table."
      );
    } catch (error) {
      if (
        error.sqlState === "42S22" ||
        error.original?.code === "ER_DUP_FIELDNAME"
      ) {
        console.log(
          "Column 'midtrans_response_webhook' already exists. Skipping addColumn."
        );
        // Jika sudah ada tapi tipenya salah, ubah menggunakan changeColumn
        await queryInterface.changeColumn(
          "orders",
          "midtrans_response_webhook",
          {
            type: Sequelize.TEXT,
            allowNull: true,
          }
        );
        console.log("Column 'midtrans_response_webhook' type ensured to TEXT.");
      } else {
        throw error;
      }
    }

    // 3. Ubah kolom 'midtrans_response' di tabel 'Transactions' menjadi TEXT dan pastikan ada
    // Karena Anda mendapat 'Duplicate column name', ini berarti kolom sudah ada.
    // Jadi, kita gunakan 'changeColumn' untuk memastikan tipenya TEXT dan 'allowNull' true.
    try {
      await queryInterface.changeColumn("Transactions", "midtrans_response", {
        type: Sequelize.TEXT,
        allowNull: true, // Pastikan ini sesuai dengan model Anda
      });
      console.log(
        "Column 'midtrans_response' in 'Transactions' ensured to TEXT."
      );
    } catch (error) {
      if (
        error.sqlState === "42S01" ||
        error.original?.code === "ER_NO_SUCH_TABLE"
      ) {
        // Tabel tidak ada
        console.error(
          "Table 'Transactions' does not exist. Check migration order."
        );
        throw error;
      } else if (error.sqlState === "42S22") {
        // Kolom tidak ada, bisa terjadi jika changeColumn dipakai untuk addColumn
        console.log(
          "Column 'midtrans_response' does not exist. Attempting to add it instead."
        );
        await queryInterface.addColumn("Transactions", "midtrans_response", {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      } else {
        throw error;
      }
    }

    // Jika Anda juga perlu menambahkan/mengubah 'snap_token' di 'Transactions'
    try {
      await queryInterface.changeColumn("Transactions", "snap_token", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log("Column 'snap_token' in 'Transactions' ensured to STRING.");
    } catch (error) {
      if (error.sqlState === "42S22") {
        // Kolom tidak ada
        console.log(
          "Column 'snap_token' does not exist. Attempting to add it instead."
        );
        await queryInterface.addColumn("Transactions", "snap_token", {
          type: Sequelize.STRING,
          allowNull: true,
        });
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Logika untuk rollback: hapus kolom jika migrasi di-undo
    await queryInterface.removeColumn("orders", "status");
    await queryInterface.removeColumn("orders", "midtrans_response_webhook");
    await queryInterface.removeColumn("Transactions", "midtrans_response");
    await queryInterface.removeColumn("Transactions", "snap_token");
  },
};
