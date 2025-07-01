"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambahkan kolom start_date
    await queryInterface.addColumn("Discounts", "start_date", {
      type: Sequelize.DATE,
      allowNull: true, // Sesuaikan dengan kebutuhan Anda, apakah boleh null atau tidak
    });

    // Tambahkan kolom image
    await queryInterface.addColumn("Discounts", "image", {
      type: Sequelize.STRING,
      allowNull: true, // Sesuaikan dengan kebutuhan Anda
    });

    // Tambahkan kolom usage_limit_per_user
    await queryInterface.addColumn("Discounts", "usage_limit_per_user", {
      type: Sequelize.INTEGER,
      allowNull: true, // Sesuaikan dengan kebutuhan Anda
      defaultValue: 0, // Misalnya, defaultnya 0 berarti tidak ada batasan
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus kolom start_date
    await queryInterface.removeColumn("Discounts", "start_date");

    // Hapus kolom image
    await queryInterface.removeColumn("Discounts", "image");

    // Hapus kolom usage_limit_per_user
    await queryInterface.removeColumn("Discounts", "usage_limit_per_user");
  },
};
