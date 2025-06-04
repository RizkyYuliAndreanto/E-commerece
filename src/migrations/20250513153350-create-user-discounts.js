"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("UserDiscounts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // sesuaikan dengan nama tabel user Anda
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      discount_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Discounts", // sesuaikan jika Anda menggunakan nama tabel berbeda
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("UserDiscounts");
  },
};
