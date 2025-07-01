<template>
  <div class="cart-view">
    <section class="cart-hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Keranjang Belanjaku</h1>
        <p class="hero-description">
          Periksa kembali pesanan Anda sebelum melanjutkan ke pembayaran.
        </p>
      </div>
    </section>

    <section class="cart-content-section">
      <p v-if="loading" class="loading-message">Memuat keranjang Anda...</p>
      <p v-else-if="error" class="error-message">{{ error }}</p>
      <div v-else-if="cartItems.length === 0" class="empty-cart-message">
        <p>
          Keranjang Anda kosong. Yuk,
          <router-link to="/menu">jelajahi menu</router-link> dan tambahkan item!
        </p>
      </div>

      <div v-else class="cart-details">
        <div class="cart-items-list">
          <div class="cart-item-card" v-for="item in cartItems" :key="item.id">
            <img
              :src="getImageUrl(item.product.image_url)"
              :alt="item.product.name"
              class="cart-item-image"
              loading="lazy"
            />
            <div class="cart-item-info">
              <h3 class="cart-item-name">{{ item.product.name }}</h3>
              <p class="cart-item-description">{{ item.product.description }}</p>
              <div class="cart-item-meta">
                <span class="cart-item-price"
                  >Rp {{ formatPrice(item.product.price) }}</span
                >
                <div class="quantity-control">
                  <button
                    @click="updateQuantity(item, -1)"
                    :disabled="item.quantity <= 1 || updatingItem === item.id"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    v-model.number="item.quantity"
                    @change="updateQuantityDirect(item)"
                    :disabled="updatingItem === item.id || item.product.stock === 0"
                    min="1"
                    :max="item.product.stock"
                  />
                  <button
                    @click="updateQuantity(item, 1)"
                    :disabled="item.quantity >= item.product.stock || updatingItem === item.id"
                  >
                    +
                  </button>
                </div>
                <span class="cart-item-subtotal"
                  >Subtotal: Rp {{ formatPrice(item.subtotal) }}</span
                >
              </div>
            </div>
            <button
              @click="removeItem(item.product_id)"
              class="remove-item-button"
              :disabled="updatingItem === item.id"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-trash-2"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="cart-summary">
          <h3>Ringkasan Pesanan</h3>
          <div class="summary-line">
            <span>Total Item:</span>
            <span>{{ totalItems }}</span>
          </div>
          <div class="summary-line total-price">
            <span>Total Harga:</span>
            <span>Rp {{ formatPrice(cartTotal) }}</span>
          </div>
          <button
            @click="proceedToCheckout"
            class="checkout-button primary-button"
            :disabled="!cartItems.length"
          >
            Lanjutkan ke Pembayaran
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../api/axios"; // Sesuaikan path
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification"; // Opsional: jika Anda menggunakan library toast/notifikasi

// Inisialisasi
const router = useRouter();
const toast = useToast(); // Opsional

const cartItems = ref([]);
const loading = ref(false);
const error = ref(null);
const updatingItem = ref(null); // Menyimpan ID item yang sedang diupdate kuantitasnya

// --- Ambil Item Keranjang ---
const fetchCartItems = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get("/cart"); // Endpoint GET /api/cart
    // Pastikan `product` ada dan bukan `null`
    cartItems.value = response.data.data.filter((item) => item.product !== null);
  } catch (err) {
    console.error("Gagal mengambil item keranjang:", err);
    error.value = err.response?.data?.message || "Gagal memuat keranjang.";
    if (err.response?.status === 401) {
      toast.error("Sesi Anda habis. Silakan login kembali."); // Opsional
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      toast.error("Gagal memuat keranjang Anda."); // Opsional
    }
  } finally {
    loading.value = false;
  }
};

// --- Update Kuantitas Item ---
const updateQuantity = async (item, delta) => {
  const newQuantity = item.quantity + delta;

  if (newQuantity < 1) return; // Kuantitas tidak boleh kurang dari 1
  if (newQuantity > item.product.stock) {
    toast.warning(`Stok ${item.product.name} hanya ${item.product.stock}.`); // Opsional
    return;
  }

  updatingItem.value = item.id; // Set item yang sedang diupdate
  try {
    const response = await api.post(
      "/cart/add",
      {
        // Menggunakan endpoint `add` untuk update juga
        productId: item.product_id,
        quantity: delta, // Mengirim delta quantity
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Tambahkan token ke header
        },
      }
    );
    // Update item di frontend sesuai respons backend atau refresh
    // Asumsi backend mengembalikan item keranjang yang diperbarui atau total baru
    // Untuk sederhana, kita akan fetch ulang atau update manual itemnya
    // find and update the item in cartItems.value
    const updatedItem = response.data.data; // Asumsi backend mengembalikan item yang diupdate
    const index = cartItems.value.findIndex((i) => i.id === updatedItem.id);
    if (index !== -1) {
      cartItems.value[index].quantity = updatedItem.quantity;
      cartItems.value[index].subtotal = updatedItem.subtotal;
    }
    toast.success("Kuantitas diperbarui!"); // Opsional
    window.dispatchEvent(new CustomEvent("cart-updated")); // Beri tahu Navbar
  } catch (err) {
    console.error("Gagal update kuantitas:", err);
    toast.error(err.response?.data?.message || "Gagal update kuantitas."); // Opsional
    // Opsional: fetch ulang seluruh keranjang jika update manual gagal
    // fetchCartItems();
  } finally {
    updatingItem.value = null;
  }
};

