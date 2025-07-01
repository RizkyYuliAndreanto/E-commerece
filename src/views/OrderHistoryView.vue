<template>
  <div class="order-history-view">
    <section class="history-hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Riwayat Pesanan Anda</h1>
        <p class="hero-description">
          Lihat detail semua transaksi Anda di sini.
        </p>
      </div>
    </section>

    <section class="history-content-section">
      <p v-if="loading" class="loading-message">Memuat riwayat transaksi...</p>
      <p v-else-if="error" class="error-message">{{ error }}</p>
      <div
        v-else-if="transactions.length === 0"
        class="no-transactions-message">
        <p>
          Anda belum memiliki riwayat pesanan. Yuk,
          <router-link to="/menu">pesan makanan favoritmu!</router-link>
        </p>
      </div>

      <div v-else class="transactions-list">
        <div
          class="transaction-card"
          v-for="transaction in transactions"
          :key="transaction.id">
          <div class="transaction-header">
            <h3>Order ID: {{ transaction.order.id }}</h3>
            <span
              :class="[
                'status-badge',
                getStatusClass(transaction.payment_status),
              ]">
              {{ transaction.payment_status }}
            </span>
          </div>
          <div class="transaction-details">
            <p>
              <strong>Tanggal:</strong> {{ formatDate(transaction.createdAt) }}
            </p>
            <p>
              <strong>Total Pembayaran:</strong> Rp
              {{ formatPrice(transaction.amount) }}
            </p>
            <p>
              <strong>Metode Pembayaran:</strong>
              {{ transaction.payment_method || "N/A" }}
            </p>
            <p v-if="transaction.description">
              <strong>Catatan:</strong> {{ transaction.description }}
            </p>
            <p v-else><strong>Catatan:</strong> -</p>
          </div>
          <button
            @click="viewOrderDetails(transaction.order.id)"
            class="view-details-button">
            Lihat Detail Pesanan
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../api/axios";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

const transactions = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchTransactions = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get("/orders/transactions"); // Endpoint GET /api/orders/transactions
    transactions.value = response.data.data;
  } catch (err) {
    console.error("Gagal mengambil riwayat transaksi:", err);
    error.value =
      err.response?.data?.message || "Gagal memuat riwayat transaksi.";
    if (err.response?.status === 401) {
      toast.error("Sesi Anda habis. Silakan login kembali.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      toast.error("Gagal memuat riwayat pesanan.");
    }
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

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

const getStatusClass = (status) => {
  switch (status) {
    case "completed":
      return "status-completed";
    case "settlement":
      return "status-completed"; // Settlement juga sukses
    case "capture":
      return "status-completed"; // Capture juga sukses
    case "pending":
      return "status-pending";
    case "expire":
      return "status-cancelled";
    case "cancelled":
      return "status-cancelled";
    case "failed":
      return "status-failed";
    default:
      return "";
  }
};

const viewOrderDetails = (orderId) => {
  // Anda bisa mengarahkan ke halaman detail pesanan spesifik jika ada
  // router.push(`/order/${orderId}`);
  alert(`Melihat detail pesanan ID: ${orderId}`);
};

onMounted(() => {
  fetchTransactions();
});
</script>

<style scoped>
/* Variabel CSS (sesuaikan dengan tema Foodiez) */
:root {
  --primary-red: #e31937; /* Vibrant fast-food red */
  --dark-red: #c1121f; /* Darker red for accents */
  --primary-yellow: #ffc72c; /* Bright fast-food yellow */
  --accent-yellow: #ffaa00; /* Darker yellow for accents */
  --text-dark: #2b2d42; /* Dark text for contrast */
  --text-light: #ffffff; /* White text for readability */
  --light-bg: #fff8f0; /* Warm off-white background */
}

.order-history-view {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--light-bg);
  min-height: calc(100vh - 70px);
}

/* Hero Section */
.history-hero-section {
  background: linear-gradient(
    135deg,
    var(--dark-red) 0%,
    var(--primary-red) 100%
  );
  color: var(--text-light);
  padding: 60px 5% 40px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.history-hero-section .hero-title {
  font-size: 3em;
  font-weight: 900;
  margin-bottom: 10px;
  color: var(--primary-yellow);
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.history-hero-section .hero-description {
  font-size: 1.1em;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Content Section */
.history-content-section {
  padding: 40px 5%;
  max-width: 900px; /* Batasi lebar untuk daftar transaksi */
  margin: 0 auto;
}

.loading-message,
.error-message,
.no-transactions-message {
  text-align: center;
  font-size: 1.2em;
  color: var(--text-dark);
  margin-top: 50px;
}
.error-message {
  color: var(--primary-red);
  font-weight: 600;
}
.no-transactions-message a {
  color: var(--primary-red);
  text-decoration: none;
  font-weight: 600;
}
.no-transactions-message a:hover {
  text-decoration: underline;
}

.transactions-list {
  display: grid;
  gap: 25px;
  margin-top: 30px;
}

.transaction-card {
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  padding: 25px;
  border: 1px solid var(--primary-yellow);
  text-align: left;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #eee;
}

.transaction-header h3 {
  font-size: 1.5em;
  color: var(--text-dark);
  margin: 0;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 700;
  color: var(--text-light);
}

.status-completed {
  background-color: #28a745;
} /* Green */
.status-pending {
  background-color: #ffc107;
  color: var(--text-dark);
} /* Yellow */
.status-cancelled {
  background-color: #6c757d;
} /* Gray */
.status-failed {
  background-color: #dc3545;
} /* Red */
/* Tambahkan status lain jika ada: denied, expire */

.transaction-details p {
  margin-bottom: 8px;
  font-size: 1em;
  color: var(--text-dark);
}
.transaction-details p strong {
  color: var(--dark-red);
}

.view-details-button {
  background-color: var(--primary-red);
  color: var(--text-light);
  padding: 10px 20px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
  margin-top: 20px;
  display: inline-block;
}

.view-details-button:hover {
  background-color: var(--dark-red);
}

/* Responsive */
@media (max-width: 576px) {
  .history-hero-section .hero-title {
    font-size: 2.2em;
  }
  .transaction-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .transaction-header h3 {
    font-size: 1.3em;
  }
  .status-badge {
    align-self: flex-end; /* Dorong badge ke kanan bawah jika kolom */
  }
}
</style>
