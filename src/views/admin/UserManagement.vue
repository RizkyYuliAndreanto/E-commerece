<template>
    <div class="admin-management-view">
      <div class="content-area">
        <h1>Manajemen Pengguna</h1>
        <p>Di sini admin dapat melihat, menambah, mengedit, dan menghapus pengguna.</p>
        <div v-if="loadingUsers">Memuat daftar pengguna...</div>
        <div v-if="userError" class="error-message">{{ userError }}</div>
        <div class="table-container" v-if="!loadingUsers && !userError && users.length">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  <button @click="editUser(user)">Edit</button>
                  <button @click="deleteUser(user.id)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="!loadingUsers && !userError">Tidak ada pengguna ditemukan.</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import api from '../../api/axios'; // Sesuaikan path
  
  // HAPUS IMPORT ADMINSIDEBAR DARI SINI
  // import AdminSidebar from '../../components/AdminSidebar.vue'; // Jika ini ada, hapus!
  
  const users = ref([]);
  const loadingUsers = ref(true);
  const userError = ref(null);
  
  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      users.value = response.data.data;
    } catch (err) {
      console.error("Gagal mengambil daftar pengguna:", err);
      userError.value = err.response?.data?.message || "Gagal memuat pengguna.";
    } finally {
      loadingUsers.value = false;
    }
  };
  
  const editUser = (user) => {
    alert(`Mengedit pengguna: ${user.name}`);
  };
  
  const deleteUser = async (userId) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna dengan ID ${userId}?`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        users.value = users.value.filter(user => user.id !== userId);
        alert('Pengguna berhasil dihapus!');
      } catch (err) {
        console.error("Gagal menghapus pengguna:", err);
        alert(err.response?.data?.message || "Gagal menghapus pengguna.");
      }
    }
  };
  
  onMounted(() => {
    fetchAllUsers();
  });
  </script>
  
  <style scoped>
  /* Pastikan Anda menggunakan gaya ini dari file CSS umum jika memungkinkan */
  .admin-management-view {
    /* Ini adalah wrapper keseluruhan, pastikan tidak menambahkan display:flex yang akan mengganggu */
    /* Min-height agar halaman tidak terlalu pendek jika konten sedikit */
    min-height: calc(100vh - 120px); /* Sesuaikan jika perlu */
  }
  
  .content-area {
    /* Ini adalah area konten utama di mana manajemen pengguna akan ditampilkan */
    padding: 20px;
    background-color: var(--card-bg); /* Menggunakan variabel tema */
    border-radius: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px; /* Jarak bawah jika ada konten lain */
  }
  
  h1 {
    font-size: 2.2em;
    color: var(--text-dark);
    margin-bottom: 30px;
    font-weight: 700;
  }
  
  table {
    width: 100%;
    border-collapse: separate; /* Gunakan separate untuk border-spacing */
    border-spacing: 0 10px; /* Jarak antar baris */
    margin-top: 20px;
  }
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border: none; /* Hapus border default */
    background-color: var(--card-bg); /* Background sel */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03); /* Bayangan lembut */
  }
  
  th {
    background-color: #f8f9fa; /* Background header tabel */
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  
  /* Sudut membulat untuk header tabel */
  thead tr th:first-child { border-top-left-radius: 10px; }
  thead tr th:last-child { border-top-right-radius: 10px; }
  tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
  tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }
  
  button {
    padding: 8px 12px;
    margin-right: 5px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: var(--primary-blue); /* Contoh warna */
    color: white;
    transition: background-color 0.3s ease;
  }
  
  button:hover {
    background-color: #0056b3; /* Warna hover */
  }
  
  .delete-button {
    background-color: var(--primary-red);
  }
  
  .delete-button:hover {
    background-color: var(--dark-red);
  }
  
  .loading-message, .error-message {
    text-align: center;
    margin-top: 20px;
    color: var(--text-dark);
    font-size: 1.1em;
  }
  
  .error-message {
    color: var(--primary-red);
  }
  </style>