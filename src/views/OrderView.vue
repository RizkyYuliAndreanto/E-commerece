<template>
  <div class="order-view">
    <section class="order-hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Detail Pesanan Anda</h1>
        <p class="hero-description">
          Lengkapi informasi Anda dan selesaikan pembayaran.
        </p>
      </div>
    </section>

    <section class="order-form-section">
      <p v-if="loading" class="loading-message">Memuat detail keranjang...</p>
      <p v-else-if="error" class="error-message">{{ error }}</p>
      <div v-else-if="cartItems.length === 0" class="empty-cart-message">
        <p>
          Keranjang Anda kosong. Tidak ada yang bisa dipesan.
          <router-link to="/menu">Kembali ke Menu</router-link>.
        </p>
      </div>

      <div v-else class="order-container">
        <div class="order-details-card">
          <h2>Item dalam Pesanan</h2>
          <div class="order-items-list">
            <div class="order-item" v-for="item in cartItems" :key="item.id">
              <img
                :src="getImageUrl(item.product.image_url)"
                :alt="item.product.name"
                class="item-image"
              />
              <div class="item-info">
                <span class="item-name">{{ item.product.name }}</span>
                <span class="item-quantity">x {{ item.quantity }}</span>
                <span class="item-price"
                  >Rp {{ formatPrice(item.product.price) }}</span
                >
              </div>
              <span class="item-subtotal"
                >Rp {{ formatPrice(item.subtotal) }}</span
              >
            </div>
          </div>

          <div class="order-summary-breakdown">
            <div class="summary-line">
              <span>Subtotal:</span>
              <span>Rp {{ formatPrice(subtotal) }}</span>
            </div>
            <div class="discount-section">
              <input
                type="text"
                v-model="discountCode"
                placeholder="Masukkan kode diskon"
                class="discount-input"
              />
              <button
                @click="applyDiscount"
                class="discount-button"
                :disabled="applyingDiscount"
              >
                {{ applyingDiscount ? "Menerapkan..." : "Terapkan Diskon" }}
              </button>
            </div>
            <p v-if="discountError" class="discount-error-message">
              {{ discountError }}
            </p>
            <p v-if="appliedDiscount && appliedDiscount.code" class="applied-discount-message">
              Diskon "{{ appliedDiscount.code }}" berhasil diterapkan!
            </p>
            <div class="summary-line" v-if="appliedDiscount && appliedDiscount.code">
              <span
                >Diskon ({{
                  appliedDiscount.type === "percentage"
                    ? appliedDiscount.value + "%"
                    : "Rp " + formatPrice(appliedDiscount.value)
                }}):</span
              >
              <span class="discount-amount"
                >- Rp {{ formatPrice(discountAmount) }}</span
              >
            </div>
            <div class="summary-line total-final-price">
              <span>Total Akhir:</span>
              <span>Rp {{ formatPrice(finalTotal) }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="placeOrder" class="order-form-card">
          <h2>Informasi Pengiriman</h2>
          <div class="form-group">
            <label for="name">Nama Lengkap:</label>
            <input type="text" id="name" v-model="customerInfo.name" required />
          </div>
          <div class="form-group">
            <label for="phone">Nomor Telepon:</label>
            <input type="tel" id="phone" v-model="customerInfo.phone" required />
          </div>
          <div class="form-group">
            <label for="address">Alamat Lengkap:</label>
            <textarea id="address" v-model="customerInfo.address" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="description">Catatan Tambahan (opsional):</label>
            <textarea id="description" v-model="customerInfo.description" rows="2"></textarea>
          </div>

          <button
            type="submit"
            class="place-order-button primary-button"
            :disabled="placingOrder || cartItems.length === 0"
          >
            {{ placingOrder ? "Membuat Pesanan..." : "Pesan Sekarang" }}
          </button>
          <p v-if="orderError" class="error-message">{{ orderError }}</p>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../api/axios";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

const cartItems = ref([]);
const loading = ref(false);
const error = ref(null);
const customerInfo = ref({
  name: "",
  phone: "",
  address: "",
  description: "",
});

const discountCode = ref("");
const appliedDiscount = ref(null);
const discountAmount = ref(0);
const discountError = ref(null);
const applyingDiscount = ref(false);

const placingOrder = ref(false);
const orderError = ref(null);

// --- Computed Properties ---
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const finalTotal = computed(() => {
  return Math.max(0, subtotal.value - discountAmount.value);
});

// --- Methods ---

const fetchCartItems = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get("/cart");
    cartItems.value = response.data.data.filter((item) => item.product !== null);
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      customerInfo.value.name = user.name;
    }
  } catch (err) {
    console.error("Gagal mengambil item keranjang:", err);
    error.value = err.response?.data?.message || "Gagal memuat keranjang.";
    if (err.response?.status === 401) {
      toast.error("Sesi Anda habis. Silakan login kembali.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  } finally {
    loading.value = false;
  }
};

const applyDiscount = async () => {
  if (!discountCode.value) {
    discountError.value = "Kode diskon tidak boleh kosong.";
    appliedDiscount.value = null;
    discountAmount.value = 0;
    return;
  }

  applyingDiscount.value = true;
  discountError.value = null;

  try {
    // --- PERUBAHAN DI SINI: Kirim subtotal keranjang ke backend untuk validasi diskon ---
    const response = await api.get(
      `/orders/validate-discount?code=${discountCode.value}&subtotalCart=${subtotal.value}`, // <-- Kirim subtotal.value
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Tambahkan token ke header
        },
      }
    );

    appliedDiscount.value = response.data.discount;
    discountAmount.value = response.data.discountAmount; // Backend mengembalikan jumlah diskon yang dihitung
    toast.success(
      `Diskon "${appliedDiscount.value.code}" berhasil diterapkan sebesar Rp ${formatPrice(
        discountAmount.value
      )}!` // Perbarui pesan toast
    );
  } catch (err) {
    console.error("Error applying discount:", err);
    discountError.value =
      err.response?.data?.message || "Gagal menerapkan diskon.";
    appliedDiscount.value = null;
    discountAmount.value = 0;
    toast.error(discountError.value);
  } finally {
    applyingDiscount.value = false;
  }
};

