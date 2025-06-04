const cartService = require("../services/CartServices");

exports.getCartByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const cart = await cartService.getOrCreateCart(userId);
    res.json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error("Error in getCartByUserId:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: err.message,
    });
  }
};

exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await cartService.addItemToCart(
      userId,
      productId,
      quantity
    );
    res.status(201).json({
      success: true,
      data: cartItem,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("required")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const items = await cartService.getCartItems(req.user.id);
    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get cart items",
      error: err.message,
    });
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    await cartService.removeItemFromCart(userId, productId);
    res.json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: err.message,
    });
  }
};
