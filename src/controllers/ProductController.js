// ProductController.js
const productService = require("../services/ProductServices");
const path = require("path");
const { Op } = require("sequelize");
const { validationResult } = require("express-validator"); // Tambahkan ini
const fs = require("fs"); // Tambahkan ini untuk menghapus file

// Tentukan UPLOADS_DIR_FOR_DELETE_PRODUCT agar menunjuk ke Backend/src/Public/uploads/products
const UPLOADS_DIR_FOR_DELETE_PRODUCT = path.resolve(
  __dirname,
  "../Public/uploads/products"
);

/**
 * @desc    Get all products with optional filtering by category and search by name
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let options = {};

    if (category) {
      options.where = { category: category };
    }

    if (search) {
      options.where = {
        ...options.where,
        name: { [Op.like]: `%${search}%` },
      };
    }

    const products = await productService.findAll(options);
    res.json(products);
  } catch (err) {
    console.error("Error getting all products:", err);
    res.status(500).json({ error: "Gagal mengambil produk." });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(product);
  } catch (err) {
    console.error("Error getting product by ID:", err);
    res.status(500).json({ error: "Gagal mengambil produk." });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin/Owner) - Requires file upload
 */
const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      // Hapus file jika validasi Multer gagal
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Gagal menghapus file setelah validasi:", err);
      });
    }
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { file } = req;

    if (!file) {
      // Seharusnya sudah divalidasi oleh Multer atau express-validator, tapi sebagai fallback
      return res.status(400).json({ message: "Gambar harus diisi." });
    }

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      fs.unlink(file.path, (err) => {
        // Hapus file jika format tidak valid
        if (err) console.error("Gagal menghapus file format tidak valid:", err);
      });
      return res.status(400).json({
        message: "Format gambar tidak valid. Hanya jpg, jpeg, png, atau webp.",
      });
    }

    const { name, description, price, stock, category } = req.body;

    const image_url = `${
      process.env.BACKEND_URL || "http://localhost:5000"
    }/uploads/products/${file.filename}`; // Pastikan URL lengkap

    const product = await productService.createProduct({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image_url,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    if (req.file) {
      // Hapus file jika ada error lain
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Gagal menghapus file setelah error:", err);
      });
    }
    res.status(500).json({ message: error.message || "Gagal membuat produk." });
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Admin/Owner) - Optional file upload
 */
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      // Hapus file jika validasi Multer gagal
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Gagal menghapus file setelah validasi:", err);
      });
    }
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body; // image_url dari body (opsional)

    let new_image_url = undefined; // Gunakan undefined agar tidak diupdate jika tidak ada perubahan
    const oldProduct = await productService.findById(id);

    if (!oldProduct) {
      if (req.file) {
        // Jika ada file baru tapi produk lama tidak ditemukan, hapus file baru
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error(
              "Gagal menghapus file baru karena produk tidak ditemukan:",
              err
            );
        });
      }
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Logika penanganan gambar:
    // 1. Ada file baru diupload
    if (req.file) {
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        fs.unlink(req.file.path, (err) => {
          // Hapus file jika format tidak valid
          if (err)
            console.error("Gagal menghapus file format tidak valid:", err);
        });
        return res.status(400).json({
          message:
            "Format gambar tidak valid. Hanya jpg, jpeg, png, atau webp.",
        });
      }
      new_image_url = `${
        process.env.BACKEND_URL || "http://localhost:5000"
      }/uploads/products/${req.file.filename}`;
      // Hapus gambar lama jika ada dan ada gambar baru
      if (oldProduct.image_url) {
        const oldFileName = path.basename(oldProduct.image_url);
        const oldImagePath = path.join(
          UPLOADS_DIR_FOR_DELETE_PRODUCT,
          oldFileName
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err)
              console.error(
                `Gagal menghapus gambar lama: ${oldImagePath}`,
                err
              );
          });
        }
      }
    }
    // 2. Ada sinyal dari frontend untuk menghapus gambar yang ada
    else if (req.body.image_url === "REMOVE_EXISTING_IMAGE") {
      new_image_url = null; // Set di DB menjadi null
      // Hapus gambar lama dari sistem file
      if (oldProduct.image_url) {
        const oldFileName = path.basename(oldProduct.image_url);
        const oldImagePath = path.join(
          UPLOADS_DIR_FOR_DELETE_PRODUCT,
          oldFileName
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err)
              console.error(
                `Gagal menghapus gambar lama karena diset null: ${oldImagePath}`,
                err
              );
          });
        }
      }
    }
    // 3. Tidak ada file baru dan tidak ada sinyal hapus, tapi ada `image_url` di body
    //    Ini berarti frontend mempertahankan URL gambar yang ada
    else if (req.body.image_url !== undefined) {
      // Check if the key exists, even if null/empty string
      new_image_url = req.body.image_url; // Gunakan URL yang dikirim dari body (bisa juga null jika ingin manual set null)
    }
    // 4. Jika 'image_url' tidak ada di body dan tidak ada file, biarkan new_image_url tetap undefined agar tidak diupdate di DB

    const updatedData = {
      name,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      category,
    };

    // Hanya tambahkan image_url ke updatedData jika new_image_url diubah (bukan undefined)
    if (new_image_url !== undefined) {
      updatedData.image_url = new_image_url;
    }

    const updated = await productService.update(id, updatedData);

    if (!updated)
      return res.status(404).json({ message: "Produk tidak ditemukan" });

    res.json({ message: "Produk berhasil diupdate", updated });
  } catch (err) {
    console.error("Error updating product:", err);
    if (req.file) {
      // Hapus file baru jika ada error di service
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error("Gagal menghapus file baru setelah error update:", err);
      });
    }
    res.status(500).json({ error: err.message || "Gagal mengupdate produk." });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin/Owner)
 */
const deleteProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const productToDelete = await productService.findById(req.params.id);
    if (!productToDelete)
      return res.status(404).json({ message: "Produk tidak ditemukan" });

    await productService.remove(req.params.id); // Panggil service.remove

    // Hapus file gambar fisik setelah produk dihapus dari DB
    if (productToDelete.image_url) {
      const fileName = path.basename(productToDelete.image_url);
      const imagePath = path.join(UPLOADS_DIR_FOR_DELETE_PRODUCT, fileName);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err)
            console.error(
              `Gagal menghapus gambar fisik produk: ${imagePath}`,
              err
            );
        });
      }
    }
    res.json({ message: "Produk dihapus" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Gagal menghapus produk." });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  create,
  updateProduct,
  deleteProduct,
};
