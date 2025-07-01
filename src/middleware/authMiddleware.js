const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Middleware ini akan mengembalikan fungsi middleware Express
// yang akan memeriksa autentikasi dan otorisasi berdasarkan peran.
module.exports = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Tidak ada token, otorisasi ditolak.",
          });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Pengguna tidak ditemukan." });
      }

      // Check if user role is allowed
      // Hanya lakukan cek peran jika allowedRoles tidak kosong
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Akses ditolak: Peran tidak diizinkan.",
          });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res
        .status(401)
        .json({
          success: false,
          message: "Token tidak valid atau kadaluarsa.",
        });
    }
  };
};
