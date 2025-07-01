// frontend/src/router/index.js

import { createRouter, createWebHistory } from "vue-router";

// ======================================
// Impor Komponen Layout
// ======================================
// DefaultLayout akan digunakan untuk sebagian besar halaman user (publik dan terautentikasi)
// DefaultLayout ini yang akan merender Navbar Anda.
import DefaultLayout from "../layouts/DefaultLayout.vue";

// ======================================
// Impor Komponen Views (Halaman)
// ======================================
import HomeView from "../views/HomeView.vue";
import AboutView from "../views/AboutView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import MenuView from "../views/MenuView.vue";
import CartView from "../views/CartView.vue";
import OrderView from "../views/OrderView.vue";
import OrderHistoryView from "../views/OrderHistoryView.vue";
import PromoView from "../views/PromoView.vue";

// Impor komponen Admin Views
import DashboardView from "../views/admin/DashboardView.vue";
import TransactionReport from "../views/admin/TransactionReport.vue";
import UserManagement from "../views/admin/UserManagement.vue";
import ProductManagement from "../views/admin/ProductManagement.vue";
import DiscountManagement from "../views/admin/DiscountManagement.vue";
import OrderManagement from "../views/admin/OrderManagement.vue";

// ======================================
// Definisi Rute Aplikasi
// ======================================
const routes = [
  {
    // Ini adalah rute induk yang akan menggunakan DefaultLayout
    // Semua rute anak di sini akan memiliki Navbar yang disediakan oleh DefaultLayout
    path: "/",
    component: DefaultLayout, // Komponen ini akan merender Navbar dan <router-view>
    children: [
      {
        // Rute ini akan menjadi `/` (beranda) dan dirender di dalam <router-view> DefaultLayout
        path: "",
        name: "Home",
        component: HomeView,
      },
      {
        path: "about",
        name: "About",
        component: AboutView,
      },
      {
        path: "menu",
        name: "Menu",
        component: MenuView,
      },
      {
        path: "cart",
        name: "Cart",
        component: CartView,
      },
      {
        path: "order",
        name: "Order",
        component: OrderView,
      },
      {
        path: "order-history",
        name: "OrderHistory",
        component: OrderHistoryView,
        meta: { requiresAuth: true }, // Hanya bisa diakses jika sudah login
      },
      {
        path: "promo",
        name: "Promo",
        component: PromoView,
      },
      {
        path: "profile",
        name: "Profile",
        component: ProfileView,
        meta: { requiresAuth: true }, // Hanya bisa diakses jika sudah login
      },
    ],
  },

  // Rute-rute yang tidak menggunakan DefaultLayout (misalnya, halaman login/register
  // seringkali tidak memiliki navbar atau tata letak penuh aplikasi)
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
  },

  // ======================================
  // Rute Admin (Dilindungi)
  // Rute ini akan memiliki layout yang berbeda, dikelola langsung di App.vue
  // ======================================
  {
    path: "/admin/dashboard",
    name: "AdminDashboard",
    component: DashboardView,
    meta: { requiresAuth: true, requiresAdmin: true }, // Membutuhkan otentikasi & peran admin
  },
  {
    path: "/admin/transactions",
    name: "TransactionReport",
    component: TransactionReport,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/users",
    name: "UserManagement",
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/products",
    name: "ProductManagement",
    component: ProductManagement,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/discounts",
    name: "DiscountManagement",
    component: DiscountManagement,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/orders",
    name: "OrderManagement",
    component: OrderManagement,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // ======================================
  // Catch-all (404 Not Found)
  // ======================================
  // {
  //   path: "/:catchAll(.*)",
  //   name: "NotFound",
  //   component: () => import("../views/NotFoundView.vue"), // Pastikan Anda memiliki NotFoundView.vue
  // },
];

// Membuat instance router
const router = createRouter({
  history: createWebHistory(), // Menggunakan HTML5 History API
  routes, // Daftar rute yang telah didefinisikan
});

// ======================================
// Navigation Guards (Penjaga Navigasi)
// ======================================
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("token"); // Cek token di localStorage
  const user = JSON.parse(localStorage.getItem("user")); // Ambil data user dari localStorage

  // Jika rute membutuhkan otentikasi tapi pengguna belum login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login"); // Redirect ke halaman login
  }
  // Jika rute membutuhkan peran admin, tapi pengguna belum login atau bukan admin
  else if (
    to.meta.requiresAdmin &&
    (!isAuthenticated || user?.role !== "admin")
  ) {
    alert(
      "Akses Ditolak: Anda harus menjadi administrator untuk melihat halaman ini."
    );
    next("/profile"); // Redirect ke halaman profil atau halaman lain yang sesuai
  }
  // Jika semuanya OK, lanjutkan ke rute tujuan
  else {
    next();
  }
});

// Ekspor router agar bisa digunakan di main.js
export default router;
