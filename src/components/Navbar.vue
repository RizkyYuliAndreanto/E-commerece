<template>
  <nav class="navbar" ref="navbarRef">
    <router-link to="/" class="nav-brand">
      <img :src="Logo" alt="Foodiez Logo" class="logo" />
      Foodiez
    </router-link>

    <div :class="['nav-main-content-wrapper', { 'nav-open': navOpen }]">
      <div class="nav-links">
        <router-link to="/" class="nav-item" @click="closeNav">Beranda</router-link>
        <router-link to="/menu" class="nav-item" @click="closeNav">Menu</router-link>
        <router-link to="/promo" class="nav-item" @click="closeNav">Promo</router-link>
        <router-link to="/tentang" class="nav-item" @click="closeNav">Tentang Kami</router-link>

        <router-link to="/menu" class="nav-item primary-button" @click="closeNav">
          Pesan Sekarang
        </router-link>
      </div>

      <div class="nav-icons-wrapper">
        <router-link
          to="/cart"
          class="cart-icon-link"
          aria-label="Lihat Keranjang"
          @click="closeNav">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-shopping-cart">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
        </router-link>

        <router-link
          to="/profile"
          class="profile-icon-link"
          aria-label="Lihat Profil"
          @click="closeNav">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-user">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </router-link>
      </div>
    </div>

    <button
      v-if="isMobile && (!isAdminRoute || (isAdminRoute && isAdmin))" 
      class="hamburger-menu"
      @click="handleHamburgerClick"
      aria-label="Toggle navigation">
      <svg
        v-show="!navOpen && (!isAdminRoute || (isAdminRoute && !isSidebarOpenProp))"
        ref="menuIconRef"
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-menu">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>

      <svg
        v-show="navOpen || (isAdminRoute && isSidebarOpenProp)"
        ref="closeIconRef"
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-x">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </nav>

  <div v-if="navOpen && !isAdminRoute" class="menu-overlay" @click="closeNav"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from "vue";
import { gsap } from "gsap";
import Logo from "../assets/Logo.jpeg";
import api from "../api/axios";

// Definisikan props yang diterima dari App.vue
const props = defineProps({
  isAdminRoute: {
    type: Boolean,
    default: false
  },
  isAdmin: { // Prop ini digunakan untuk logika v-if hamburger menu
    type: Boolean,
    default: false
  },
  // Prop ini akan digunakan jika App.vue ingin mengontrol ikon silang hamburger di Navbar
  // saat sidebar admin terbuka/tertutup
  isSidebarOpenProp: {
    type: Boolean,
    default: false
  }
});

// Definisikan emits untuk mengirim event ke App.vue
const emit = defineEmits(['toggle-admin-sidebar']);

const navOpen = ref(false); // State untuk menu navigasi standar (non-admin)
const menuIconRef = ref(null);
const closeIconRef = ref(null);
const navbarRef = ref(null);
const cartItemCount = ref(0);
const isMobile = ref(window.innerWidth <= 768); // Untuk mengetahui apakah sedang di tampilan mobile

// Menangani klik hamburger:
// Jika bukan rute admin, buka/tutup menu standar (navOpen)
// Jika rute admin, pancarkan event ke App.vue untuk membuka/tutup sidebar admin
const handleHamburgerClick = () => {
  if (!props.isAdminRoute) {
    toggleNav(); // Untuk menu navigasi standar (non-admin)
  } else {
    emit('toggle-admin-sidebar'); // Untuk sidebar admin
  }
};


const toggleNav = () => {
  navOpen.value = !navOpen.value;
};

const closeNav = () => {
  navOpen.value = false;
};

const fetchCartItemCount = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      cartItemCount.value = 0;
      return;
    }
    const response = await api.get("/cart");
    cartItemCount.value = response.data.data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  } catch (err) {
    console.error("Gagal mengambil jumlah item keranjang:", err);
    cartItemCount.value = 0;
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (window.innerWidth > 768) {
    if (navOpen.value) {
      navOpen.value = false;
    }
    // Pastikan GSAP properti direset untuk desktop
    gsap.set(".nav-main-content-wrapper", { x: 0 });
    gsap.set(".menu-overlay", { opacity: 0, pointerEvents: 'none' });
  } else {
     // Pastikan ikon sesuai state di mobile jika resize dari desktop
     // Ini akan ditangani oleh watcher `navOpen` atau `isSidebarOpenProp`
  }
};

