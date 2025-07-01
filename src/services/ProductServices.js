// ProductServices.js
const { Product } = require("../models"); //

const createProduct = async (data) => {
  return await Product.create(data);
};

const findAll = async (options = {}) => {
  // <-- PERUBAHAN: tambahkan parameter `options`
  return await Product.findAll(options); // <-- PERUBAHAN: teruskan `options` ke Sequelize
};

const findById = async (id) => {
  return await Product.findByPk(id);
};

const update = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) return null;

  await product.update(data);
  return product;
};

const remove = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.destroy();
  return true;
};

module.exports = {
  createProduct,
  findAll, // Pastikan ini diekspor
  findById,
  update,
  remove,
};
