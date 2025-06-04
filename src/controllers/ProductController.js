const productService = require("../services/ProductServices");

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil produk." });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil produk." });
  }
};

const create = async (req, res) => {
  try {
    const { file } = req;

    // Validasi file gambar harus ada
    if (!file) {
      return res.status(400).json({ message: "Gambar harus diisi." });
    }

    // Validasi ekstensi file
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExtension = require("path")
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res
        .status(400)
        .json({
          message:
            "Format gambar tidak valid. Hanya jpg, jpeg, png, atau webp.",
        });
    }

    const { name, description, price, stock, category } = req.body;

    // Validasi field wajib
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: "Semua field harus diisi." });
    }

    // Validasi tipe data angka
    if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
      return res
        .status(400)
        .json({
          message: "Harga dan stok harus berupa angka dan tidak boleh negatif.",
        });
    }

    const image_url = `/uploads/products/${file.filename}`;

    const product = await productService.createProduct({
      name,
      description,
      price,
      stock,
      category,
      image_url,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    const image_url = req.file
      ? `/uploads/products/${req.file.filename}`
      : undefined;

    const updatedData = {
      name,
      description,
      price,
      stock,
      category,
    };

    if (image_url) updatedData.image_url = image_url;

    const updated = await productService.update(id, updatedData);

    if (!updated)
      return res.status(404).json({ message: "Produk tidak ditemukan" });

    res.json({ message: "Produk berhasil diupdate", updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate produk." });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.remove(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ message: "Produk dihapus" });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus produk." });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  create,
};
