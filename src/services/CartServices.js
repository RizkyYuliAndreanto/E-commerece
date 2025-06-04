const { Cart, CartItem, Product } = require("../models");

const getOrCreateCart = async (userId) => {
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
  });

  if (!cart) {
    cart = await Cart.create({
      user_id: userId,
      is_active: true,
    });
  }

  return cart;
};

const addItemToCart = async (userId, productId, quantity) => {
  if (!productId || !quantity || quantity <= 0) {
    throw new Error("Product ID and valid quantity are required");
  }

  const cart = await getOrCreateCart(userId);
  const product = await Product.findByPk(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const [item, created] = await CartItem.findOrCreate({
    where: { cart_id: cart.id, product_id: productId },
    defaults: {
      quantity: quantity,
      subtotal: product.price * quantity,
    },
  });

  if (!created) {
    item.quantity += quantity;
    item.subtotal = product.price * item.quantity;
    await item.save();
  }

  return item;
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
          },
        ],
      },
    ],
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart.items;
};

const removeItemFromCart = async (userId, productId) => {
  const cart = await getOrCreateCart(userId);
  const result = await CartItem.destroy({
    where: {
      cart_id: cart.id,
      product_id: productId,
    },
  });

  if (result === 0) {
    throw new Error("Item not found in cart");
  }

  return result;
};

module.exports = {
  getOrCreateCart,
  addItemToCart,
  getCartItems,
  removeItemFromCart,
};