onMounted(() => {
  // Animasi awal GSAP (hanya untuk menu utama, tidak berlaku untuk sidebar admin)
  // Periksa dulu apakah rute saat ini bukan rute admin agar animasi ini hanya jalan di menu utama
  if (!props.isAdminRoute) {
    gsap.from(".nav-brand", {
      opacity: 0, x: -50, duration: 0.8, ease: "elastic.out(1, 0.5)",
    });
    gsap.fromTo(
      ".nav-links .nav-item",
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out", delay: 0.3 }
    );
    gsap.fromTo(
      ".nav-icons-wrapper .cart-icon-link, .nav-icons-wrapper .profile-icon-link",
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out", delay: 0.7 }
    );
  }

  fetchCartItemCount();
  window.addEventListener("cart-updated", fetchCartItemCount);
  window.addEventListener("resize", handleResize);

  // Fungsi handleClickOutside hanya relevan untuk menu standar, bukan sidebar admin
  const handleClickOutside = (event) => {
    if (navOpen.value && isMobile.value) {
      const navMainContentWrapper = document.querySelector(".nav-main-content-wrapper");
      const hamburgerButton = document.querySelector(".hamburger-menu");
      if (
        navMainContentWrapper &&
        !navMainContentWrapper.contains(event.target) &&
        hamburgerButton &&
        !hamburgerButton.contains(event.target)
      ) {
        closeNav();
      }
    }
  };
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("cart-updated", fetchCartItemCount);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
});

