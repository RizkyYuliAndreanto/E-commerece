const { Order, Transaction } = require("../models");
const OrderServices = require("../services/OrderServices");


class OrderController {
  static async createOrder(req, res) {
    try {
      const { items, name, phone, description, address } = req.body;
      const user = req.user;

      // ✅ Validasi input
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Nama dan nomor telepon wajib diisi",
        });
      }

      const orderServices = new OrderServices();
      const result = await orderServices.createOrder({
        userId: user.id,
        email: user.email, // ambil dari user yang login
        items,
        name,
        phone,
        address,
        description,
      });

      res.status(201).json({
        success: true,
        data: {
          order_id: result.order.id,
          payment_url: result.payment_url,
          transaction_id: result.transaction.id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async paymentNotification(req, res) {
    try {
      const orderServices = new OrderServices();
      await orderServices.handlePaymentNotification(req.body);

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getTransactionHistory(req, res) {
    try {
      const transactions = await Transaction.findAll({
        where: { user_id: req.user.id },
        include: [Order],
        order: [["createdAt", "DESC"]],
      });

      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = OrderController;
