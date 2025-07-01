<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          PROMO SPESIAL <br />
          BURGER MANTAP!
        </h1>
        <p class="hero-description">
          Dapatkan burger favorit Anda dengan harga spesial, dilengkapi kentang
          goreng renyah dan minuman segar. Jangan sampai ketinggalan!
        </p>
        <router-link to="/promo" class="hero-button primary-button">
          LIHAT PROMO SEKARANG
        </router-link>
      </div>
      <div class="hero-image-wrapper">
        <img
          :src="Promo"
          alt="Burger Spesial Foodiez"
          class="main-product-img" />
        <div class="splash-detail top-right">
          <span class="price-label">Mulai Dari</span>
          <span class="price">Rp 39.999</span>
        </div>
        <div class="splash-detail bottom-left">
          <img :src="Logo" alt="Foodiez Icon" class="mini-logo" />
          <p>Hanya di Foodiez</p>
        </div>
      </div>
    </section>

    <section class="menu-categories-section">
      <h2>Jelajahi Kategori Menu</h2>
      <Carousel
        :items-to-show="2.5"
        :wrap-around="true"
        :breakpoints="carouselBreakpoints">
        <Slide v-for="(category, index) in categories" :key="index">
          <router-link :to="category.link" class="category-item">
            <img :src="category.img" :alt="category.name" />
            <span>{{ category.name }}</span>
          </router-link>
        </Slide>

        <template #addons>
          <Navigation />
          <Pagination />
        </template>
      </Carousel>
    </section>

    <section class="app-promo-section">
      <div class="app-promo-content">
        <h2 class="app-promo-title">Foodiez Kini Ada di Genggaman Anda!</h2>
        <p class="app-promo-description">
          Pesan makanan favorit Anda lebih mudah dan cepat dengan aplikasi
          mobile Foodiez. Dapatkan promo eksklusif hanya di aplikasi!
        </p>
        <div class="app-stores">
          <a href="#" class="app-store-button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
              alt="Download on the App Store" />
          </a>
          <a href="#" class="app-store-button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Get it on Google Play" />
          </a>
        </div>
      </div>
      <div class="app-promo-image">
        <img :src="appMockup" alt="Foodiez App Mockup" />
      </div>
    </section>

    <section class="promo-grid-section">
      <div class="promo-card">
        <img
          src="https://via.placeholder.com/300x200/E63946/FFF?text=Diskon+Pembelian+Pertama"
          alt="Promo Diskon" />
        <div class="promo-content">
          <h3>Diskon Pembelian Pertama!</h3>
          <p>Khusus pengguna baru, dapatkan diskon 15% untuk semua menu.</p>
          <router-link to="/register" class="promo-button"
            >Daftar Sekarang</router-link
          >
        </div>
      </div>
      <div class="promo-card">
        <img
          src="https://via.placeholder.com/300x200/FFD166/E63946?text=Gratis+Ongkir"
          alt="Promo Ongkir" />
        <div class="promo-content">
          <h3>Gratis Ongkir!</h3>
          <p>Nikmati pengiriman gratis untuk pesanan di atas Rp 75.000.</p>
          <router-link to="/pesan" class="promo-button"
            >Pesan Sekarang</router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger"; // Penting: import ScrollTrigger

// Import gambar
import hero from "../assets/hero.jpg"; // Pastikan path ini sesuai dengan lokasi gambar hero
import appMockup from "../assets/app-mockup.jpg"; // Pastikan path ini sesuai
import Makanan from "../assets/Makanan.jpeg";
import Drink from "../assets/Drink.jpeg";
import Snack from "../assets/Snack.jpeg";
import Camilan from "../assets/Camilan.jpeg";
import Dessert from "../assets/Dessert.jpeg";
import Promo from "../assets/Promo.jpeg";
import Logo from "../assets/Logo.jpeg";

// Import components dari vue3-carousel
import { Carousel, Slide, Navigation, Pagination } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css"; // Import CSS default carousel

gsap.registerPlugin(ScrollTrigger); // Daftarkan ScrollTrigger

