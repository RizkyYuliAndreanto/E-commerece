// Backend/src/services/OrderServices.js
const {
  Order,
  OrderItem,
  Transaction,
  sequelize,
  CartItem,
  Cart,
  Product,
  Discount,
  UserDiscount,
  User, // Impor model User untuk getTransactionHistory
} = require("../models");
const { Op } = require("sequelize");
const midtransClient = require("midtrans-client");
const crypto = require("crypto");

class OrderServices {
  constructor() {
    // --- DEBUGGING: Pastikan variabel lingkungan Midtrans terbaca dengan benar ---
    console.log("--- DEBUG MIDTRANS ENV VARS (OrderServices Constructor) ---");
    console.log(
      "process.env.MIDTRANS_IS_PRODUCTION:",
      process.env.MIDTRANS_IS_PRODUCTION
    );
    console.log(
      "process.env.MIDTRANS_SERVER_KEY:",
      process.env.MIDTRANS_SERVER_KEY
    );
    console.log(
      "process.env.MIDTRANS_CLIENT_KEY:",
      process.env.MIDTRANS_CLIENT_KEY
    );
    console.log("process.env.FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("---------------------------------------------------------");

    const serverKeyCleaned = process.env.MIDTRANS_SERVER_KEY
      ? process.env.MIDTRANS_SERVER_KEY.trim()
      : undefined;
    const clientKeyCleaned = process.env.MIDTRANS_CLIENT_KEY
      ? process.env.MIDTRANS_CLIENT_KEY.trim()
      : undefined;

    if (!serverKeyCleaned || !clientKeyCleaned) {
      // Lebih baik throw error saat inisialisasi jika kunci Midtrans penting
      throw new Error(
        "Midtrans API keys are not properly configured. Check environment variables."
      );
    }

    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true", // Pastikan string "true" dibandingkan
      serverKey: serverKeyCleaned,
      clientKey: clientKeyCleaned,
    });
  }

  /**
   * @desc    Membuat pesanan baru, menghitung diskon, dan menginisialisasi pembayaran Midtrans.
   * @param   {object} orderData - Data pesanan: userId, email, cartId, discountCode, name, phone, address, description.
   * @returns {object} Detail pesanan yang dibuat dan URL pembayaran.
   */
  async createOrder({
    userId,
    email,
    cartId,
    discountCode,
    name,
    phone,
    address,
    description = "",
  }) {
    const t = await sequelize.transaction();

    try {
      const cart = await Cart.findByPk(cartId, {
        where: { user_id: userId, is_active: true },
        include: [
          {
            model: CartItem,
            as: "items",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "price", "stock"],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error(
          "Keranjang kosong atau tidak ditemukan untuk pengguna ini."
        );
      }

      const orderItemsData = [];
      let subtotal_price_before_discount = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.product;
        if (!product) {
          throw new Error(
            `Produk dengan ID ${cartItem.product_id} tidak ditemukan.`
          );
        }
        if (product.stock < cartItem.quantity) {
          throw new Error(
            `Stok produk "${product.name}" (${product.stock}) tidak mencukupi untuk jumlah ${cartItem.quantity}. Stok tersedia: ${product.stock}.`
          );
        }

        const itemSubtotal = product.price * cartItem.quantity;
        orderItemsData.push({
          product_id: product.id,
          quantity: cartItem.quantity,
          price: product.price, // Ini harga asli produk per unit
          subtotal: itemSubtotal,
          name: product.name,
        });
        subtotal_price_before_discount += itemSubtotal;
      }

      let final_price = subtotal_price_before_discount;
      let appliedDiscount = null;
      let discountId = null;
      let discountAmount = 0;

      if (discountCode) {
        appliedDiscount = await Discount.findOne({
          where: { code: discountCode, active: true },
          transaction: t,
        });

        if (appliedDiscount) {
          const now = new Date(); // Dapatkan waktu saat ini dalam UTC

          if (
            appliedDiscount.valid_until &&
            now > new Date(appliedDiscount.valid_until)
          ) {
            throw new Error("Kode diskon sudah kadaluarsa.");
          }

          if (
            appliedDiscount.start_date &&
            now < new Date(appliedDiscount.start_date)
          ) {
            throw new Error("Kode diskon belum dimulai.");
          }

          // --- PERBAIKAN DI SINI: Hanya gunakan logika usage_limit_per_user ---
          if (appliedDiscount.usage_limit_per_user > 0) {
            const userClaimsCount = await UserDiscount.count({
              where: { user_id: userId, discount_id: appliedDiscount.id },
              transaction: t,
            });
            if (userClaimsCount >= appliedDiscount.usage_limit_per_user) {
              throw new Error(
                `Anda telah mencapai batas penggunaan ${appliedDiscount.usage_limit_per_user} kali untuk diskon ini.`
              );
            }
          }
          // --- Baris berikut Dihapus (dari diskusi sebelumnya) karena duplikasi validasi ---
          // const userUsedDiscount = await UserDiscount.findOne({
          //   where: { user_id: userId, discount_id: appliedDiscount.id },
          //   transaction: t,
          // });
          // if (userUsedDiscount) {
          //   throw new Error("Diskon ini sudah pernah Anda gunakan.");
          // }
          // --- END PERBAIKAN ---

          if (appliedDiscount.type === "percentage") {
            discountAmount =
              subtotal_price_before_discount * (appliedDiscount.value / 100);
          } else if (appliedDiscount.type === "fixed") {
            discountAmount = appliedDiscount.value;
          }

          // Pastikan jumlah diskon tidak melebihi subtotal
          discountAmount = Math.min(
            discountAmount,
            subtotal_price_before_discount
          );

          final_price = subtotal_price_before_discount - discountAmount;
          final_price = Math.max(0, final_price); // Pastikan harga tidak menjadi negatif

          discountId = appliedDiscount.id;
        } else {
          throw new Error("Kode diskon tidak valid atau tidak aktif.");
        }
      }

      // --- Perhitungan item_details untuk Midtrans ---
      const midtransItems = orderItemsData.map((item) => ({
        id: String(item.product_id), // ID produk (string)
        price: item.price, // Harga asli per unit
        quantity: item.quantity, // Kuantitas
        name: item.name, // Nama produk
      }));

      // Tambahkan item diskon sebagai item negatif jika ada diskon yang diterapkan
      if (discountAmount > 0 && appliedDiscount) {
        midtransItems.push({
          id: `DISCOUNT-${appliedDiscount.code || "GENERATED"}`, // ID unik untuk diskon
          price: -discountAmount, // Nilai diskon sebagai harga negatif
          quantity: 1, // Kuantitas 1 untuk item diskon
          name: `Diskon: ${appliedDiscount.code || "Diterapkan"}`, // Nama diskon di Midtrans
          category: "Discount", // Kategori opsional untuk pelaporan
        });
      }
      // --- END Perubahan Utama ---

      const order = await Order.create(
        {
          user_id: userId,
          cart_id: cartId,
          total_price: subtotal_price_before_discount, // Total sebelum diskon
          discount_id: discountId,
          final_price: final_price, // Total setelah diskon
          status: "pending",
          payment_status: "pending",
          payment_method: null,
          midtrans_order_id: null,
        },
        { transaction: t }
      );

      await OrderItem.bulkCreate(
        orderItemsData.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price, // Harga unit asli
          subtotal: item.subtotal,
          name: item.name,
        })),
        { transaction: t }
      );

      const transaction = await Transaction.create(
        {
          order_id: order.id,
          user_id: userId,
          amount: final_price, // Amount yang dibayar adalah final_price
          payment_status: "pending",
          description: description || null,
        },
        { transaction: t }
      );

      const midtransOrderId = `FOODIEZ-${order.id}-${Date.now()}`;
      const payment = await this.snap.createTransaction({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: final_price, // Ini adalah final_price (setelah diskon)
        },
        customer_details: {
          first_name: name,
          email: email,
          phone: phone,
        },
        item_details: midtransItems, // <-- GUNAKAN ARRAY midtransItems YANG SUDAH TERMASUK DISKON
        custom_fields: {
          description: description,
          order_id_internal: order.id,
          user_id_internal: userId,
        },
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/order-history?status=success&order_id=${order.id}`,
          error: `${process.env.FRONTEND_URL}/order-history?status=error&order_id=${order.id}`,

          pending: `${process.env.FRONTEND_URL}/order-history?status=pending&order_id=${order.id}`,
        },
      });

      await transaction.update(
        {
          snap_token: payment.token,
          // Simpan seluruh respons Midtrans untuk debugging
          midtrans_response: JSON.stringify(payment),
        },
        { transaction: t }
      );

      await order.update(
        {
          midtrans_order_id: midtransOrderId,
        },
        { transaction: t }
      );

      // Tandai diskon sudah digunakan oleh user
      if (appliedDiscount && discountId) {
        await UserDiscount.create(
          {
            user_id: userId,
            discount_id: discountId,
            used_at: new Date(),
          },
          { transaction: t }
        );
      }

      // Kurangi stok produk
      for (const item of orderItemsData) {
        const product = await Product.findByPk(item.product_id, {
          transaction: t,
          lock: t.LOCK.UPDATE, // Kunci baris untuk mencegah race condition pada stok
        });
        if (product) {
          if (product.stock < item.quantity) {
            throw new Error(
              `Stok produk "${product.name}" tidak mencukupi saat proses akhir. Silakan ulangi pesanan.`
            );
          }
          await product.update(
            { stock: product.stock - item.quantity },
            { transaction: t }
          );
        }
      }

      // Nonaktifkan keranjang dan hapus item keranjang setelah pesanan dibuat
      const cartToClear = await Cart.findOne({
        where: { user_id: userId, is_active: true },
        transaction: t,
      });
      if (cartToClear) {
        await CartItem.destroy({
          where: { cart_id: cartToClear.id },
          transaction: t,
        });
        await cartToClear.update({ is_active: false }, { transaction: t });
      }

      await t.commit();

      return {
        order,
        payment_url: payment.redirect_url,
        transaction,
      };
    } catch (error) {
      await t.rollback();
      console.error("❌ Error creating order (service):", error);
      throw error; // Lempar error kembali agar controller bisa menangani
    }
  }

  /**
   * @desc    Menangani notifikasi webhook pembayaran dari Midtrans.
   * @param   {object} payload - Data payload dari webhook Midtrans.
   * @returns {boolean} True jika berhasil diproses.
   */
  async handlePaymentNotification(payload) {
    console.log(
      "📥 Midtrans Webhook Payload Received:",
      JSON.stringify(payload, null, 2)
    );
    const t = await sequelize.transaction();

    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const midtransOrderId = payload.order_id;
      const status_code = payload.status_code;
      const gross_amount = payload.gross_amount;
      const signature_key = payload.signature_key;

      const stringToHash = `${midtransOrderId}${status_code}${gross_amount}${serverKey}`;
      const hashedSignature = crypto
        .createHash("sha512")
        .update(stringToHash)
        .digest("hex");

      if (hashedSignature !== signature_key) {
        await t.rollback();
        console.error("⚠️ Midtrans Webhook: Invalid signature key!", {
          expected: hashedSignature,
          received: signature_key,
          midtransOrderId,
        });
        throw new Error("Invalid signature key from Midtrans");
      }

      // Ambil order ID internal dari custom_fields jika ada, atau dari payload.order_id
      // Asumsi format midtransOrderId: "FOODIEZ-INTERNAL_ORDER_ID-TIMESTAMP"
      const internalOrderId =
        payload.custom_fields?.order_id_internal ||
        midtransOrderId.split("-")[1];

      const order = await Order.findByPk(internalOrderId, { transaction: t });
      if (!order) {
        await t.rollback();
        throw new Error(
          `Order dengan ID internal ${internalOrderId} tidak ditemukan.`
        );
      }

      // Logika untuk menghindari update berulang jika status sudah final
      if (
        order.payment_status === "settlement" ||
        order.payment_status === "capture" ||
        order.payment_status === "completed" ||
        order.payment_status === "expire" || // Jika sudah expire, jangan update lagi
        order.payment_status === "cancel" || // Jika sudah cancel, jangan update lagi
        order.payment_status === "deny"
      ) {
        await t.commit();
        console.log(
          `Order ${order.id} status already ${order.payment_status}. Skipping update.`
        );
        return true;
      }

      let newOrderStatus = order.status;
      let newPaymentStatus = payload.transaction_status;
      const paymentMethod = payload.payment_type;

      if (
        payload.transaction_status === "settlement" ||
        payload.transaction_status === "capture"
      ) {
        newOrderStatus = "completed";
        // Pastikan keranjang dikosongkan hanya jika pembayaran berhasil
        const cart = await Cart.findOne({
          where: { user_id: order.user_id, is_active: true },
          transaction: t,
        });
        if (cart) {
          await CartItem.destroy({
            where: { cart_id: cart.id },
            transaction: t,
          });
          await cart.update({ is_active: false }, { transaction: t });
          console.log(
            `🧺 Keranjang user ${order.user_id} dikosongkan dan dinonaktifkan setelah pembayaran berhasil.`
          );
        }
      } else if (payload.transaction_status === "expire") {
        newOrderStatus = "cancelled";
        // Logika pengembalian stok jika dibatalkan/kadaluarsa
        await this._returnStockForOrder(order.id, t);
      } else if (payload.transaction_status === "deny") {
        newOrderStatus = "failed";
        await this._returnStockForOrder(order.id, t);
      } else if (payload.transaction_status === "cancel") {
        newOrderStatus = "cancelled";
        await this._returnStockForOrder(order.id, t);
      } else if (
        payload.transaction_status === "refund" ||
        payload.transaction_status === "partial_refund"
      ) {
        newOrderStatus = "refunded";
        // Logika untuk refund, mungkin tidak perlu kembalikan stok penuh
        // Tergantung kebijakan refund Anda
      } else if (
        payload.transaction_status === "pending" ||
        payload.transaction_status === "challenge"
      ) {
        newOrderStatus = "pending";
      }

      await order.update(
        {
          status: newOrderStatus,
          payment_status: newPaymentStatus,
          payment_method: paymentMethod,
          midtrans_response_webhook: JSON.stringify(payload), // Simpan payload lengkap
        },
        { transaction: t }
      );

      await Transaction.update(
        {
          payment_status: newPaymentStatus,
          payment_method: paymentMethod,
          midtrans_response: JSON.stringify(payload), // Simpan payload lengkap
        },
        {
          where: { order_id: order.id },
          transaction: t,
        }
      );

      await t.commit();
      console.log(
        `✅ Order ${order.id} updated to status: ${newOrderStatus}, payment_status: ${newPaymentStatus}`
      );
      return true;
    } catch (error) {
      await t.rollback();
      console.error("❌ Error handling payment notification (service):", error);
      throw error;
    }
  }

  /**
   * @desc    Memvalidasi kode diskon secara real-time sebelum pembuatan pesanan.
   * @param   {object} data - Data: userId, code, subtotalCart.
   * @returns {object} Objek diskon dan jumlah diskon yang dihitung (sementara).
   */
  async validateDiscount({ userId, code, subtotalCart = 0 }) {
    const discount = await Discount.findOne({
      where: { code: code, active: true },
    });

    if (!discount) {
      throw new Error("Kode diskon tidak valid atau tidak aktif.");
    }

    const now = new Date(); // Waktu saat ini dalam UTC

    if (discount.valid_until && now > new Date(discount.valid_until)) {
      throw new Error("Kode diskon sudah kadaluarsa.");
    }
    if (discount.start_date && now < new Date(discount.start_date)) {
      throw new Error("Kode diskon belum dimulai.");
    }

    // --- PERBAIKAN DI SINI: Hanya gunakan logika usage_limit_per_user ---
    if (discount.usage_limit_per_user > 0) {
      const userClaimsCount = await UserDiscount.count({
        where: { user_id: userId, discount_id: discount.id },
      });
      if (userClaimsCount >= discount.usage_limit_per_user) {
        throw new Error(
          `Anda telah mencapai batas penggunaan ${discount.usage_limit_per_user} kali untuk diskon ini.`
        );
      }
    }
    // --- Baris berikut Dihapus (dari diskusi sebelumnya) karena duplikasi validasi ---
    // const userUsedDiscount = await UserDiscount.findOne({
    //   where: { user_id: userId, discount_id: discount.id },
    // });
    // if (userUsedDiscount) {
    //   throw new Error("Diskon ini sudah pernah Anda gunakan.");
    // }
    // --- END PERBAIKAN ---

    let estimatedDiscountAmount = 0;
    if (discount.type === "percentage") {
      estimatedDiscountAmount = subtotalCart * (discount.value / 100);
    } else if (discount.type === "fixed") {
      estimatedDiscountAmount = discount.value;
    }
    // Pastikan diskon tidak melebihi subtotalCart
    estimatedDiscountAmount = Math.min(estimatedDiscountAmount, subtotalCart);
    estimatedDiscountAmount = Math.max(0, estimatedDiscountAmount); // Pastikan tidak negatif

    return { discount, discountAmount: estimatedDiscountAmount };
  }

  /**
   * @desc    Mendapatkan riwayat transaksi pengguna.
   * @param   {number} userId - ID pengguna.
   * @returns {Array<object>} Daftar transaksi.
   */
  async getUserTransactionHistory(userId) {
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: OrderItem, as: "items" }], // Sertakan order items
        },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    return transactions;
  }

  /**
   * @desc    Metode internal untuk mengembalikan stok produk jika pesanan dibatalkan/kadaluarsa/gagal.
   * @param   {number} orderId - ID pesanan.
   * @param   {object} t - Objek transaksi Sequelize.
   * @private
   */
  async _returnStockForOrder(orderId, t) {
    try {
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderId },
        transaction: t,
      });

      for (const item of orderItems) {
        const product = await Product.findByPk(item.product_id, {
          transaction: t,
          lock: t.LOCK.UPDATE, // Kunci baris saat update stok
        });
        if (product) {
          await product.increment("stock", {
            by: item.quantity,
            transaction: t,
          });
          console.log(
            `📦 Stok produk "${product.name}" dikembalikan sejumlah ${item.quantity}.`
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Gagal mengembalikan stok untuk order ${orderId}:`,
        error
      );
      // Jangan re-throw karena ini adalah helper internal, tapi log penting
    }
  }
}

module.exports = OrderServices;
