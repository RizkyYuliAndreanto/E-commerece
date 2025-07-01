<template>
    <div class="admin-management-view">
      <div class="content-area">
        <h1 class="page-title">Manajemen Produk</h1>
  
        <div class="card add-item-section">
          <h3>{{ editingProduct ? 'Edit Produk' : 'Tambah Produk Baru' }}</h3>
          <form @submit.prevent="saveProduct">
            <div class="form-group">
              <label for="productName">Nama Produk:</label>
              <input type="text" id="productName" v-model="productForm.name" required>
            </div>
            <div class="form-group">
              <label for="productDescription">Deskripsi:</label>
              <textarea id="productDescription" v-model="productForm.description" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label for="productPrice">Harga:</label>
              <input type="number" id="productPrice" v-model.number="productForm.price" min="0" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="productStock">Stok:</label>
              <input type="number" id="productStock" v-model.number="productForm.stock" min="0" required>
            </div>
            <div class="form-group">
              <label for="productCategory">Kategori:</label>
              <input type="text" id="productCategory" v-model="productForm.category" required>
            </div>
            <div class="form-group">
              <label for="productImage">Gambar Produk:</label>
              <input type="file" id="productImage" @change="handleImageUpload" accept="image/*">
              <p v-if="productForm.image_url && productForm.image_url !== 'REMOVE_EXISTING_IMAGE'">
                  Gambar saat ini: 
                  <a :href="getImageUrl(productForm.image_url)" target="_blank">
                      {{ productForm.image_url.split('/').pop() }}
                  </a>
              </p>
              <button v-if="productForm.image_url && productForm.image_url !== 'REMOVE_EXISTING_IMAGE' && editingProduct" type="button" @click="removeImage" class="remove-image-button">Hapus Gambar</button>
            </div>
            
            <button type="submit" class="primary-button">{{ editingProduct ? 'Perbarui Produk' : 'Tambah Produk' }}</button>
            <button type="button" v-if="editingProduct" @click="cancelEdit" class="cancel-button">Batal</button>
          </form>
          <p v-if="formMessage" :class="formError ? 'error-message' : 'success-message'">{{ formMessage }}</p>
        </div>
  
        <div class="card list-item-section">
          <h3>Daftar Produk</h3>
          <p v-if="loadingProducts" class="loading-message">Memuat daftar produk...</p>
          <p v-if="productsError" class="error-message">{{ productsError }}</p>
          <div class="table-container" v-if="!loadingProducts && !productsError && products.length">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Kategori</th>
                  <th>Gambar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product.id">
                  <td>{{ product.id }}</td>
                  <td>{{ product.name }}</td>
                  <td>Rp {{ formatNumber(product.price) }}</td>
                  <td>{{ product.stock }}</td>
                  <td>{{ product.category }}</td>
                  <td>
                    <img v-if="product.image_url" :src="getImageUrl(product.image_url)" :alt="product.name" class="product-thumb">
                    <span v-else>Tidak ada gambar</span>
                  </td>
                  <td>
                    <button @click="startEdit(product)" class="edit-button">Edit</button>
                    <button @click="deleteProduct(product.id)" class="delete-button">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else-if="!loadingProducts && !productsError">Tidak ada produk ditemukan.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import api from '../../api/axios'; // Sesuaikan path
  
  const products = ref([]);
  const loadingProducts = ref(true);
  const productsError = ref(null);
  const editingProduct = ref(null);
  const formMessage = ref('');
  const formError = ref(false);
  
  const productForm = ref({
    id: null,
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    image: null, // Untuk file gambar yang diupload
    image_url: null, // Untuk URL gambar yang sudah ada (dari DB)
  });
  
  // Fungsi untuk mendapatkan URL gambar yang benar (lengkap dengan base URL backend)
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://via.placeholder.com/400x300?text=No+Image"; // Placeholder jika tidak ada gambar
    }
    // Cek apakah imagePath sudah merupakan URL lengkap
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath; // Jika sudah lengkap, langsung gunakan
    }
    // Jika path relatif, tambahkan base URL backend
    // Sesuaikan port 5000 jika backend Anda berjalan di port lain
    return `http://localhost:5000${imagePath}`; 
  };
  
  const fetchAllProducts = async () => {
    loadingProducts.value = true;
    productsError.value = null;
    try {
      const response = await api.get('/products');
      products.value = response.data;
    } catch (err) {
      console.error("Gagal mengambil daftar produk:", err);
      productsError.value = err.response?.data?.message || "Gagal memuat produk.";
    } finally {
      loadingProducts.value = false;
    }
  };
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      productForm.value.image = file;
      // Opsi: Tampilkan preview gambar yang baru diupload di form
      // productForm.value.image_url = URL.createObjectURL(file); // Ini hanya URL sementara
    }
  };
  
  const removeImage = () => {
    // Sinyal khusus ke backend bahwa gambar yang ada harus dihapus
    productForm.value.image_url = 'REMOVE_EXISTING_IMAGE'; 
    productForm.value.image = null; // Pastikan input file juga kosong
    const fileInput = document.getElementById('productImage');
    if (fileInput) fileInput.value = '';
  };
   
  const saveProduct = async () => {
    formMessage.value = '';
    formError.value = false;
  
    if (!productForm.value.name || !productForm.value.description || productForm.value.price <= 0 || productForm.value.stock < 0 || !productForm.value.category) {
      formMessage.value = 'Semua field wajib diisi dan harga/stok harus valid.';
      formError.value = true;
      return;
    }
  
    const formData = new FormData();
    formData.append('name', productForm.value.name);
    formData.append('description', productForm.value.description);
    formData.append('price', productForm.value.price);
    formData.append('stock', productForm.value.stock);
    formData.append('category', productForm.value.category);
  
    // LOGIKA PENTING UNTUK PENANGANAN GAMBAR SAAT SAVE/UPDATE
    if (productForm.value.image) {
      // KASUS 1: Ada file baru yang dipilih untuk diupload
      formData.append('image', productForm.value.image);
    } else if (productForm.value.image_url === 'REMOVE_EXISTING_IMAGE') {
      // KASUS 2: Ada sinyal dari frontend untuk menghapus gambar yang ada
      formData.append('image_url', 'REMOVE_EXISTING_IMAGE');
    } else if (editingProduct.value && productForm.value.image_url !== null) {
      // KASUS 3: Sedang mode edit, tidak ada file baru, dan gambar sebelumnya TIDAK dihapus
      // Maka, URL gambar yang ada (productForm.value.image_url) harus tetap dikirim
      formData.append('image_url', productForm.value.image_url);
    } else if (editingProduct.value && productForm.value.image_url === null) {
      // KASUS 4: Sedang mode edit, tidak ada file baru, dan gambar sebelumnya di-set null secara manual di frontend
      // Kirim string kosong atau 'null' agar backend tahu untuk menghapus (jika backend mendukung ini)
      formData.append('image_url', ''); // Backend akan menerjemahkan ini sebagai perintah hapus
    }
    // Jika tidak ada perubahan terkait gambar, jangan tambahkan field 'image' atau 'image_url'
    // agar backend mengabaikannya dan mempertahankan status gambar saat ini.
  
    try {
      let response;
      if (editingProduct.value) {
        // Perbarui produk yang sudah ada
        response = await api.put(`/products/${productForm.value.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' } // Penting untuk Multer
        });
        formMessage.value = 'Produk berhasil diperbarui!';
      } else {
        // Tambah produk baru
        response = await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' } // Penting untuk Multer
        });
        formMessage.value = 'Produk berhasil ditambahkan!';
      }
      formError.value = false;
      resetForm(); // Reset form setelah sukses
      await fetchAllProducts(); // Muat ulang daftar produk untuk memperbarui tampilan
    } catch (err) {
      console.error("Gagal menyimpan produk:", err);
      formMessage.value = err.response?.data?.message || "Gagal menyimpan produk.";
      formError.value = true;
    }
  };
  
  const startEdit = (product) => {
    editingProduct.value = product;
    // Salin data produk ke form, pastikan image_url adalah URL yang benar
    productForm.value = { 
      ...product,
      image: null // Pastikan input file direset saat masuk mode edit
    };
    const fileInput = document.getElementById('productImage');
    if (fileInput) fileInput.value = ''; // Kosongkan pilihan file di input
    formMessage.value = ''; // Hapus pesan form sebelumnya
    formError.value = false;
  };
  
  const cancelEdit = () => {
    editingProduct.value = null;
    resetForm(); // Reset form ke kondisi kosong
    formMessage.value = '';
    formError.value = false;
  };
  
  const deleteProduct = async (id) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk dengan ID ${id}?`)) {
      try {
        await api.delete(`/products/${id}`);
        formMessage.value = 'Produk berhasil dihapus!';
        formError.value = false;
        await fetchAllProducts(); // Muat ulang daftar produk
      } catch (err) {
        console.error("Gagal menghapus produk:", err);
        formMessage.value = err.response?.data?.message || "Gagal menghapus produk.";
        formError.value = true;
      }
    }
  };
  
  const resetForm = () => {
    productForm.value = {
      id: null,
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      image: null, // Reset file input
      image_url: null, // Reset URL gambar
    };
    const fileInput = document.getElementById('productImage');
    if (fileInput) fileInput.value = ''; // Kosongkan pilihan file di input secara eksplisit
  };
  
  // Fungsi helper untuk memformat angka (harga)
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('id-ID');
  };
  
  onMounted(() => {
    fetchAllProducts(); // Panggil saat komponen dimuat
  });
  </script>
  
  <style scoped>
  /* Variabel CSS (Harus Didefinisikan di App.vue atau Global CSS) */
  /* Contoh variabel yang diasumsikan ada di App.vue atau CSS global: */
  :root {
    --primary-red: #e31937;
    --dark-red: #c1121f;
    --primary-yellow: #ffc72c;
    --accent-yellow: #ffaa00;
    --text-dark: #2b2d42;
    --text-light: #ffffff;
    --light-bg: #fff8f0;
  
    --dashboard-bg: #f8f8f8;
    --card-bg: #ffffff;
    --border-color: #e0e0e0;
    --text-secondary: #6c757d;
    --icon-color: #9a9a9a;
    --primary-blue: #007bff;
    --green-accent: #28a745;
    --orange-accent: #fd7e14;
    --purple-accent: #6f42c1;
  }
  
  .admin-management-view {
    padding: 20px;
    background-color: var(--dashboard-bg);
  }
  
  .page-title {
    font-size: 2.2em;
    color: var(--text-dark);
    margin-bottom: 30px;
    font-weight: 700;
  }
  
  .card {
    background-color: var(--card-bg);
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
  }
  
  h3 {
    font-size: 1.6em;
    color: var(--text-dark);
    margin-bottom: 20px;
  }
  
  /* Form Styles */
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--text-dark);
  }
  
  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group textarea {
    width: calc(100% - 20px); /* Adjust for padding */
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1em;
    color: var(--text-dark);
    background-color: #fcfcfc;
    transition: border-color 0.3s ease;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-yellow);
  }
  
  .form-group textarea {
    resize: vertical;
  }
  
  .primary-button {
    margin-top: 15px;
    margin-right: 10px;
  }
  
  .cancel-button {
    background-color: var(--text-secondary);
    color: var(--text-light);
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .cancel-button:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
  
  .remove-image-button {
    background-color: var(--primary-red);
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-left: 10px;
    font-size: 0.9em;
  }
  .remove-image-button:hover {
    background-color: var(--dark-red);
  }
  
  
  /* Table Styles */
  .table-container {
    overflow-x: auto; /* Untuk responsivitas tabel */
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 10px; /* Space between rows */
    margin-top: 20px;
  }
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border: none;
    background-color: var(--card-bg); /* Default cell background */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03); /* Subtle shadow for cells */
  }
  
  th {
    background-color: #f8f9fa; /* Header background */
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  
  /* Rounded corners for first/last cells in header and body */
  thead tr th:first-child { border-top-left-radius: 10px; }
  thead tr th:last-child { border-top-right-radius: 10px; }
  tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
  tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }
  
  
  .product-thumb {
    width: 70px; /* Diperbesar agar lebih terlihat */
    height: 70px; /* Diperbesar agar lebih terlihat */
    object-fit: cover;
    border-radius: 5px;
    border: 1px solid #eee; /* Tambahkan border tipis agar area gambar lebih terlihat */
    flex-shrink: 0; /* Pastikan tidak menyusut di dalam flex-container */
  }
  
  .edit-button, .delete-button {
    padding: 8px 12px;
    margin-right: 5px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .edit-button {
    background-color: var(--primary-blue);
    color: white;
  }
  .edit-button:hover {
    background-color: #0056b3;
  }
  
  .delete-button {
    background-color: var(--primary-red);
    color: white;
  }
  .delete-button:hover {
    background-color: var(--dark-red);
  }
  
  .loading-message, .error-message, .success-message {
    text-align: center;
    margin-top: 20px;
    padding: 10px;
    border-radius: 8px;
  }
  
  .error-message {
    color: white;
    background-color: var(--primary-red);
  }
  
  .success-message {
    color: var(--text-dark);
    background-color: #d4edda;
  }
  </style>