// Data untuk kategori carousel
const categories = ref([
  {
    name: "Makanan Utama", // Mengubah nama agar lebih jelas
    img: Makanan, // Menggunakan gambar yang diimpor
    link: "/menu/makanan-utama",
  },
  {
    name: "Minuman",
    img: Drink, // Menggunakan gambar yang diimpor
    link: "/menu/minuman",
  },
  {
    name: "Snack",
    img: Snack, // Menggunakan gambar yang diimpor
    link: "/menu/snack",
  },
  {
    name: "Camilan",
    img: Camilan, // Menggunakan gambar yang diimpor
    link: "/menu/camilan",
  },
  {
    name: "Dessert",
    img: Dessert, // Menggunakan gambar yang diimpor
    link: "/menu/dessert",
  },
]);

// Breakpoints untuk responsive carousel
const carouselBreakpoints = {
  320: {
    // Ukuran layar kecil
    itemsToShow: 2.5,
    snapAlign: "start",
  },
  768: {
    // Tablet
    itemsToShow: 4.5,
    snapAlign: "start",
  },
  1024: {
    // Desktop
    itemsToShow: 6,
    snapAlign: "center",
  },
};

onMounted(() => {
  gsap.from(".hero-content", {
    opacity: 0,
    x: -50,
    duration: 1,
    ease: "power3.out",
    delay: 0.5,
  });
  // Animasi hero-image-wrapper
  gsap.from(".hero-image-wrapper", {
    opacity: 0,
    x: 50,
    duration: 1,
    ease: "power3.out",
    delay: 0.7,
  });
  gsap.from(".hero-button", {
    opacity: 0,
    y: 20,
    duration: 0.7,
    ease: "back.out(1.7)",
    delay: 1,
  });
  gsap.from(".splash-detail", {
    opacity: 0,
    scale: 0.5,
    stagger: 0.3,
    duration: 0.6,
    ease: "back.out(1.7)",
    delay: 1.2,
  });

  // Animasi untuk judul kategori carousel
  gsap.from(".menu-categories-section h2", {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".menu-categories-section",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  // Animasi untuk promo cards
  gsap.from(".promo-card", {
    opacity: 0,
    y: 50,
    stagger: 0.2,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".promo-grid-section",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  // Animasi untuk App Promo Section
  gsap.from(".app-promo-content", {
    opacity: 0,
    x: -50,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".app-promo-section",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });
  gsap.from(".app-promo-image", {
    opacity: 0,
    x: 50,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.2, // Memberi sedikit delay agar konten muncul duluan
    scrollTrigger: {
      trigger: ".app-promo-section",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });
});
</script>

<style scoped>
/* Vibrant Burger Theme Colors */
:root {
  --primary-red: #e31937; /* Vibrant fast-food red */
  --dark-red: #c1121f; /* Darker red for accents */
  --primary-yellow: #ffc72c; /* Bright fast-food yellow */
  --accent-yellow: #ffaa00; /* Darker yellow for accents */
  --text-dark: #2b2d42; /* Dark text for contrast */
  --text-light: #ffffff; /* White text for readability */
  --light-bg: #fff8f0; /* Warm off-white background */
}

.home-view {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--light-bg);
  font-family: "Poppins", sans-serif; /* Pastikan font ini diimpor di file CSS global atau index.html */
}

/* Hero Section - Burger Promo */
.hero-section {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background: var(--primary-red); /* Menggunakan warna merah */
  padding: 80px 5%;
  color: var(--text-light);
  min-height: 600px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.hero-content {
  flex: 1;
  max-width: 500px;
  text-align: left;
  z-index: 2;
  padding-right: 30px;
}

.hero-title {
  font-size: 3.5em;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 20px;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  color: var(--primary-yellow); /* Warna kuning untuk judul */
}

.hero-description {
  font-size: 1.2em;
  line-height: 1.6;
  margin-bottom: 40px;
  color: var(--text-light);
}

.hero-button {
  display: inline-block;
  text-decoration: none;
  font-size: 1.1em;
  padding: 15px 30px;
  background-color: var(--primary-yellow);
  color: var(--text-dark);
  font-weight: 700;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
}

.hero-button:hover {
  background-color: var(--accent-yellow);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* New Wrapper for Image and Splash Details */
.hero-image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative; /* Penting: agar splash-detail bisa absolute di dalamnya */
  z-index: 1;
  min-width: 300px; /* Batasan lebar minimum agar gambar tidak terlalu kecil */
  max-width: 600px; /* Batasan lebar maksimum untuk gambar */
  width: 100%; /* Agar responsif */
  padding: 20px; /* Padding untuk memberi ruang pada splash details */
}

.main-product-img {
  width: 100%; /* Mengisi lebar wrapper */
  height: auto;
  object-fit: contain; /* Menggunakan 'contain' agar gambar tidak terpotong */
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transform: rotate(-5deg);
  transition: transform 0.5s ease;
}

.main-product-img:hover {
  transform: rotate(0deg) scale(1.02);
}

.splash-detail {
  position: absolute;
  border-radius: 50%;
  padding: 15px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 3; /* Pastikan di atas gambar */
}

.splash-detail.top-right {
  top: 5%;
  right: 5%;
  width: 120px;
  height: 120px;
  font-size: 0.9em;
  background-color: var(--primary-yellow);
  color: var(--primary-red);
}
.splash-detail.top-right .price-label {
  font-size: 0.8em;
  opacity: 0.9;
  font-weight: 600;
}
.splash-detail.top-right .price {
  font-size: 1.8em;
  font-weight: 900;
  margin-top: 5px;
}
.price,
.price-label {
  color: var(
    --text-dark
  ); /* Menggunakan warna gelap agar kontras dengan kuning */
}

.splash-detail.bottom-left {
  bottom: 5%;
  left: 5%;
  width: 100px;
  height: 100px;
  background-color: var(--text-light);
  border: 3px solid var(--primary-yellow);
  color: var(--primary-red);
}
.splash-detail.bottom-left .mini-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
}
.splash-detail.bottom-left p {
  margin: 0;
  font-size: 0.75em;
  font-weight: 700;
}

/* Menu Categories Section */
.menu-categories-section {
  padding: 60px 5%;
  background: linear-gradient(
    to right,
    var(--primary-yellow) 0%,
    var(--accent-yellow) 100%
  ); /* Latar belakang gradien kuning */
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.menu-categories-section h2 {
  font-size: 2.5em;
  color: var(--text-dark);
  margin-bottom: 40px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.carousel {
  margin: 0 auto;
  max-width: 1200px;
}

.carousel__slide {
  padding: 10px; /* Padding di sekitar item slide */
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-item {
  flex-shrink: 0;
  text-align: center;
  text-decoration: none;
  color: var(--text-dark);
  transition: all 0.3s ease;
  padding: 15px;
  width: 100%;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.category-item:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.category-item img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-red); /* Border merah untuk gambar kategori */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  background-color: white; /* Untuk jaga-jaga kalau gambar transparan */
}

.category-item span {
  display: block;
  font-weight: 700;
  font-size: 1.1em;
  white-space: nowrap; /* Mencegah teks kategori wrap */
  overflow: hidden;
  text-overflow: ellipsis; /* Menambahkan elipsis jika teks terlalu panjang */
}

.carousel__prev,
.carousel__next {
  box-sizing: content-box;
  background-color: var(--primary-red); /* Tombol navigasi carousel merah */
  color: var(--text-light);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
.carousel__prev:hover,
.carousel__next:hover {
  background-color: var(--dark-red);
  transform: scale(1.1);
}
.carousel__icon {
  fill: currentColor;
}

.carousel__pagination-button::after {
  background-color: rgba(43, 45, 66, 0.3); /* Dot pagination tidak aktif */
  border-radius: 50%;
}
.carousel__pagination-button--active::after {
  background-color: var(--text-dark); /* Dot pagination aktif */
}

/* App Promo Section */
.app-promo-section {
  background: linear-gradient(
    45deg,
    var(--primary-red) 0%,
    var(--dark-red) 100%
  ); /* Latar belakang gradien merah */
  color: var(--text-light);
  padding: 80px 5%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.app-promo-content {
  flex: 1;
  max-width: 600px;
  text-align: left;
}

.app-promo-title {
  font-size: 2.8em;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
  color: var(--primary-yellow); /* Judul kuning */
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.app-promo-description {
  font-size: 1.1em;
  line-height: 1.6;
  margin-bottom: 30px;
}

.app-stores {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.app-store-button img {
  height: 50px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.app-store-button:hover img {
  transform: scale(1.05);
}

.app-promo-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-promo-image img {
  max-width: 80%;
  height: auto;
  filter: drop-shadow(
    0 15px 25px rgba(0, 0, 0, 0.3)
  ); /* Efek shadow untuk mockup */
}

/* Promo Grid Section */
.promo-grid-section {
  padding: 80px 5%;
  background-color: var(--light-bg); /* Latar belakang off-white */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  justify-content: center;
}

.promo-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 2px solid var(--primary-yellow); /* Border kuning untuk kartu promo */
}

.promo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.promo-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.promo-content {
  padding: 25px;
  text-align: left;
}

.promo-content h3 {
  font-size: 1.8em;
  color: var(--primary-red); /* Judul promo merah */
  margin-bottom: 10px;
}

.promo-content p {
  font-size: 1.05em;
  color: var(--text-dark);
  margin-bottom: 20px;
  line-height: 1.5;
}

.promo-button {
  display: inline-block;
  background-color: var(--primary-yellow); /* Tombol promo kuning */
  color: var(--text-dark);
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.promo-button:hover {
  background-color: var(--accent-yellow);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 992px) {
  .hero-section {
    padding: 60px 5% 40px; /* Adjust padding */
  }
  .hero-content {
    padding-right: 20px; /* Reduce padding for smaller desktop screens */
  }
  .hero-title {
    font-size: 3em;
  }
  .hero-description {
    font-size: 1.1em;
  }
  .hero-image-wrapper {
    max-width: 500px; /* Control max-width for image wrapper */
  }
  .app-promo-title {
    font-size: 2.5em;
  }
  .promo-grid-section {
    gap: 30px; /* Reduce gap */
  }
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    padding: 60px 5% 40px;
    min-height: auto;
    text-align: center;
  }

  .hero-content {
    order: 2; /* Content after image on mobile */
    padding-right: 0;
    text-align: center;
    max-width: 100%;
    margin-bottom: 30px; /* Add space below content */
  }

  .hero-image-wrapper {
    order: 1; /* Image first on mobile */
    width: 100%; /* Take full width of parent (padding applied to parent) */
    max-width: 400px; /* Limit image wrapper size on mobile */
    min-width: unset; /* Remove minimum width */
    margin-bottom: 40px; /* Space below image before content */
    padding: 0; /* Remove padding from wrapper itself */
  }

  .main-product-img {
    width: 90%; /* Adjust image width to fit better inside the wrapper */
    transform: rotate(0deg); /* Hilangkan rotasi di mobile */
  }

  .splash-detail.top-right,
  .splash-detail.bottom-left {
    position: absolute; /* Tetap absolute relatif terhadap .hero-image-wrapper */
    /* Sesuaikan posisi untuk mobile agar tidak bertabrakan dengan gambar */
    /* Atau, bisa diubah menjadi static dan ditata ulang secara terpisah di mobile */
    width: 90px;
    height: 90px;
    font-size: 0.8em;
  }

  .splash-detail.top-right {
    top: 5px; /* Sesuaikan posisi agar tidak terlalu jauh */
    right: 5px;
  }

  .splash-detail.bottom-left {
    bottom: 5px; /* Sesuaikan posisi agar tidak terlalu jauh */
    left: 5px;
  }
  .splash-detail.bottom-left .mini-logo {
    width: 30px;
    height: 30px;
  }

  .carousel__prev,
  .carousel__next {
    display: none; /* Sembunyikan tombol navigasi carousel di mobile */
  }

  .carousel__pagination {
    margin-top: 20px;
  }

  .category-item img {
    width: 80px;
    height: 80px;
  }
  .category-item span {
    font-size: 0.9em;
  }

  .app-promo-section {
    flex-direction: column-reverse; /* Balik urutan konten & gambar di mobile */
    text-align: center;
    gap: 30px;
    padding: 60px 5%;
  }
  .app-promo-content {
    padding-right: 0;
    text-align: center;
  }
  .app-stores {
    justify-content: center;
  }
  .app-promo-title {
    font-size: 2em;
  }
  .app-promo-description {
    font-size: 0.9em;
  }
  .app-promo-image img {
    max-width: 60%;
  }

  .promo-grid-section {
    grid-template-columns: 1fr;
    padding: 60px 5%;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2em;
  }

  .hero-button {
    padding: 12px 20px;
    font-size: 1em;
  }

  .menu-categories-section h2,
  .app-promo-title {
    font-size: 1.8em;
  }

  .promo-content h3 {
    font-size: 1.5em;
  }

  .app-stores {
    flex-direction: column;
    align-items: center;
  }
  .splash-detail.top-right,
  .splash-detail.bottom-left {
    width: 70px; /* Lebih kecil lagi untuk ponsel sangat kecil */
    height: 70px;
    font-size: 0.7em;
  }
  .splash-detail.top-right .price {
    font-size: 1.5em;
  }
  .splash-detail.bottom-left .mini-logo {
    width: 25px;
    height: 25px;
  }
}
</style>
