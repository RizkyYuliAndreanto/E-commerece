"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);

    const users = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Owner User",
        email: "owner@example.com",
        password: hashedPassword,
        role: "owner",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Regular User",
        email: "user@example.com",
        password: hashedPassword,
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("users", users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
