const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const productController = require("../controllers/ProductController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/products");  
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  upload.single("image"),
  productController.create
);

router.put("/:id", upload.single("image"), productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
