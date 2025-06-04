const {
  Order,
  OrderItem,
  Transaction,
  sequelize,
  CartItem,
  Cart
} = require("../models"); // Perubahan di sini
const midtransClient = require("midtrans-client");

class OrderServices {
  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });
  }

  async createOrder({
    userId,
    email,
    items,
    name,
    phone,
    address,
    description = "",
  }) {
    const t = await sequelize.transaction();

    try {
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const order = await Order.create(
        {
          user_id: userId,
          total_price: total,
          final_price: total,
          status: "pending",
        },
        { transaction: t }
      );

      await OrderItem.bulkCreate(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        { transaction: t }
      );

      const transaction = await Transaction.create(
        {
          order_id: order.id,
          user_id: userId,
          amount: total,
          payment_status: "pending",
          description: description || null,
        },
        { transaction: t }
      );

      const payment = await this.snap.createTransaction({
        transaction_details: {
          order_id: `ORDER-${order.id}-${Date.now()}`,
          gross_amount: total,
        },
        customer_details: {
          first_name: name,
          email: email, 
          phone: phone,
          billing_address: {
            first_name: name,
            address: address || "-",
            phone: phone,
          },
          shipping_address: {
            first_name: name,
            address: address || "-",
            phone: phone,
          },
        },
        item_details: items.map((item) => ({
          id: String(item.product_id),
          price: item.price,
          quantity: item.quantity,
          name: item.name || `Product-${item.product_id}`,
        })),
        custom_fields: {
          description: description,
        },
      });

      await transaction.update(
        {
          snap_token: payment.token,
          midtrans_response: JSON.stringify(payment),
        },
        { transaction: t }
      );

      await t.commit();

      return {
        order,
        payment_url: payment.redirect_url,
        transaction,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async handlePaymentNotification(payload) {
    console.log(
      "📥 Midtrans Webhook Payload:",
      JSON.stringify(payload, null, 2)
    );
    const t = await sequelize.transaction();

    try {
      const orderId = payload.order_id.split("-")[1];

      // Update order status
      const order = await Order.findByPk(orderId, { transaction: t });
      let orderStatus = "processing";

      if (
        payload.transaction_status === "settlement" ||
        payload.transaction_status === "capture"
      ) {
        orderStatus = "completed";

        const cart = await Cart.findOne({
          where: { user_id: order.user_id },
          transaction: t,
        });

        if (cart) {
          await CartItem.destroy({
            where: { cart_id: cart.id },
            transaction: t,
          });
        }
        console.log("🧺 Cart ID ditemukan:", cart?.id);

      } else if (payload.transaction_status === "expire") {
        orderStatus = "cancelled";
      }

      await order.update({ status: orderStatus }, { transaction: t });

      await Transaction.update(
        {
          payment_status: payload.transaction_status, 
          payment_method: payload.payment_type,
          midtrans_response: JSON.stringify(payload),
        },
        {
          where: { order_id: order.id },
          transaction: t,
        }
      );

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = OrderServices;