const placeOrder = async () => {
  placingOrder.value = true;
  orderError.value = null;

  if (cartItems.value.length === 0) {
    orderError.value = "Keranjang Anda kosong. Tidak ada yang bisa dipesan.";
    placingOrder.value = false;
    return;
  }

  if (
    !customerInfo.value.name ||
    !customerInfo.value.phone ||
    !customerInfo.value.address
  ) {
    orderError.value = "Nama, nomor telepon, dan alamat wajib diisi.";
    placingOrder.value = false;
    return;
  }

  try {
    const orderData = {
      items: cartItems.value.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
      })),
      cartId: cartItems.value[0].cart_id,
      name: customerInfo.value.name,
      phone: customerInfo.value.phone,
      address: customerInfo.value.address,
      description: customerInfo.value.description,
      discountCode: discountCode.value, // Teruskan kode diskon ke backend
    };

    const response = await api.post("/orders/post", orderData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Tambahkan token ke header
      },
    });

    const { payment_url, snap_token } = response.data.data;

    if (snap_token && window.snap) {
      window.snap.pay(snap_token, {
        onSuccess: function (result) {
          toast.success("Pembayaran berhasil! Silakan periksa riwayat pesanan Anda.");
          console.log("Midtrans Success:", result);
          router.push("/order-history");
          window.dispatchEvent(new CustomEvent("cart-updated"));
          cartItems.value = [];
        },
        onPending: function (result) {
          toast.info("Pembayaran tertunda. Silakan selesaikan pembayaran Anda.");
          console.log("Midtrans Pending:", result);
          router.push("/order-history");
          window.dispatchEvent(new CustomEvent("cart-updated"));
        },
        onError: function (result) {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
          console.log("Midtrans Error:", result);
        },
        onClose: function () {
          toast.info(
            "Anda menutup popup tanpa menyelesaikan pembayaran. Pembayaran dibatalkan."
          );
          console.log("Midtrans closed without finishing payment");
        },
      });
    } else if (payment_url) {
      window.location.href = payment_url;
    } else {
      orderError.value = "Gagal memuat halaman pembayaran.";
      toast.error("Gagal memuat halaman pembayaran.");
    }
  } catch (err) {
    console.error("Gagal membuat pesanan:", err);
    orderError.value =
      err.response?.data?.message || "Gagal membuat pesanan. Coba lagi.";
    toast.error(orderError.value);
  } finally {
    placingOrder.value = false;
  }
};

