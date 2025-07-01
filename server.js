// Backend/server.js
const dotenv = require("dotenv");
dotenv.config(); // PASTI KAN INI ADA DAN DI SINI

const app = require("./app"); // Ini adalah impor yang benar untuk mengakses app.js dari root
const { sequelize } = require("./src/models"); // Ini juga sudah benar

const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Gagal terhubung ke database:", err);
    process.exit(1);
  });