const updateQuantityDirect = async (item) => {
  const newQuantity = parseInt(item.quantity); // Pastikan ini adalah angka

  if (isNaN(newQuantity) || newQuantity < 1) {
    // Kembalikan ke kuantitas sebelumnya atau minimal 1 jika input tidak valid
    item.quantity = Math.max(1, item.quantity); // jaga agar minimal 1
    return;
  }

  if (newQuantity > item.product.stock) {
    toast.warning(
      `Stok ${item.product.name} hanya ${item.product.stock}. Kuantitas diatur ke maksimal stok.`
    ); // Opsional
    item.quantity = item.product.stock; // Atur kuantitas ke stok maksimal
    // Lanjutkan dengan update ke backend dengan item.quantity yang sudah diatur
    // atau lakukan updateQuantity(item, 0) dengan quantity baru
  }

  updatingItem.value = item.id;
  try {
    const response = await api.post(
      "/cart/add",
      {
        productId: item.product_id,
        quantity: newQuantity - item.quantity, // Hitung perbedaan kuantitas
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Tambahkan token ke header
        },
      }
    );
    const updatedItem = response.data.data;
    const index = cartItems.value.findIndex((i) => i.id === updatedItem.id);
    if (index !== -1) {
      cartItems.value[index].quantity = updatedItem.quantity;
      cartItems.value[index].subtotal = updatedItem.subtotal;
    }
    toast.success("Kuantitas diperbarui!");
    window.dispatchEvent(new CustomEvent("cart-updated"));
  } catch (err) {
    console.error("Gagal update kuantitas langsung:", err);
    toast.error(err.response?.data?.message || "Gagal update kuantitas.");
    // Re-fetch jika terjadi error untuk memastikan data konsisten
    fetchCartItems();
  } finally {
    updatingItem.value = null;
  }
};

// --- Hapus Item ---
const removeItem = async (productId) => {
  if (confirm("Apakah Anda yakin ingin menghapus item ini dari keranjang?")) {
    updatingItem.value = productId; // Set item yang sedang dihapus
    try {
      await api.delete(`/cart/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Tambahkan token ke header
        },
      }); // Endpoint DELETE /api/cart/:productId
      // Hapus item dari array di frontend
      cartItems.value = cartItems.value.filter((item) => item.product_id !== productId);
      toast.success("Item berhasil dihapus dari keranjang!"); // Opsional
      window.dispatchEvent(new CustomEvent("cart-updated")); // Beri tahu Navbar
    } catch (err) {
      console.error("Gagal menghapus item:", err);
      toast.error(
        err.response?.data?.message || "Gagal menghapus item dari keranjang."
      ); // Opsional
    } finally {
      updatingItem.value = null;
    }
  }
};

// --- Fungsi Utilitas ---
// --- START OF MODIFIED getImageUrl FUNCTION ---
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/100x100?text=No+Image"; // Placeholder jika tidak ada gambar
  }
  // Cek apakah imagePath sudah merupakan URL lengkap
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath; // Jika sudah lengkap, langsung gunakan
  }
  // Jika path relatif, tambahkan base URL backend
  // Sesuaikan port 5000 jika backend Anda berjalan di port lain
  return `http://localhost:5000${imagePath}`;
};
// --- END OF MODIFIED getImageUrl FUNCTION ---

const formatPrice = (price) => {
  if (price === null || typeof price === "undefined") {
    return "0";
  }
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return "0";
  }
  return numericPrice.toLocaleString("id-ID");
};

// --- Computed Properties ---
const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const totalItems = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

// --- Lanjutkan ke Checkout ---
const proceedToCheckout = () => {
  if (cartItems.value.length === 0) {
    toast.warning("Keranjang Anda kosong. Tidak ada yang bisa di-checkout."); // Opsional
    return;
  }
  router.push("/order"); // Arahkan ke OrderView
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchCartItems();
});
</script>

<style scoped>
/* Variabel CSS (sesuaikan dengan tema Foodiez) */
:root {
  --primary-red: #e31937;
  --dark-red: #c1121f;
  --primary-yellow: #ffc72c;
  --accent-yellow: #ffaa00;
  --text-dark: #2b2d42;
  --text-light: #ffffff;
  --light-bg: #fff8f0;
}

.cart-view {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--light-bg);
  min-height: calc(100vh - 70px);
}

