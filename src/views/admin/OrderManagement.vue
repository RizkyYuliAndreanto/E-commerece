<template>
    <div class="admin-management-view">
      <div class="content-area">
        <h1 class="page-title">Manajemen Pesanan</h1>
  
        <div class="card order-filter-section">
          <h3>Filter Pesanan</h3>
          <div class="form-group">
            <label for="filterStatus">Status Pesanan:</label>
            <select id="filterStatus" v-model="filter.status" @change="fetchOrders">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="success">Sukses</option>
              <option value="settlement">Settlement</option>
              <option value="expire">Kadaluarsa</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="processed">Diproses</option>
              <option value="shipped">Dikirim</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <div class="form-group">
            <label for="filterStartDate">Dari Tanggal:</label>
            <input type="date" id="filterStartDate" v-model="filter.startDate" @change="fetchOrders">
          </div>
          <div class="form-group">
            <label for="filterEndDate">Sampai Tanggal:</label>
            <input type="date" id="filterEndDate" v-model="filter.endDate" @change="fetchOrders">
          </div>
          <button @click="resetFilter" class="cancel-button">Reset Filter</button>
        </div>
  
        <div class="card list-item-section">
          <h3>Daftar Pesanan</h3>
          <p v-if="loadingOrders" class="loading-message">Memuat daftar pesanan...</p>
          <p v-if="ordersError" class="error-message">{{ ordersError }}</p>
          <div class="table-container" v-if="!loadingOrders && !ordersError && orders.length">
            <table>
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Pengguna</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tanggal Pesanan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td>#{{ order.id }}</td>
                  <td>{{ order.User ? order.User.name : 'N/A' }} ({{ order.User ? order.User.email : 'N/A' }})</td>
                  <td>Rp {{ formatNumber(order.total_amount) }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span>
                  </td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <button @click="viewDetails(order.id)" class="edit-button">Detail</button>
                    <select v-model="order.status" @change="updateOrderStatus(order.id, order.status)" class="status-select">
                      <option value="pending">Pending</option>
                      <option value="processed">Diproses</option>
                      <option value="shipped">Dikirim</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Batalkan</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else-if="!loadingOrders && !ordersError">Tidak ada pesanan ditemukan.</p>
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
              <p><strong>Tanggal Pesanan:</strong> {{ formatDate(selectedOrder.createdAt) }}</p>
              <p v-if="selectedOrder.discountCode"><strong>Kode Diskon:</strong> {{ selectedOrder.discountCode }}</p>
              <p v-if="selectedOrder.final_discount_amount"><strong>Jumlah Diskon:</strong> Rp {{ formatNumber(selectedOrder.final_discount_amount) }}</p>
  
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
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import api from '../../api/axios'; // Sesuaikan path
  
  const orders = ref([]);
  const loadingOrders = ref(true);
  const ordersError = ref(null);
  const formMessage = ref(''); // Untuk pesan sukses/error update status
  const formError = ref(false);
  
  // Filter state
  const filter = ref({
    status: '',
    startDate: '',
    endDate: '',
  });
  
  // Modal state for order details
  const showModal = ref(false);
  const selectedOrder = ref(null);
  const loadingOrderDetails = ref(false);
  const orderDetailsError = ref(null);
  
  const fetchOrders = async () => {
    loadingOrders.value = true;
    ordersError.value = null;
    try {
      const params = { ...filter.value };
      const response = await api.get('/admin/orders', { params }); // Endpoint GET ALL Orders
      orders.value = response.data.data;
    } catch (err) {
      console.error("Gagal mengambil daftar pesanan:", err);
      ordersError.value = err.response?.data?.message || "Gagal memuat pesanan.";
    } finally {
      loadingOrders.value = false;
    }
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    formMessage.value = '';
    formError.value = false;
    if (!confirm(`Apakah Anda yakin ingin mengubah status pesanan #${orderId} menjadi ${newStatus}?`)) {
      // Kembalikan status di UI jika user membatalkan
      await fetchOrders(); // Cara sederhana untuk menyinkronkan ulang UI
      return;
    }
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      formMessage.value = `Status pesanan #${orderId} berhasil diperbarui menjadi ${newStatus}.`;
      formError.value = false;
      await fetchOrders(); // Muat ulang daftar pesanan untuk menyinkronkan
    } catch (err) {
      console.error(`Gagal memperbarui status pesanan #${orderId}:`, err);
      formMessage.value = err.response?.data?.message || `Gagal memperbarui status pesanan #${orderId}.`;
      formError.value = true;
      await fetchOrders(); // Muat ulang jika ada error untuk mengembalikan status asli
    }
  };
  
  const viewDetails = async (orderId) => {
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
  
  const resetFilter = () => {
    filter.value = {
      status: '',
      startDate: '',
      endDate: '',
    };
    fetchOrders();
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
      case 'settlement': return 'status-success'; // Settlement dianggap sukses
      case 'cancelled': return 'status-cancelled';
      case 'expire': return 'status-cancelled'; // Expire juga bisa dianggap mirip cancelled
      case 'processed': return 'status-processed';
      case 'shipped': return 'status-shipped';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };
  
  onMounted(() => {
    fetchOrders();
  });
  </script>
  
  <style scoped>
  /* Reused admin management styles (copy from ProductManagement.vue if needed, or link to a common CSS file) */
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
  
  /* Filter Section Styles */
  .order-filter-section {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: flex-end;
  }
  
  .order-filter-section .form-group {
    margin-bottom: 0; /* Override default margin */
    flex-grow: 1;
    min-width: 180px; /* Minimum width for filter inputs */
  }
  
  .order-filter-section label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--text-dark);
  }
  
  .order-filter-section select,
  .order-filter-section input[type="date"] {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1em;
    color: var(--text-dark);
    background-color: #fcfcfc;
    transition: border-color 0.3s ease;
  }
  
  .order-filter-section select:focus,
  .order-filter-section input:focus {
    outline: none;
    border-color: var(--primary-yellow);
  }
  
  .cancel-button { /* Reusing cancel-button style for reset filter */
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
  
  
  /* Table Styles */
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
  /* New status colors */
  .status-pending { background-color: var(--orange-accent); }
  .status-success, .status-settlement { background-color: var(--green-accent); }
  .status-cancelled, .status-expire { background-color: var(--primary-red); }
  .status-processed { background-color: var(--primary-blue); }
  .status-shipped { background-color: #6c757d; } /* Grey for shipped */
  .status-completed { background-color: #20c997; } /* Teal for completed */
  
  
  .edit-button { /* Using edit-button style for view details */
    padding: 8px 12px;
    margin-right: 5px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: var(--primary-blue);
    color: white;
    transition: all 0.3s ease;
  }
  .edit-button:hover {
    background-color: #0056b3;
  }
  
  .status-select {
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.9em;
    cursor: pointer;
    background-color: #fcfcfc;
  }
  
  .loading-message, .error-message {
    text-align: center;
    margin-top: 20px;
    padding: 10px;
    border-radius: 8px;
  }
  
  .error-message {
    color: white;
    background-color: var(--primary-red);
  }
  
  /* Modal Styles */
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
    max-height: 90vh; /* Max height to allow scrolling */
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
    .order-filter-section {
      flex-direction: column;
      align-items: stretch;
    }
    .order-filter-section .form-group {
      min-width: unset;
    }
  }
  </style>