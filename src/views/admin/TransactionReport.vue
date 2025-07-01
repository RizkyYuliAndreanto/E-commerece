<template>
    <div class="transaction-report-view">
      <h1 class="page-title">Laporan Transaksi & Penjualan</h1>
  
      <div class="filter-controls card">
        <label for="period-select">Pilih Periode:</label>
        <select id="period-select" v-model="selectedPeriod" @change="fetchSalesAndTransactionsData">
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
  
        <label v-if="selectedPeriod === 'monthly' || selectedPeriod === 'weekly'" for="month-year-select">Bulan/Tahun:</label>
        <input
          v-if="selectedPeriod === 'monthly' || selectedPeriod === 'weekly'"
          type="month"
          id="month-year-select"
          v-model="selectedMonthYear"
          @change="fetchSalesAndTransactionsData"
        />
  
        <label v-if="selectedPeriod === 'yearly'" for="year-select">Tahun:</label>
        <input
          v-if="selectedPeriod === 'yearly'"
          type="number"
          id="year-select"
          v-model="selectedYear"
          @change="fetchSalesAndTransactionsData"
          min="2020"
          :max="currentYear"
        />
  
        <button @click="fetchSalesAndTransactionsData" class="primary-button">Filter</button>
      </div>
  
      <div class="report-charts card">
        <h3>Grafik Penjualan ({{ displayPeriod }})</h3>
        <div v-if="loadingGraph" class="loading-message">Memuat grafik penjualan...</div>
        <div v-if="graphError" class="error-message">{{ graphError }}</div>
        <canvas id="salesChart" v-show="salesData.length > 0 && !loadingGraph && !graphError"></canvas>
        <p v-if="salesData.length === 0 && !loadingGraph && !graphError" class="no-data">Tidak ada data penjualan untuk periode ini.</p>
      </div>
  
      <div class="transaction-data card">
        <h3>Detail Transaksi</h3>
        <p v-if="loadingTransactions" class="loading-message">Memuat detail transaksi...</p>
        <p v-if="transactionError" class="error-message">{{ transactionError }}</p>
        <div class="table-container" v-if="!loadingTransactions && !transactionError && transactions.length">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Pengguna</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td>#{{ transaction.id }}</td>
                <td>{{ transaction.User ? transaction.User.name : 'N/A' }}</td>
                <td>Rp {{ formatNumber(transaction.total_amount) }}</td>
                <td>
                  <span :class="['status-badge', getStatusClass(transaction.status)]">{{ transaction.status }}</span>
                </td>
                <td>{{ formatDate(transaction.createdAt) }}</td>
                <td>
                  <button @click="viewTransactionDetails(transaction.id)" class="edit-button">Lihat Detail</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="!loadingTransactions && !transactionError">Tidak ada transaksi ditemukan untuk periode ini.</p>
      </div>
  
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <button class="close-button" @click="closeModal">&times;</button>
          <h3>Detail Pesanan #{{ selectedOrder.id }}</h3>
          <div v-if="loadingOrderDetails">Memuat detail...</div>
          <div v-else-if="orderDetailsError" class="error-message">{{ orderDetailsError }}</div>
          <div v-else-if="selectedOrder">
            <p><strong>Pembeli:</strong> {{ selectedOrder.User ? selectedOrder.User.name : 'N/A' }} ({{ selectedOrder.User ? selectedOrder.User.email : 'N/A' }})</p>
            <p><strong>Telepon:</strong> {{ selectedOrder.phone }}</p>
            <p><strong>Alamat:</strong> {{ selectedOrder.address }}</p>
            <p><strong>Status:</strong> <span :class="['status-badge', getStatusClass(selectedOrder.status)]">{{ selectedOrder.status }}</span></p>
            <p><strong>Total Pesanan:</strong> Rp {{ formatNumber(selectedOrder.total_amount) }}</p>
            <p v-if="selectedOrder.discountCode"><strong>Kode Diskon:</strong> {{ selectedOrder.discountCode }}</p>
            <p v-if="selectedOrder.final_discount_amount"><strong>Jumlah Diskon:</strong> Rp {{ formatNumber(selectedOrder.final_discount_amount) }}</p>
            <p><strong>Tanggal Pesanan:</strong> {{ formatDate(selectedOrder.createdAt) }}</p>
  
            <h4>Item Pesanan:</h4>
            <table class="order-items-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Jumlah</th>
                  <th>Harga Satuan</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.OrderDetails" :key="item.id">
                  <td>{{ item.Product ? item.Product.name : 'N/A' }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>Rp {{ formatNumber(item.price_at_order) }}</td>
                  <td>Rp {{ formatNumber(item.price_at_order * item.quantity) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import api from '../../api/axios'; // Sesuaikan path sesuai struktur proyek Anda
  import Chart from 'chart.js/auto'; // Pastikan Chart.js sudah diinstal (npm install chart.js)
  
  const selectedPeriod = ref('monthly'); // Default filter
  const currentYear = new Date().getFullYear();
  const selectedMonthYear = ref(new Date().toISOString().slice(0, 7)); // 'YYYY-MM' default to current month
  const selectedYear = ref(currentYear);
  
  const salesData = ref([]);
  const transactions = ref([]);
  const loadingGraph = ref(true);
  const loadingTransactions = ref(true);
  const graphError = ref(null);
  const transactionError = ref(null);
  let salesChartInstance = null; // Untuk menyimpan instance Chart.js
  
  const showModal = ref(false);
  const selectedOrder = ref(null);
  const loadingOrderDetails = ref(false);
  const orderDetailsError = ref(null);
  
  const displayPeriod = computed(() => {
    if (selectedPeriod.value === 'monthly') {
      const [year, month] = selectedMonthYear.value.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    } else if (selectedPeriod.value === 'yearly') {
      return `Tahun ${selectedYear.value}`;
    } else if (selectedPeriod.value === 'weekly') {
      const [year, month] = selectedMonthYear.value.split('-');
      const date = new Date(year, month - 1);
      return `Mingguan pada ${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;
    }
    return 'Grafik Penjualan';
  });
  
  const getCssVariable = (variableName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  };
  
  const fetchSalesAndTransactionsData = async () => {
    loadingGraph.value = true;
    graphError.value = null;
    loadingTransactions.value = true;
    transactionError.value = null;
  
    try {
      const params = { period: selectedPeriod.value };
      if (selectedPeriod.value === 'monthly' || selectedPeriod.value === 'weekly') {
        params.monthYear = selectedMonthYear.value;
      } else if (selectedPeriod.value === 'yearly') {
        params.year = selectedYear.value;
      }
  
      const salesResponse = await api.get('/admin/sales-data', { params });
      salesData.value = salesResponse.data.data;
      renderChart();
  
      const transactionsResponse = await api.get('/admin/transactions-by-period', { params });
      transactions.value = transactionsResponse.data.data;
  
    } catch (err) {
      console.error("Gagal mengambil data laporan:", err);
      graphError.value = err.response?.data?.message || "Gagal memuat grafik penjualan.";
      transactionError.value = err.response?.data?.message || "Gagal memuat detail transaksi.";
    } finally {
      loadingGraph.value = false;
      loadingTransactions.value = false;
    }
  };
  
  const renderChart = () => {
    if (salesChartInstance) {
      salesChartInstance.destroy();
    }
  
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
  
    const primaryYellow = getCssVariable('--primary-yellow');
    const accentYellow = getCssVariable('--accent-yellow');
  
    const labels = salesData.value.map(item => {
      if (selectedPeriod.value === 'weekly') {
          const date = new Date(item.label);
          return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      }
      return item.label;
    });
    const data = salesData.value.map(item => item.totalSales);
  
    salesChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Penjualan (Rp)',
          backgroundColor: primaryYellow, // Menggunakan variabel CSS yang diambil
          borderColor: accentYellow, // Menggunakan variabel CSS yang diambil
          borderWidth: 1,
          borderRadius: 5,
          data: data,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Total Penjualan (Rp)'
            },
            ticks: {
              callback: function(value) {
                return 'Rp ' + value.toLocaleString('id-ID');
              }
            }
          },
          x: {
            title: {
              display: true,
              text: selectedPeriod.value === 'weekly' ? 'Tanggal' : (selectedPeriod.value === 'monthly' ? 'Hari' : 'Bulan')
            }
          }
        }
      }
    });
  };
  
  const viewTransactionDetails = async (orderId) => {
    showModal.value = true;
    loadingOrderDetails.value = true;
    orderDetailsError.value = null;
    selectedOrder.value = null;
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      selectedOrder.value = response.data.data;
    } catch (err) {
      console.error(`Gagal mengambil detail pesanan #${orderId}:`, err);
      orderDetailsError.value = err.response?.data?.message || "Gagal memuat detail pesanan.";
    } finally {
      loadingOrderDetails.value = false;
    }
  };
  
  const closeModal = () => {
    showModal.value = false;
    selectedOrder.value = null;
    orderDetailsError.value = null;
  };
  
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('id-ID');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'success': return 'status-success';
      case 'settlement': return 'status-success';
      case 'cancelled': return 'status-cancelled';
      case 'expire': return 'status-cancelled';
      case 'processed': return 'status-processed';
      case 'shipped': return 'status-shipped';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };
  
  onMounted(() => {
    fetchSalesAndTransactionsData();
  });
  
  watch(selectedPeriod, (newPeriod) => {
    if (newPeriod === 'monthly' || newPeriod === 'weekly') {
      selectedYear.value = new Date().getFullYear();
    } else if (newPeriod === 'yearly') {
      selectedMonthYear.value = new Date().toISOString().slice(0, 7);
    }
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
  
    --dashboard-bg: #f5f7fa;
    --card-bg: #ffffff;
    --border-color: #e0e0e0;
    --text-secondary: #6c757d;
    --icon-color: #9a9a9a;
    --primary-blue: #007bff;
    --green-accent: #28a745;
    --orange-accent: #fd7e14;
    --purple-accent: #6f42c1;
  }
  
  .transaction-report-view {
    padding: 20px;
    background-color: var(--dashboard-bg);
    min-height: calc(100vh - 120px);
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
  
  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 15px;
  }
  
  .filter-controls label {
    font-weight: 600;
    color: var(--text-dark);
    white-space: nowrap;
  }
  
  .filter-controls select,
  .filter-controls input[type="month"],
  .filter-controls input[type="number"] {
    padding: 10px 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.95em;
    color: var(--text-dark);
    background-color: #fcfcfc;
    transition: border-color 0.3s ease;
    flex-grow: 1;
    min-width: 150px;
  }
  
  .filter-controls select:focus,
  .filter-controls input:focus {
    outline: none;
    border-color: var(--primary-yellow);
  }
  
  .filter-controls .primary-button {
    margin-left: auto;
    min-width: 100px;
    padding: 10px 20px;
  }
  
  .report-charts {
    padding: 30px;
    height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  
  #salesChart {
    width: 100% !important;
    height: 100% !important;
    max-height: 320px;
  }
  
  .no-data, .loading-message, .error-message {
    text-align: center;
    margin-top: 20px;
    font-size: 1.1em;
    color: var(--text-secondary);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
  }
  
  .error-message {
    color: var(--primary-red);
  }
  
  .transaction-data {
    padding: 30px;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 10px;
    margin-top: 20px;
  }
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border: none;
    background-color: var(--card-bg);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  
  thead tr th:first-child { border-top-left-radius: 10px; }
  thead tr th:last-child { border-top-right-radius: 10px; }
  tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
  tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }
  
  .status-badge {
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.85em;
    font-weight: 600;
    color: white;
  }
  .status-pending { background-color: var(--orange-accent); }
  .status-success, .status-settlement { background-color: var(--green-accent); }
  .status-cancelled, .status-expire { background-color: var(--primary-red); }
  .status-processed { background-color: var(--primary-blue); }
  .status-shipped { background-color: #6c757d; }
  .status-completed { background-color: #20c997; }
  
  .edit-button {
    background-color: var(--primary-blue);
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .edit-button:hover {
    background-color: #0056b3;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: var(--card-bg);
    padding: 30px;
    border-radius: 15px;
    width: 90%;
    max-width: 700px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-content h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.8em;
    color: var(--text-dark);
  }
  
  .modal-content p {
    margin-bottom: 10px;
    font-size: 1.05em;
    color: var(--text-dark);
  }
  
  .modal-content h4 {
    margin-top: 25px;
    margin-bottom: 15px;
    font-size: 1.4em;
    color: var(--text-dark);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 5px;
  }
  
  .modal-content .close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 2em;
    cursor: pointer;
    color: var(--text-secondary);
  }
  .modal-content .close-button:hover {
    color: var(--primary-red);
  }
  
  .order-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }
  
  .order-items-table th,
  .order-items-table td {
    border: 1px solid var(--border-color);
    padding: 10px;
    text-align: left;
  }
  
  .order-items-table th {
    background-color: #f0f2f5;
    color: var(--text-dark);
  }
  
  @media (max-width: 768px) {
    .filter-controls {
      flex-direction: column;
      align-items: stretch;
    }
    .filter-controls .primary-button {
      margin-left: 0;
      width: 100%;
    }
  }
  </style>