/* Hero Section */
.cart-hero-section {
  background: linear-gradient(135deg, var(--dark-red) 0%, var(--primary-red) 100%);
  color: var(--text-light);
  padding: 60px 5% 40px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.cart-hero-section .hero-title {
  font-size: 3em;
  font-weight: 900;
  margin-bottom: 10px;
  color: var(--primary-yellow);
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.cart-hero-section .hero-description {
  font-size: 1.1em;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Cart Content Section */
.cart-content-section {
  padding: 40px 5%;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-message,
.error-message,
.empty-cart-message {
  text-align: center;
  font-size: 1.2em;
  color: var(--text-dark);
  margin-top: 50px;
}
.error-message {
  color: var(--primary-red);
  font-weight: 600;
}
.empty-cart-message a {
  color: var(--primary-red);
  text-decoration: none;
  font-weight: 600;
}
.empty-cart-message a:hover {
  text-decoration: underline;
}

.cart-details {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-top: 30px;
}

.cart-items-list {
  flex: 3;
  min-width: 300px;
}

.cart-item-card {
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--primary-yellow);
}

.cart-item-image {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--primary-red);
  flex-shrink: 0;
}

.cart-item-info {
  flex-grow: 1;
  text-align: left;
}

.cart-item-name {
  font-size: 1.4em;
  color: var(--primary-red);
  margin-bottom: 5px;
  font-weight: 700;
}

.cart-item-description {
  font-size: 0.9em;
  color: var(--text-dark);
  margin-bottom: 10px;
  opacity: 0.8;
}

.cart-item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  font-size: 0.95em;
  color: var(--text-dark);
  width: 100%; /* Agar bisa flex-wrap dengan baik */
}

.cart-item-price {
  font-weight: 700;
  color: var(--dark-red);
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow: hidden;
}

.quantity-control button {
  background-color: var(--primary-yellow);
  color: var(--text-dark);
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.quantity-control button:hover:not(:disabled) {
  background-color: var(--accent-yellow);
}

.quantity-control button:disabled {
  background-color: #eee;
  color: #aaa;
  cursor: not-allowed;
}

.quantity-control input {
  width: 50px;
  text-align: center;
  border: none;
  padding: 8px 0;
  -moz-appearance: textfield; /* Remove arrows in Firefox */
  appearance: textfield;
}

.quantity-control input::-webkit-outer-spin-button,
.quantity-control input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.quantity-control input:focus {
  outline: none;
  background-color: #f5f5f5;
}

.cart-item-subtotal {
  font-weight: 700;
  color: var(--text-dark);
  margin-left: auto; /* Dorong ke kanan */
}

.remove-item-button {
  background: none;
  border: none;
  color: var(--primary-red);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-item-button:hover:not(:disabled) {
  background-color: rgba(227, 25, 55, 0.1);
  transform: scale(1.1);
}

.remove-item-button:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.cart-summary {
  flex: 1;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  padding: 25px;
  border: 1px solid var(--primary-yellow);
  height: fit-content;
}

.cart-summary h3 {
  font-size: 1.8em;
  color: var(--text-dark);
  margin-bottom: 25px;
  text-align: center;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 1.1em;
  color: var(--text-dark);
}

.summary-line.total-price {
  font-size: 1.3em;
  font-weight: 800;
  color: var(--dark-red);
  padding-top: 15px;
  border-top: 1px dashed #eee;
  margin-top: 15px;
}

.checkout-button {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  font-size: 1.1em;
  border-radius: 50px;
}
.checkout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Styles */
@media (max-width: 992px) {
  .cart-details {
    flex-direction: column;
  }
  .cart-items-list,
  .cart-summary {
    flex: none;
    width: 100%;
  }
}

@media (max-width: 576px) {
  .cart-item-card {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  .cart-item-info {
    text-align: center;
  }
  .cart-item-meta {
    justify-content: center;
    flex-direction: column; /* Ubah ke kolom untuk tata letak yang lebih baik */
    gap: 10px; /* Kurangi gap */
  }
  .quantity-control {
    margin-top: 10px; /* Jarakkan dari harga */
  }
  .cart-item-subtotal {
    margin-left: 0; /* Hapus dorongan ke kanan */
    margin-top: 10px; /* Tambah jarak */
  }
  .remove-item-button {
    margin-top: 15px;
  }
  .cart-hero-section .hero-title {
    font-size: 2.2em;
  }
  .cart-hero-section .hero-description {
    font-size: 0.9em;
  }
  .cart-summary h3 {
    font-size: 1.5em;
  }
}
</style>