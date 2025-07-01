<template>
    <aside :class="['admin-sidebar', { 'is-open': isOpen }]">
      <div class="sidebar-logo">
        <img src="/public/admin_3093091.png" alt="Boardio Logo" />
        <span>Boardio</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <router-link to="/admin/dashboard" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-chart-line"></i>
              <span class="nav-text">Reporting</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/transactions" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-exchange-alt"></i>
              <span class="nav-text">Transactions</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/users" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-users"></i>
              <span class="nav-text">User Management</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/products" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-boxes"></i>
              <span class="nav-text">Product Management</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/discounts" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-tags"></i>
              <span class="nav-text">Discount Management</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/orders" class="nav-item" active-class="active" @click="closeSidebar">
              <i class="fas fa-receipt"></i>
              <span class="nav-text">Order Management</span>
            </router-link>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/profile" class="nav-item" active-class="active" @click="closeSidebar"> <i class="fas fa-user-circle"></i>
          <span class="nav-text">Back to Profile</span>
        </router-link>
        <button @click="logout" class="nav-item logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span class="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['close-sidebar']);
  
  const router = useRouter();
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Anda telah keluar.");
    router.push("/login");
    emit('close-sidebar');
  };
  
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
        emit('close-sidebar');
    }
  };
  </script>
  
  <style scoped>
  /* ==================================================== */
  /* Variabel CSS (Harus Didefinisikan di App.vue atau Global CSS) */
  /* ==================================================== */
  
  /* =========================== */
  /* Gaya Sidebar Admin (Desktop Default) */
  /* =========================== */
  .admin-sidebar {
    /* Opsi 1: Sedikit tambah lebar sidebar jika memungkinkan desain */
    width: 260px; /* Diubah dari 250px ke 260px */
  
    background-color: var(--sidebar-bg);
    padding: 20px 15px; /* Padding samping 15px */
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
    border-right: 1px solid var(--border-color);
    z-index: 990; 
  
    position: sticky;
    top: var(--navbar-height);
    align-self: flex-start;
    height: calc(100vh - var(--navbar-height)); 
    overflow-y: auto; 
    overflow-x: hidden;
    transition: transform 0.3s ease-in-out, width 0.3s ease-in-out;
    transform: translateX(0);
    flex-shrink: 0;
  }
  
  .sidebar-logo {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 30px;
    padding: 10px 0;
    color: var(--text-dark);
    font-weight: bold;
    font-size: 1.3em;
  }
  
  .sidebar-logo img {
    height: 40px;
    width: 40px;
    object-fit: contain;
    border-radius: 50%;
    border: 2px solid var(--primary-yellow);
  }
  
  .sidebar-nav {
    flex-grow: 1;
    overflow-y: auto;
    padding-right: 10px;
    box-sizing: border-box;
  }
  
  .sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    /* Konsistenkan gap: bisa lebih kecil atau sama dengan padding */
    gap: 10px; /* Dipertahankan 10px */
    padding: 12px 15px; /* Padding samping 15px */
    margin-bottom: 8px;
    border-radius: 10px;
    color: var(--sidebar-text);
    text-decoration: none;
    /* Opsi 2: Sedikit kurangi ukuran font jika penambahan lebar tidak cukup atau tidak diinginkan */
    /* font-size: 0.95em; */
    transition: all 0.3s ease;
  }
  
  .nav-item i {
    font-size: 1.2em;
    color: var(--sidebar-icon-color);
    transition: color 0.3s ease;
    flex-shrink: 0;
  }
  
  .nav-item .nav-text {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1; 
    min-width: 0; /* Penting untuk ellipsis */
    /* Opsi 3: Tambah sedikit padding-right di nav-text itu sendiri jika diperlukan,
       tapi hati-hati agar tidak menambah lebar item terlalu banyak */
    /* padding-right: 5px; */
  }
  
  .nav-item:hover {
    background-color: var(--sidebar-hover-bg);
    color: var(--text-dark);
  }
  
  .nav-item:hover i {
    color: var(--primary-yellow);
  }
  
  .nav-item.active {
    background-color: var(--sidebar-active-bg);
    color: var(--sidebar-active-text);
    font-weight: 600;
  }
  
  .nav-item.active i {
    color: var(--sidebar-active-text);
  }
  
  .sidebar-footer {
    flex-shrink: 0;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    margin-top: 20px;
  }
  
  .logout-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 15px;
    border-radius: 10px;
    color: var(--sidebar-text);
    font-size: 1em;
    transition: all 0.3s ease;
  }
  
  .logout-btn:hover {
    background-color: var(--sidebar-hover-bg);
    color: var(--text-dark);
  }
  
  /* =========================== */
  /* Gaya Sidebar Admin (Mobile) */
  /* =========================== */
  @media (max-width: 768px) {
    .admin-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: var(--admin-sidebar-width-mobile); /* Menggunakan variabel mobile width */
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
      background-color: var(--sidebar-bg);
      z-index: 1050;
      box-shadow: 2px 0 10px rgba(0,0,0,0.2);
      padding-bottom: 20px;
      box-sizing: border-box;
  
      /* Mobile: teks menu harus tampil penuh */
      .nav-text {
          white-space: nowrap; /* Pastikan tidak pecah baris */
          overflow: hidden; /* Sembunyikan jika melebihi */
          text-overflow: ellipsis; /* Tambahkan elipsis jika tersembunyi */
      }
    }
  
    .admin-sidebar.is-open {
      transform: translateX(0%);
    }
  
    .sidebar-logo span,
    .nav-text {
        display: block; /* Memastikan teks selalu tampil di mobile */
    }
    .nav-item {
        justify-content: flex-start; /* Rata kiri dengan ikon */
    }
    .sidebar-footer {
        border-top: 1px solid var(--border-color);
        padding-top: 20px;
    }
    .logout-btn {
        justify-content: flex-start;
    }
  }
  </style>