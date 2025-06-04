const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(401).json({ message: "Token is not valid" });
    }
  };
};
