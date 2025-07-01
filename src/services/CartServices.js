// services/CartServices.js
const { Cart, CartItem, Product, sequelize } = require("../models"); // Pastikan Product dan sequelize juga diimpor

/**
 * Mengambil atau membuat keranjang aktif untuk pengguna.
 * Jika ingin fungsi ini juga dalam transaksi, tambahkan parameter 'transaction'.
 * Saat ini, ini berjalan di luar transaksi utama addItemToCart kecuali dipanggil dengan 't'.
 */
const getOrCreateCart = async (userId, transaction = null) => {
  let cart = await Cart.findOne({
    where: { user_id: userId, is_active: true },
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
          },
        ],
      },
    ],
    transaction: transaction, // Teruskan objek transaksi jika ada
  });

  if (!cart) {
    cart = await Cart.create(
      {
        user_id: userId,
        is_active: true,
      },
      { transaction: transaction }
    ); // Teruskan objek transaksi jika ada
  }

  return cart;
};

const addItemToCart = async (userId, productId, quantity) => {
  // Validasi input awal
  if (!productId || !quantity || quantity <= 0) {
    throw new Error("Product ID dan kuantitas wajib diisi dan harus valid.");
  }

  const t = await sequelize.transaction(); // Mulai transaksi

  try {
    const cart = await getOrCreateCart(userId, t); // Panggil dengan transaksi
    const product = await Product.findByPk(productId, { transaction: t });

    if (!product) {
      throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
    }

    // Mengunci baris produk untuk mencegah race condition pada stok
    await product.reload({ transaction: t, lock: t.LOCK.UPDATE });

    const [item, created] = await CartItem.findOrCreate({
      where: { cart_id: cart.id, product_id: productId },
      defaults: {
        quantity: quantity,
        subtotal: product.price * quantity,
      },
      transaction: t, // Pastikan operasi ini bagian dari transaksi
    });

    if (!created) {
      // Jika item sudah ada, perbarui kuantitas dan subtotal
      const newQuantity = item.quantity + quantity;

      // Cek stok lagi untuk penambahan
      if (product.stock < newQuantity) {
        throw new Error(
          `Stok produk "${product.name}" (${product.stock}) tidak mencukupi jika ditambahkan menjadi ${newQuantity}.`
        );
      }
      item.quantity = newQuantity;
      item.subtotal = product.price * item.quantity;
      await item.save({ transaction: t }); // Pastikan operasi ini bagian dari transaksi
    } else {
      // Jika item baru ditambahkan, cek stok awal
      if (product.stock < quantity) {
        throw new Error(
          `Stok produk "${product.name}" (${product.stock}) tidak mencukupi untuk jumlah ${quantity}.`
        );
      }
    }

    // Commit transaksi jika semua operasi berhasil
    await t.commit();

    // Muat ulang item dengan detail produk untuk respons (diluar transaksi jika tidak perlu)
    // Untuk memastikan data terbaru setelah commit, lebih baik muat ulang tanpa transaksi terikat
    const updatedItem = await CartItem.findByPk(item.id, {
      include: [{ model: Product, as: "product" }],
    });

    return updatedItem;
  } catch (error) {
    await t.rollback(); // Rollback transaksi jika ada error
    console.error("❌ Error adding item to cart (service):", error);
    throw error; // Lempar error kembali agar controller bisa menangani
  }
};

const getCartItems = async (userId) => {
  const cart = await Cart.findOne({
    where: { user_id: userId, is_active: true },
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "stock", "image_url"], // Sertakan image_url
          },
        ],
      },
    ],
  });

  // Jika keranjang tidak ditemukan, kembalikan array kosong
  if (!cart) {
    return [];
  }

  return cart.items;
};

const removeItemFromCart = async (userId, productId) => {
  const t = await sequelize.transaction(); // Mulai transaksi

  try {
    const cart = await getOrCreateCart(userId, t); // Pastikan keranjang ada, dalam transaksi

    const result = await CartItem.destroy({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
      transaction: t, // Pastikan operasi ini bagian dari transaksi
    });

    if (result === 0) {
      throw new Error("Item tidak ditemukan di keranjang.");
    }

    await t.commit(); // Commit transaksi
    return result;
  } catch (error) {
    await t.rollback(); // Rollback transaksi jika ada error
    console.error("❌ Error removing item from cart (service):", error);
    throw error;
  }
};

module.exports = {
  getOrCreateCart,
  addItemToCart,
  getCartItems,
  removeItemFromCart,
};
