"use strict";
const fs = require("fs");
const path = require("path");
const { Product } = require("../models");

module.exports = {
  async up(queryInterface, Sequelize) {
    // Path gambar dummy (simpan di folder seeders/images)
    const dummyImages = [
      "laptop.jpg",
      "smartphone.jpg",
      "shirt.jpg",
      "book.jpg",
      "mouse.jpg",
    ];

    // Pastikan folder uploads exists
    const uploadDir = path.join(__dirname, "../../public/uploads/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Copy gambar dummy ke folder uploads
    const copiedImages = [];
    for (const image of dummyImages) {
      const source = path.join(__dirname, "images", image);
      const dest = path.join(uploadDir, `prod-${Date.now()}-${image}`);

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        copiedImages.push(path.basename(dest));
      }
    }

    // Data produk dummy
    const products = [
      {
        name: "Laptop ASUS ROG",
        description: "Laptop gaming dengan processor Intel i7 dan GPU RTX 3060",
        price: 15000000,
        stock: 10,
        image: copiedImages[0],
        category: "Electronics",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Smartphone Samsung S21",
        description: "Smartphone flagship dengan kamera 108MP",
        price: 12000000,
        stock: 15,
        image: copiedImages[1],
        category: "Electronics",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Kemeja Flanel",
        description: "Kemeja flanel bahan katun premium",
        price: 250000,
        stock: 50,
        image: copiedImages[2],
        category: "Fashion",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Buku Pemrograman JavaScript",
        description: "Buku pemrograman JavaScript untuk pemula sampai mahir",
        price: 150000,
        stock: 30,
        image: copiedImages[3],
        category: "Books",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Mouse Wireless Logitech",
        description: "Mouse wireless ergonomis dengan baterai tahan lama",
        price: 350000,
        stock: 25,
        image: copiedImages[4],
        category: "Accessories",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("products", products);
  },

  async down(queryInterface, Sequelize) {
    // Hapus semua file gambar produk
    const uploadDir = path.join(__dirname, "../../public/uploads/products");
    if (fs.existsSync(uploadDir)) {
      fs.readdirSync(uploadDir).forEach((file) => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
    }

    // Hapus data produk
    await queryInterface.bulkDelete("products", null, {});
  },
};