// --- START OF MODIFIED getImageUrl FUNCTION ---
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/80x80?text=No+Image"; // Placeholder jika tidak ada gambar
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

onMounted(() => {
  fetchCartItems();
  const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
  const clientKey = "SB-Mid-client-DthnUHFQuN-qyucp"; // Pastikan clientKey ini benar dan sesuai dengan lingkungan (sandbox/production)

  if (!document.querySelector(`script[src="${midtransScriptUrl}"]`)) {
    const script = document.createElement("script");
    script.src = midtransScriptUrl;
    script.setAttribute("data-client-key", clientKey);
    document.body.appendChild(script);
  }
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

.order-view {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--light-bg);
  min-height: calc(100vh - 70px);
}

/* Hero Section */
.order-hero-section {
  background: linear-gradient(135deg, var(--dark-red) 0%, var(--primary-red) 100%);
  color: var(--text-light);
  padding: 60px 5% 40px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.order-hero-section .hero-title {
  font-size: 3em;
  font-weight: 900;
  margin-bottom: 10px;
  color: var(--primary-yellow);
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.order-hero-section .hero-description {
  font-size: 1.1em;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Order Form Section */
.order-form-section {
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

.order-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-top: 30px;
}

.order-details-card,
.order-form-card {
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  padding: 30px;
  border: 1px solid var(--primary-yellow);
}

.order-details-card {
  flex: 2;
  min-width: 350px;
}
.order-form-card {
  flex: 1;
  min-width: 300px;
}

h2 {
  font-size: 1.8em;
  color: var(--text-dark);
  margin-bottom: 25px;
  text-align: center;
}

/* Order Items List */
.order-items-list {
  margin-bottom: 30px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 20px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #f0f0f0;
}
.order-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.item-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--primary-red);
  flex-shrink: 0;
}

.item-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  text-align: left;
}
.item-name {
  font-weight: 700;
  color: var(--text-dark);
  font-size: 1.1em;
}
.item-quantity {
  font-size: 0.9em;
  color: #666;
}
.item-price {
  font-size: 0.9em;
  color: var(--primary-red);
}

.item-subtotal {
  font-weight: 800;
  color: var(--dark-red);
  font-size: 1.1em;
}

/* Order Summary Breakdown */
.order-summary-breakdown {
  margin-top: 20px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1.1em;
  color: var(--text-dark);
}

.summary-line.total-final-price {
  font-size: 1.5em;
  font-weight: 800;
  color: var(--dark-red);
  padding-top: 15px;
  border-top: 1px solid var(--primary-yellow);
  margin-top: 15px;
}

.discount-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 10px;
}
.discount-input {
  flex-grow: 1;
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1em;
}
.discount-button {
  background-color: var(--primary-red);
  color: var(--text-light);
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
.discount-button:hover:not(:disabled) {
  background-color: var(--dark-red);
}
.discount-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.discount-error-message {
  color: var(--primary-red);
  font-size: 0.9em;
  margin-top: -5px;
  margin-bottom: 10px;
  text-align: left;
}
.applied-discount-message {
  color: green;
  font-size: 0.9em;
  margin-top: -5px;
  margin-bottom: 10px;
  text-align: left;
  font-weight: 600;
}
.discount-amount {
  color: green;
  font-weight: 600;
}

/* Order Form */
.order-form-card .form-group {
  margin-bottom: 20px;
  text-align: left;
}
.order-form-card label {
  display: block;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
}
.order-form-card input[type="text"],
.order-form-card input[type="tel"],
.order-form-card textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.order-form-card input:focus,
.order-form-card textarea:focus {
  outline: none;
  border-color: var(--primary-yellow);
  box-shadow: 0 0 0 2px rgba(255, 199, 44, 0.3);
}

.place-order-button {
  width: 100%;
  padding: 15px;
  font-size: 1.1em;
  border-radius: 50px;
  margin-top: 20px;
}
.place-order-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 992px) {
  .order-container {
    flex-direction: column;
  }
  .order-details-card,
  .order-form-card {
    flex: none;
    width: 100%;
  }
}

@media (max-width: 576px) {
  .order-hero-section .hero-title {
    font-size: 2.2em;
  }
  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .item-image {
    margin-bottom: 10px;
  }
  .item-info {
    text-align: left;
    width: 100%;
  }
  .item-subtotal {
    margin-top: 10px;
    width: 100%;
    text-align: right;
  }
}
</style>