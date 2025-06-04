const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/Ordercontroller");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware ());


// Create new order
router.post("/post", OrderController.createOrder);

// Midtrans payment notification webhook
router.post("/payment-notification", OrderController.paymentNotification);

// Get transaction history
router.get("/transactions", OrderController.getTransactionHistory);

module.exports = router;
