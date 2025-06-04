const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); 

const { register, login, getMe } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth(["user", "admin"]), getMe); // hanya user/admin yang bisa akses

module.exports = router;
