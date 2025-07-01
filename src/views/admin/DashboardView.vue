<template>
  <div class="dashboard-view">
    <h1 class="page-title">Dashboard Reporting</h1>

    <div class="summary-cards">
      <div class="card summary-card red-accent">
        <div class="card-icon"><i class="fas fa-dollar-sign"></i></div>
        <div class="card-content">
          <p class="card-label">Total Penjualan</p>
          <h2 class="card-value">Rp {{ formatNumber(totalSales) }}</h2>
        </div>
      </div>
      <div class="card summary-card yellow-accent"> <div class="card-icon"><i class="fas fa-boxes"></i></div>
        <div class="card-content">
          <p class="card-label">Produk Terjual</p>
          <h2 class="card-value">{{ formatNumber(productsSold) }}</h2>
        </div>
      </div>
      <div class="card summary-card green-accent">
        <div class="card-icon"><i class="fas fa-users"></i></div>
        <div class="card-content">
          <p class="card-label">Pengguna Baru</p>
          <h2 class="card-value">{{ formatNumber(newUsers) }}</h2>
        </div>
      </div>
      <div class="card summary-card orange-accent">
        <div class="card-icon"><i class="fas fa-receipt"></i></div>
        <div class="card-content">
          <p class="card-label">Pesanan Selesai</p>
          <h2 class="card-value">{{ formatNumber(completedOrders) }}</h2>
        </div>
      </div>
    </div>

    <div class="dashboard-sections">
      <div class="card transactions-section">
        <h3>Transaksi Terbaru</h3>
        <div class="table-container"> <table>
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Pengguna</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentTransactions" :key="order.id">
                <td>#{{ order.id }}</td>
                <td>{{ order.User ? order.User.name : 'N/A' }}</td>
                <td>Rp {{ formatNumber(order.total_amount) }}</td>
                <td>
                  <span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span>
                </td>
                <td>{{ formatDate(order.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <router-link to="/admin/transactions" class="view-all-button primary-button">Lihat Semua Transaksi</router-link>
      </div>

      <div class="card insights-section">
        <h3>Wawasan Cepat</h3>
        <ul class="insight-list">
          <li><strong>Produk Paling Laris:</strong> Nama Produk A</li>
          <li><strong>Diskon Populer:</strong> DISKON2024</li>
          <li><strong>Pendapatan Rata-rata per Pesanan:</strong> Rp 250.000</li>
          <li><strong>Pembatalan Minggu Ini:</strong> 2</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios'; // Sesuaikan path

const totalSales = ref(0);
const productsSold = ref(0);
const newUsers = ref(0);
const completedOrders = ref(0);
const recentTransactions = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchDashboardData = async () => {
  try {
    const response = await api.get('/admin/dashboard-summary'); // New endpoint
    const data = response.data.data;
    totalSales.value = data.totalSales;
    productsSold.value = data.productsSold;
    newUsers.value = data.newUsers;
    completedOrders.value = data.completedOrders;
    recentTransactions.value = data.recentTransactions;
  } catch (err) {
    console.error("Gagal mengambil data dashboard:", err);
    error.value = err.response?.data?.message || "Gagal memuat data dashboard.";
  } finally {
    loading.value = false;
  }
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('id-ID');
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const getStatusClass = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'status-pending';
    case 'success': return 'status-success';
    case 'settlement': return 'status-success';
    case 'cancelled': return 'status-cancelled';
    case 'processed': return 'status-processed';
    case 'shipped': return 'status-shipped';
    case 'completed': return 'status-completed';
    default: return '';
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* Pastikan variabel CSS ini didefinisikan di App.vue atau file CSS global Anda */
/* Jika tidak ada file CSS global, Anda bisa mendefinisikannya langsung di sini */
:root {
  --primary-red: #e31937;
  --dark-red: #c1121f;
  --primary-yellow: #ffc72c;
  --accent-yellow: #ffaa00;
  --text-dark: #2b2d42;
  --text-light: #ffffff;
  --light-bg: #fff8f0;

  /* Warna dashboard disesuaikan agar lebih mirip tema utama */
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

.dashboard-view {
  /* HAPUS properti yang menyebabkan konflik tinggi/overflow: */
  /* min-height: 100vh; */
  /* overflow: auto; */
  /* min-height: calc(100vh - var(--navbar-height) - 40px); */

  padding: 20px;
  background-color: var(--dashboard-bg);
  /* Biarkan tingginya mengikuti konten, parent-nya yang akan mengelola scroll. */
  /* Padding di sini akan tetap berlaku */
}

.page-title {
  font-size: 2.2em;
  color: var(--text-dark);
  margin-bottom: 30px;
  font-weight: 700;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background-color: var(--card-bg);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.summary-card .card-icon {
  font-size: 2.5em;
  padding: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}

.summary-card.red-accent .card-icon { background-color: var(--primary-red); }
.summary-card.yellow-accent .card-icon { background-color: var(--primary-yellow); }
.summary-card.green-accent .card-icon { background-color: var(--green-accent); }
.summary-card.orange-accent .card-icon { background-color: var(--orange-accent); }

.summary-card .card-label {
  font-size: 0.9em;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.summary-card .card-value {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.transactions-section {
  padding: 30px;
}

.transactions-section h3, .insights-section h3 {
  font-size: 1.6em;
  color: var(--text-dark);
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.transactions-section table {
  width: 100%;
  min-width: 600px;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-bottom: 20px;
}

.transactions-section th, .transactions-section td {
  padding: 12px 15px;
  text-align: left;
  border: none;
}

.transactions-section th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.transactions-section td {
  background-color: var(--card-bg);
  color: var(--text-dark);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.transactions-section thead tr th:first-child { border-top-left-radius: 10px; }
.transactions-section thead tr th:last-child { border-top-right-radius: 10px; }
.transactions-section tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
.transactions-section tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }

.status-badge {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85em;
  font-weight: 600;
  color: white;
}

.status-pending { background-color: var(--orange-accent); }
.status-success, .status-settlement { background-color: var(--green-accent); }
.status-cancelled { background-color: var(--primary-red); }
.status-processed { background-color: var(--primary-blue); }
.status-shipped { background-color: #6c757d; }
.status-completed { background-color: #20c997; }

.view-all-button {
  margin-top: 15px;
}

.insights-section {
  padding: 30px;
}

.insight-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-list li {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 0.95em;
  color: var(--text-dark);
  border-left: 5px solid var(--primary-yellow);
}

/* Media Queries for Responsiveness */
@media (max-width: 992px) {
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  .card {
    padding: 20px;
  }
  .summary-card .card-icon {
    font-size: 2em;
    padding: 10px;
  }
  .summary-card .card-value {
    font-size: 1.5em;
  }
  .page-title {
    font-size: 1.8em;
    margin-bottom: 20px;
  }
  .transactions-section h3, .insights-section h3 {
    font-size: 1.4em;
    margin-bottom: 15px;
  }
  .transactions-section table {
    min-width: 500px;
  }
  .transactions-section th, .transactions-section td {
    padding: 10px 12px;
    font-size: 0.9em;
  }
  .view-all-button {
    padding: 10px 20px;
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .dashboard-view {
    padding: 15px;
  }
  .summary-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .card {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  .summary-card .card-icon {
    margin-bottom: 5px;
  }
  .search-bar input {
    width: 100%;
  }
}
</style>