// Watch navOpen (untuk menu standar non-admin)
watch(navOpen, (newVal) => {
  if (!props.isAdminRoute) { // Hanya berlaku jika bukan rute admin
    if (newVal) {
      gsap.to(".nav-main-content-wrapper", { x: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".nav-links .nav-item", { opacity: 0, x: 30 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.4, ease: "back.out(1.7)", delay: 0.2 });
      gsap.fromTo(".nav-icons-wrapper .cart-icon-link, .nav-icons-wrapper .profile-icon-link", { opacity: 0, x: 30 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.4, ease: "back.out(1.7)", delay: 0.5 });
      gsap.to(".menu-overlay", { opacity: 1, duration: 0.3, pointerEvents: 'auto' });
    } else {
      if (isMobile.value) {
        gsap.to(".nav-main-content-wrapper", { x: "100%", duration: 0.4, ease: "power3.in" });
      }
      gsap.to(".menu-overlay", { opacity: 0, duration: 0.3, pointerEvents: 'none' });
    }
    // Animasi ikon hamburger di Navbar untuk menu standar
    if (newVal) { // Menu standar terbuka -> tampilkan X
      gsap.to(menuIconRef.value, { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" });
      gsap.fromTo(closeIconRef.value, { opacity: 0, scale: 0.8, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.3, ease: "back.out(1.7)", delay: 0.1 });
    } else { // Menu standar tertutup -> tampilkan hamburger
      gsap.to(closeIconRef.value, { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" });
      gsap.fromTo(menuIconRef.value, { opacity: 0, scale: 0.8, rotate: 90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.3, ease: "back.out(1.7)", delay: 0.1 });
    }
  }
});

// Watch `isSidebarOpenProp` dari App.vue (hanya relevan untuk rute admin di mobile)
watch(() => props.isSidebarOpenProp, (newVal) => {
  if (props.isAdminRoute && isMobile.value) {
    if (newVal) { // Sidebar admin terbuka -> tampilkan X
      gsap.to(menuIconRef.value, { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" });
      gsap.fromTo(closeIconRef.value, { opacity: 0, scale: 0.8, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.3, ease: "back.out(1.7)", delay: 0.1 });
    } else { // Sidebar admin tertutup -> tampilkan hamburger
      gsap.to(closeIconRef.value, { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" });
      gsap.fromTo(menuIconRef.value, { opacity: 0, scale: 0.8, rotate: 90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.3, ease: "back.out(1.7)", delay: 0.1 });
    }
  }
}, { immediate: true }); // immediate agar berjalan saat mounted juga
</script>

<style scoped>
/* Variabel CSS sudah ada di App.vue */

.navbar {
  background: linear-gradient(
    135deg,
    var(--primary-red) 0%,
    var(--dark-red) 100%
  );
  padding: 15px 5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(230, 57, 70, 0.3);
  position: sticky; /* Atau fixed jika ingin selalu di atas */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  min-height: var(--navbar-height);
}

.nav-brand {
  display: flex;
  align-items: center;
  color: var(--text-light);
  font-size: 1.8em;
  font-weight: 800;
  text-decoration: none;
  letter-spacing: 1px;
  font-family: "Poppins", sans-serif;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.nav-brand .logo {
  width: 45px;
  height: 45px;
  margin-right: 12px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-yellow);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Wrapper Utama untuk Nav Links dan Icons */
.nav-main-content-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;
}

.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-item {
  color: var(--text-light);
  text-decoration: none;
  padding: 10px 15px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-weight: 600;
  font-size: 1.1em;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.nav-item:not(.primary-button):hover,
.nav-item:not(.primary-button).router-link-active {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.nav-item:not(.primary-button):after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary-yellow);
  transition: all 0.3s ease;
}

.nav-item:not(.primary-button):hover:after,
.nav-item:not(.primary-button).router-link-active:after {
  width: 70%;
  left: 15%;
}

.primary-button {
  background-color: var(--primary-yellow);
  color: var(--text-dark);
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(255, 179, 3, 0.4);
  border: none;
  font-size: 1.1em;
  outline: none;
}

.primary-button:hover {
  background-color: var(--accent-yellow);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 179, 3, 0.6);
}

.nav-icons-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 10px;
}

.cart-icon-link,
.profile-icon-link {
  color: var(--text-light);
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
}

.cart-icon-link:hover,
.profile-icon-link:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.1);
  color: var(--primary-yellow);
}

.cart-badge {
  background-color: var(--primary-yellow);
  color: var(--primary-red);
  font-size: 0.75em;
  font-weight: 700;
  border-radius: 50%;
  padding: 3px 7px;
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  text-align: center;
  line-height: 1;
}

.hamburger-menu {
  display: none; /* Default hidden, shown only on mobile by media query */
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 1001; /* Pastikan di atas overlay */
  position: relative;
  width: 48px;
  height: 48px;
  transition: transform 0.3s ease;
}

.hamburger-menu:active {
  transform: scale(0.9);
}

.hamburger-menu svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  color: var(--text-light);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
}

/* Responsive Styles */
@media (max-width: 992px) {
  .navbar {
    padding: 10px 3%;
  }
  .nav-brand {
    font-size: 1.6em;
  }
  .nav-brand .logo {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
  .nav-links {
    gap: 15px;
  }
  .nav-item {
    font-size: 1em;
    padding: 8px 12px;
  }
  .primary-button {
    padding: 10px 20px;
    font-size: 1em;
  }
  .nav-icons-wrapper {
    gap: 8px;
  }
  .cart-icon-link,
  .profile-icon-link {
    padding: 6px;
    width: 24px;
    height: 24px;
  }
  .cart-icon-link svg,
  .profile-icon-link svg {
    width: 24px;
    height: 24px;
  }
  .cart-badge {
    font-size: 0.65em;
    top: -6px;
    right: -6px;
  }
}

/* Breakpoint untuk mobile (768px dan di bawahnya) */
@media (max-width: 768px) {
  /* Tampilkan hamburger menu di mobile */
  .hamburger-menu {
    display: flex; /* Hamburger menu akan tampil */
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
  }

  /* Sembunyikan nav-links dan nav-icons-wrapper di desktop (saat navOpen false) */
  .nav-main-content-wrapper {
    position: fixed;
    top: 0;
    right: 0;
    width: 75%;
    max-width: 300px;
    height: 100vh;
    background: linear-gradient(
      135deg,
      var(--dark-red) 0%,
      var(--primary-red) 100%
    );
    flex-direction: column;
    justify-content: flex-start;
    transform: translateX(100%); /* Sembunyikan secara default */
    transition: none; /* GSAP yang mengatur transisi */
    gap: 30px;
    padding: 100px 0 50px;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
    z-index: 999;
    align-items: center;
  }

  /* Saat menu terbuka di mobile, geser wrapper ke posisi 0 */
  .nav-main-content-wrapper.nav-open {
    transform: translateX(0%);
  }

  /* Tata letak item di dalam sidebar mobile */
  .nav-links {
    flex-direction: column;
    width: 100%;
    gap: 25px;
    align-items: center;
  }

  .nav-item {
    width: 80%;
    text-align: center;
    padding: 12px;
    font-size: 1.1em;
    border-radius: 50px;
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .primary-button {
    margin-top: 20px;
    width: 80%;
    font-size: 1.05em;
  }

  .nav-item:after {
    display: none; /* Sembunyikan underline hover di mobile menu */
  }

  .nav-icons-wrapper { /* Ikon di dalam sidebar mobile */
    display: flex;
    flex-direction: row; /* Tampilkan berdampingan */
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 30px;
    width: 100%;
  }

  .nav-icons-wrapper .cart-icon-link,
  .nav-icons-wrapper .profile-icon-link {
    position: static;
    background-color: rgba(255, 255, 255, 0.1);
    width: 50px;
    height: 50px;
  }
  .nav-icons-wrapper .cart-icon-link svg,
  .nav-icons-wrapper .profile-icon-link svg {
     width: 28px;
     height: 28px;
  }

  .cart-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    font-size: 0.7em;
  }

  /* Aktifkan overlay saat menu terbuka di mobile */
  .menu-overlay {
    pointer-events: auto;
  }
}

/* Tambahan breakpoint untuk mobile sangat kecil */
@media (max-width: 480px) {
  .navbar {
    padding: 10px 2%;
  }
  .nav-brand {
    font-size: 1.5em;
  }
  .nav-brand .logo {
    width: 35px;
    height: 35px;
  }
  .nav-links {
    gap: 15px;
  }
  .nav-item {
    font-size: 1em;
    padding: 10px;
  }
  .primary-button {
    padding: 10px 18px;
    font-size: 1em;
  }
  .hamburger-menu {
    width: 40px;
    height: 40px;
  }
  .hamburger-menu svg {
    width: 24px;
    height: 24px;
  }
  .nav-main-content-wrapper {
    width: 85%;
    max-width: 250px;
  }
}
</style>