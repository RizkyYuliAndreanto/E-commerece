<template>
  <div class="profile-view">
    <p v-if="loading" class="loading-message">Memuat data profil...</p>
    <p v-if="error" class="error-message">{{ error }}</p>

    <div v-if="user && user.role !== 'admin'" class="profile-container">
      <h2 class="profile-title">Profil Pengguna</h2>
      <div class="profile-info">
        <p><strong>Nama:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Role:</strong> {{ user.role }}</p>
      </div>

      <router-link to="/edit-profile" class="edit-profile-button primary-button">
        Edit Profil
      </router-link>
      <button @click="logout" class="logout-button">Keluar</button>
    </div>

    <div v-if="loading === false && !user" class="profile-container">
      <p class="error-message">Anda perlu login untuk melihat profil.</p>
      <router-link to="/login" class="primary-button">Login Sekarang</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../api/axios"; // Sesuaikan path

const router = useRouter();
const user = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchUserProfile = async () => {
  try {
    const response = await api.get("/auth/me");
    user.value = response.data.data;

    // KUNCI PERUBAHAN: Redirect jika pengguna adalah admin
    if (user.value && user.value.role === 'admin') {
      router.replace('/admin/dashboard'); // Menggunakan replace agar tidak ada di riwayat browser
    }
  } catch (err) {
    console.error("Gagal mengambil data profil:", err);
    error.value = err.response?.data?.message || "Gagal memuat profil.";
    // Jika token tidak valid atau expired, arahkan ke login
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login'); // Menggunakan replace
    }
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("Anda telah keluar.");
  router.replace("/login"); // Menggunakan replace
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<style scoped>
/* Styling dasar agar sesuai tema */
:root {
  --primary-red: #e31937;
  --dark-red: #c1121f;
  --primary-yellow: #ffc72c;
  --accent-yellow: #ffaa00;
  --text-dark: #2b2d42;
  --text-light: #ffffff;
  --light-bg: #fff8f0;
}
.profile-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 70px); /* Sesuaikan tinggi navbar jika berbeda */
  background-color: var(--light-bg);
  padding: 20px;
}
.profile-container {
  background-color: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
  border: 3px solid var(--primary-yellow);
}
.profile-title {
  font-size: 2.5em;
  color: var(--text-dark);
  margin-bottom: 30px;
}
.profile-info p {
  font-size: 1.1em;
  color: var(--text-dark);
  margin-bottom: 10px;
  line-height: 1.6;
}
.loading-message, .error-message {
  color: var(--text-dark);
  font-size: 1.1em;
  margin-bottom: 20px;
}
.error-message {
    color: var(--primary-red);
}
.edit-profile-button {
  margin-top: 30px;
  display: inline-block;
  width: auto;
  margin-right: 10px;
}
.logout-button {
    background-color: var(--dark-red);
    color: var(--text-light);
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
}
.logout-button:hover {
    background-color: var(--primary-red);
    transform: translateY(-2px);
}

@media (max-width: 480px) {
  .profile-container {
    padding: 30px 20px;
    border-radius: 10px;
  }
  .profile-title {
    font-size: 2em;
  }
  .profile-info p {
    font-size: 1em;
  }
  .edit-profile-button {
    margin-right: 0;
    margin-bottom: 10px;
  }
  .logout-button {
    margin-top: 10px;
  }
}
</style>