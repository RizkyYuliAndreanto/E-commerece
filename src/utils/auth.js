const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models");

const generateToken = (user) => {
  // Tambahkan fallback value dan pastikan menggunakan nama variabel yang konsisten
  const expiresIn =
    process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || "1h";

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Tambahkan error handling yang lebih spesifik
    console.error("Token verification error:", err.message);
    throw new Error("Invalid or expired token");
  }
};

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.error("Hashing error:", err);
    throw new Error("Password hashing failed");
  }
};

const comparePassword = async (inputPassword, userPassword) => {
  try {
    return await bcrypt.compare(inputPassword, userPassword);
  } catch (err) {
    console.error("Password comparison error:", err);
    throw new Error("Password comparison failed");
  }
};

const authMiddleware = async (req, res, next) => {
  let token;

  // Ekstrak token dari header atau cookie
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    return res.status(401).json({
      success: false,
      message: err.message || "Not authorized to access this route",
    });
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  roleMiddleware,
};
