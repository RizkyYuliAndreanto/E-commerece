<template>
  <div id="app">
    <Navbar @toggle-admin-sidebar="toggleAdminSidebar" :is-admin-route="isAdminRoute" :is-admin="isAdmin" :is-sidebar-open-prop="isSidebarOpen" /> 

    <template v-if="isLoggedIn && isAdmin && isAdminRoute">
      <div class="admin-dashboard-layout"> 
        <AdminSidebar :is-open="isSidebarOpen" @close-sidebar="toggleAdminSidebar" /> <div class="admin-main-content-area"> <header class="admin-header">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Search..." />
            </div>
            <div class="header-right">
              <i class="fas fa-bell"></i>
              <div class="user-profile" @click="goToProfile">
                <img :src="user?.profilePic || 'https://placehold.co/30x30/aabbcc/ffffff?text=U'" alt="User Avatar" class="user-avatar" />
                <span>{{ user?.name || 'Admin' }}</span>
              </div>
            </div>
          </header>
          <router-view />
        </div>
      </div>
    </template>

    <template v-else>
      <router-view />
    </template>

    <div v-if="isSidebarOpen && isAdminRoute && isLoggedIn && windowWidth <= 768" 
         class="admin-sidebar-overlay" @click="toggleAdminSidebar"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Navbar from './components/Navbar.vue';
import AdminSidebar from './components/AdminSidebar.vue';

const route = useRoute();
const router = useRouter();

const user = ref(JSON.parse(localStorage.getItem('user')) || null);
const isLoggedIn = computed(() => !!localStorage.getItem('token'));
const isAdmin = computed(() => user.value && user.value.role === 'admin');
const isAdminRoute = computed(() => route.path.startsWith('/admin'));

const isSidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const toggleAdminSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const updateAuthStatus = () => {
  user.value = JSON.parse(localStorage.getItem('user')) || null;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (window.innerWidth > 768 && isSidebarOpen.value) {
    isSidebarOpen.value = false; // Tutup sidebar di desktop jika terbuka
  }
};

onMounted(() => {
  updateAuthStatus();
  window.addEventListener('storage', updateAuthStatus);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('storage', updateAuthStatus);
  window.removeEventListener('resize', handleResize);
});

const goToProfile = () => {
  router.push('/profile');
};
</script>

<style>
/* ==================================== */
/* Global Styles dan Variabel CSS Tema  */
/* ==================================== */

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

  --sidebar-bg: #ffffff;
  --sidebar-text: #6c757d;
  --sidebar-active-bg: var(--primary-yellow);
  --sidebar-active-text: var(--text-dark);
  --sidebar-icon-color: #9a9a9a;
  --sidebar-hover-bg: #f0f2f5;

  --navbar-height: 70px; 
  --admin-sidebar-width-desktop: 250px; /* Variabel baru untuk lebar sidebar desktop */
  --admin-sidebar-width-mobile: 250px; /* Lebar sidebar saat terbuka di mobile */
}

/* Reset CSS Dasar untuk Seluruh Aplikasi */
body {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--light-bg);
  color: var(--text-dark);
  line-height: 1.6;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ===================================== */
/* Gaya Layout Admin Spesifik            */
/* ===================================== */

.admin-dashboard-layout { 
  display: flex;
  width: 100%;
  /* Tinggi layout admin: sisa dari viewport setelah navbar utama */
  height: calc(100vh - var(--navbar-height)); 
  background-color: var(--dashboard-bg); 
  /* Posisi di bawah navbar utama */
  position: relative; /* Penting untuk z-index sidebar mobile */
  z-index: 1; /* Agar konten tidak tumpang tindih dengan navbar */
}

/* Kontainer utama untuk header admin + router-view (di samping sidebar) */
.admin-main-content-area { /* Nama kelas diubah */
  flex-grow: 1; /* Mengambil sisa lebar yang tersedia */
  padding: 20px 30px; 
  background-color: var(--dashboard-bg); 
  /* PENTING: Konten utama ini yang akan memiliki scrollbar */
  overflow-y: auto; 
  overflow-x: hidden; /* Sembunyikan horizontal agar tidak ada scrollbar bawah */
  box-sizing: border-box; /* Pastikan padding dihitung dalam lebar/tinggi */
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 15px 25px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.search-bar {
  position: relative;
}

.search-bar i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--icon-color);
}

.search-bar input {
  padding: 10px 15px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  width: 300px;
  font-size: 0.95em;
  color: var(--text-dark);
  background-color: #fcfcfc;
  transition: border-color 0.3s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--primary-yellow);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 25px;
}

.header-right i {
  font-size: 1.4em;
  color: var(--icon-color);
  cursor: pointer;
  transition: color 0.3s ease;
}

.header-right i:hover {
  color: var(--primary-yellow);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-yellow);
}

.user-profile span {
  font-weight: 600;
  color: var(--text-dark);
}

.primary-button {
  background-color: var(--primary-yellow);
  color: var(--text-dark);
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.primary-button:hover {
  background-color: var(--accent-yellow);
  transform: translateY(-2px);
}

/* Overlay untuk sidebar admin di mobile */
.admin-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1040; /* Di atas konten utama tapi di bawah sidebar mobile (z-index 1050) */
  pointer-events: auto; /* Aktifkan klik */
}


/* ====================== */
/* Media Queries (Responsif) */
/* ====================== */

@media (max-width: 768px) {
  .admin-header {
    display: none; /* Sembunyikan header admin di mobile */
  }

  .admin-dashboard-layout {
    flex-direction: row; /* TETAP flex-row di sini, karena sidebar mobile fixed */
    /* Sidebar mobile akan menggeser konten utama ke kanan */
    /* Ini akan ditangani di Navbar.vue dengan margin-left pada body jika sidebar terbuka,
       atau kita bisa gunakan grid/flex untuk layout mobile yang lebih canggih.
       Untuk saat ini, AdminSidebar akan fixed dan menutupi bagian layar. */
  }

  /* Konten utama admin akan mengambil lebar penuh yang tersisa */
  .admin-main-content-area {
    width: 100%; /* Ambil lebar penuh yang tersedia */
    padding: 15px; /* Kurangi padding di layar kecil */
    /* Margin-left atau transform bisa ditambahkan di sini jika sidebar tidak fixed penuh */
  }
}
</style>