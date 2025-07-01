"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../../config/config.js")[env]; // Pastikan path ini benar relative ke config.js
const db = {};

let sequelize;

// Pastikan config.dialect ada
if (!config.dialect) {
  throw new Error(
    `Sequelize config for environment "${env}" is missing "dialect".`
  );
}

// Gunakan konfigurasi dari ENV VAR jika tersedia
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Load semua model dari direktori ini
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model; // Model ditambahkan ke db[NamaModel]
  });

// Inisialisasi asosiasi model jika ada
// Ini akan memanggil metode 'associate' di setiap model
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
