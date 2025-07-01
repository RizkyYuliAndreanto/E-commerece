<template>
    <div class="admin-management-view">
      <div class="content-area">
        <h1 class="page-title">Manajemen Diskon</h1>
  
        <div class="card add-item-section">
          <h3>{{ editingDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru' }}</h3>
          <form @submit.prevent="saveDiscount">
            <div class="form-group">
              <label for="discountCode">Kode Diskon:</label>
              <input type="text" id="discountCode" v-model="discountForm.code" required>
            </div>
            <div class="form-group">
              <label for="discountType">Tipe Diskon:</label>
              <select id="discountType" v-model="discountForm.type" required>
                <option value="percentage">Persentase</option>
                <option value="fixed">Tetap</option>
              </select>
            </div>
            <div class="form-group">
              <label for="discountValue">Nilai Diskon:</label>
              <input type="number" id="discountValue" v-model.number="discountForm.value" min="0" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="discountStartDate">Tanggal Mulai:</label>
              <input type="date" id="discountStartDate" v-model="discountForm.start_date" required>
            </div>
            <div class="form-group">
              <label for="discountValidUntil">Berlaku Hingga:</label>
              <input type="date" id="discountValidUntil" v-model="discountForm.valid_until" required>
            </div>
            <div class="form-group">
              <label for="discountUsageLimit">Batas Penggunaan Per Pengguna (0 untuk tidak terbatas):</label>
              <input type="number" id="discountUsageLimit" v-model.number="discountForm.usage_limit_per_user" min="0">
            </div>
            <div class="form-group">
              <label for="discountTimezone">Zona Waktu (Opsional):</label>
              <select id="discountTimezone" v-model="discountForm.timezone">
                <option value="Asia/Jakarta">Asia/Jakarta</option>
                <option value="Asia/Makassar">Asia/Makassar</option>
                <option value="Asia/Jayapura">Asia/Jayapura</option>
              </select>
              <small>Digunakan untuk interpretasi tanggal mulai/berakhir.</small>
            </div>
            <div class="form-group">
              <input type="checkbox" id="discountActive" v-model="discountForm.active">
              <label for="discountActive" class="checkbox-label">Aktif</label>
            </div>
            <div class="form-group">
              <label for="discountImage">Gambar Diskon (Opsional):</label>
              <input type="file" id="discountImage" @change="handleImageUpload" accept="image/*">
              <p v-if="discountForm.image">Gambar saat ini: <a :href="discountForm.image" target="_blank">{{ discountForm.image.split('/').pop() }}</a></p>
              <button v-if="discountForm.image && editingDiscount" type="button" @click="removeImage" class="remove-image-button">Hapus Gambar</button>
            </div>
            
            <button type="submit" class="primary-button">{{ editingDiscount ? 'Perbarui Diskon' : 'Tambah Diskon' }}</button>
            <button type="button" v-if="editingDiscount" @click="cancelEdit" class="cancel-button">Batal</button>
          </form>
          <p v-if="formMessage" :class="formError ? 'error-message' : 'success-message'">{{ formMessage }}</p>
        </div>
  
        <div class="card list-item-section">
          <h3>Daftar Diskon</h3>
          <p v-if="loadingDiscounts" class="loading-message">Memuat daftar diskon...</p>
          <p v-if="discountsError" class="error-message">{{ discountsError }}</p>
          <div class="table-container" v-if="!loadingDiscounts && !discountsError && discounts.length">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Kode</th>
                  <th>Tipe</th>
                  <th>Nilai</th>
                  <th>Aktif</th>
                  <th>Tanggal Mulai</th>
                  <th>Berlaku Hingga</th>
                  <th>Batas Penggunaan</th>
                  <th>Gambar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="discount in discounts" :key="discount.id">
                  <td>{{ discount.id }}</td>
                  <td>{{ discount.code }}</td>
                  <td>{{ discount.type }}</td>
                  <td>{{ discount.type === 'percentage' ? discount.value + '%' : 'Rp ' + formatNumber(discount.value) }}</td>
                  <td>
                    <span :class="['status-indicator', discount.active ? 'active' : 'inactive']">
                      {{ discount.active ? 'Ya' : 'Tidak' }}
                    </span>
                  </td>
                  <td>{{ formatDate(discount.start_date) }}</td>
                  <td>{{ formatDate(discount.valid_until) }}</td>
                  <td>{{ discount.usage_limit_per_user === 0 ? 'Tidak Terbatas' : discount.usage_limit_per_user }}</td>
                  <td>
                    <img v-if="discount.image" :src="discount.image" alt="Discount Image" class="discount-thumb">
                    <span v-else>Tidak ada gambar</span>
                  </td>
                  <td>
                    <button @click="startEdit(discount)" class="edit-button">Edit</button>
                    <button @click="deleteDiscount(discount.id)" class="delete-button">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else-if="!loadingDiscounts && !discountsError">Tidak ada diskon ditemukan.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import api from '../../api/axios'; // Sesuaikan path
  
  const discounts = ref([]);
  const loadingDiscounts = ref(true);
  const discountsError = ref(null);
  const editingDiscount = ref(null); // Menyimpan diskon yang sedang diedit
  const formMessage = ref('');
  const formError = ref(false);
  
  const discountForm = ref({
    id: null,
    code: '',
    type: 'percentage', // default
    value: 0,
    active: true,
    start_date: '',
    valid_until: '',
    usage_limit_per_user: 0,
    timezone: 'Asia/Jakarta', // default
    image_file: null, // untuk file yang diupload
    image: null, // untuk URL gambar yang sudah ada
  });
  
  const fetchAllDiscounts = async () => {
    loadingDiscounts.value = true;
    discountsError.value = null;
    try {
      const response = await api.get('/admin/discounts'); // Endpoint yang sudah ada
      discounts.value = response.data.data;
    } catch (err) {
      console.error("Gagal mengambil daftar diskon:", err);
      discountsError.value = err.response?.data?.message || "Gagal memuat diskon.";
    } finally {
      loadingDiscounts.value = false;
    }
  };
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      discountForm.value.image_file = file;
      // Optionally, show a preview
      // discountForm.value.image = URL.createObjectURL(file);
    }
  };
  
  const removeImage = () => {
    discountForm.value.image = null; // Set URL di form menjadi null untuk menandai penghapusan di backend
    discountForm.value.image_file = null; // Hapus file yang mungkin sudah dipilih
    const fileInput = document.getElementById('discountImage');
    if (fileInput) fileInput.value = '';
  };
  
  
  const saveDiscount = async () => {
    formMessage.value = '';
    formError.value = false;
  
    // Validasi sederhana
    if (!discountForm.value.code || discountForm.value.value <= 0 || !discountForm.value.start_date || !discountForm.value.valid_until) {
      formMessage.value = 'Kode, nilai, dan tanggal wajib diisi dan valid.';
      formError.value = true;
      return;
    }
  
    // Format tanggal ke YYYY-MM-DD
    const formattedStartDate = discountForm.value.start_date instanceof Date
      ? discountForm.value.start_date.toISOString().slice(0, 10)
      : discountForm.value.start_date;
    const formattedValidUntil = discountForm.value.valid_until instanceof Date
      ? discountForm.value.valid_until.toISOString().slice(0, 10)
      : discountForm.value.valid_until;
  
    const formData = new FormData();
    formData.append('code', discountForm.value.code);
    formData.append('type', discountForm.value.type);
    formData.append('value', discountForm.value.value);
    formData.append('active', discountForm.value.active);
    formData.append('start_date', formattedStartDate);
    formData.append('valid_until', formattedValidUntil);
    formData.append('usage_limit_per_user', discountForm.value.usage_limit_per_user);
    formData.append('timezone', discountForm.value.timezone);
  
    if (discountForm.value.image_file) {
      formData.append('image', discountForm.value.image_file);
    } else if (discountForm.value.image === null && editingDiscount.value) {
      // Ini adalah cara untuk memberi tahu backend bahwa gambar harus dihapus
      // Anda perlu mengimplementasikan logika ini di backend jika belum ada
      formData.append('image', 'REMOVE_EXISTING_IMAGE'); // String penanda khusus
    }
  
    try {
      let response;
      if (editingDiscount.value) {
        response = await api.put(`/admin/discounts/${discountForm.value.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        formMessage.value = 'Diskon berhasil diperbarui!';
      } else {
        response = await api.post('/admin/discounts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        formMessage.value = 'Diskon berhasil ditambahkan!';
      }
      formError.value = false;
      resetForm();
      await fetchAllDiscounts();
    } catch (err) {
      console.error("Gagal menyimpan diskon:", err);
      formMessage.value = err.response?.data?.message || "Gagal menyimpan diskon.";
      formError.value = true;
    }
  };
  
  const startEdit = (discount) => {
    editingDiscount.value = discount;
    // Pastikan tanggal diformat ke 'YYYY-MM-DD' untuk input type="date"
    discountForm.value = {
      ...discount,
      start_date: discount.start_date.split('T')[0], // Mengambil hanya tanggal
      valid_until: discount.valid_until.split('T')[0], // Mengambil hanya tanggal
      image_file: null, // Pastikan input file direset
    };
    const fileInput = document.getElementById('discountImage');
    if (fileInput) fileInput.value = '';
    formMessage.value = '';
    formError.value = false;
  };
  
  const cancelEdit = () => {
    editingDiscount.value = null;
    resetForm();
    formMessage.value = '';
    formError.value = false;
  };
  
  const deleteDiscount = async (id) => {
    if (confirm(`Apakah Anda yakin ingin menghapus diskon dengan ID ${id}?`)) {
      try {
        await api.delete(`/admin/discounts/${id}`);
        formMessage.value = 'Diskon berhasil dihapus!';
        formError.value = false;
        await fetchAllDiscounts();
      } catch (err) {
        console.error("Gagal menghapus diskon:", err);
        formMessage.value = err.response?.data?.message || "Gagal menghapus diskon.";
        formError.value = true;
      }
    }
  };
  
  const resetForm = () => {
    discountForm.value = {
      id: null,
      code: '',
      type: 'percentage',
      value: 0,
      active: true,
      start_date: '',
      valid_until: '',
      usage_limit_per_user: 0,
      timezone: 'Asia/Jakarta',
      image_file: null,
      image: null,
    };
    const fileInput = document.getElementById('discountImage');
    if (fileInput) fileInput.value = '';
  };
  
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('id-ID');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  onMounted(() => {
    fetchAllDiscounts();
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
  .form-group input[type="date"],
  .form-group select,
  .form-group textarea {
    width: calc(100% - 20px);
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1em;
    color: var(--text-dark);
    background-color: #fcfcfc;
    transition: border-color 0.3s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-yellow);
  }
  
  .form-group textarea {
    resize: vertical;
  }
  
  .form-group .checkbox-label {
    display: inline-block;
    margin-left: 10px;
    font-weight: normal;
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
  
  .discount-thumb {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 5px;
  }
  
  .status-indicator {
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 0.8em;
    font-weight: 600;
    color: white;
  }
  .status-indicator.active { background-color: var(--green-accent); }
  .status-indicator.inactive { background-color: var(--primary-red); }
  
  
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