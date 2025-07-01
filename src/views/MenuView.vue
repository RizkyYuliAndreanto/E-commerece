<template>
  <div class="menu-view">
    <section class="carousel-section">
      <div class="carousel-container">
        <Carousel :items-to-show="1" :wrap-around="true" :autoplay="3000">
          <Slide v-for="(slide, index) in carouselItems" :key="index">
            <div
              class="carousel-item"
              :style="{ backgroundImage: 'url(' + slide.image + ')' }"
            >
              <div class="carousel-content">
                <h2 class="carousel-title">{{ slide.title }}</h2>
                <p class="carousel-description">{{ slide.description }}</p>
                <button
                  class="carousel-button"
                  @click="handleCarouselButtonClick(slide.category)"
                >
                  Lihat Menu {{ slide.category }}
                </button>
              </div>
            </div>
          </Slide>
          <template #addons>
            <Navigation />
            <Pagination />
          </template>
        </Carousel>
      </div>
    </section>

    <section class="category-nav-section">
      <div class="category-nav-container">
        <ul class="category-list">
          <li
            :class="{ active: selectedCategory === '' }"
            @click="setSelectedCategory('')"
          >
            Semua
          </li>
          <li
            v-for="cat in uniqueCategories"
            :key="cat"
            :class="{ active: selectedCategory === cat }"
            @click="setSelectedCategory(cat)"
          >
            {{ cat }}
          </li>
        </ul>
      </div>
    </section>

    <section class="search-filter-section">
      <div class="search-filter-controls">
        <input
          type="text"
          id="search-input"
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          placeholder="Cari menu berdasarkan nama..."
          aria-label="Cari produk berdasarkan nama"
        />
        <button @click="handleSearch" class="search-button">Cari</button>
      </div>
    </section>

    <section class="product-list-section">
      <h2 class="section-title">Daftar Menu</h2>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-message">Memuat menu...</p>
      </div>
      <p v-else-if="error" class="error-message">{{ error }}</p>
      <p v-else-if="!filteredProducts.length" class="no-products">
        Belum ada produk yang ditemukan dalam kategori ini.
      </p>

      <div class="product-grid" v-else>
        <div
          class="product-card"
          v-for="product in filteredProducts"
          :key="product.id"
        >
          <div class="product-image-wrapper">
            <img
              :src="getImageUrl(product.image_url)"
              :alt="product.name"
              class="product-image"
              loading="lazy"
            />
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-meta">
              <span class="product-price"
                >Rp {{ formatPrice(product.price) }}</span
              >
              <span
                class="product-stock"
                :class="{
                  'low-stock': product.stock < 5 && product.stock > 0,
                  'out-of-stock': product.stock === 0,
                }"
              >
                Stok: {{ product.stock }}
              </span>
            </div>
            <button
              class="add-to-cart-button primary-button"
              @click="addToCart(product)"
              :disabled="product.stock === 0 || addingToCart === product.id"
            >
              {{
                product.stock === 0
                  ? "Stok Habis"
                  : addingToCart === product.id
                  ? "Menambahkan..."
                  : "Tambah ke Keranjang"
              }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import api from "../api/axios";
import { gsap } from "gsap";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

// Import Vue Carousel components
import { Carousel, Slide, Pagination, Navigation } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";

const router = useRouter();
const toast = useToast();

const products = ref([]); // All products fetched from API
const filteredProducts = ref([]); // Products shown after category/search filter
const loading = ref(false);
const error = ref(null);
const selectedCategory = ref("");
const searchQuery = ref("");
const allCategories = ref([]); // All unique categories from fetched products
const addingToCart = ref(null);

// Carousel data (dummy data, replace with real data if available from API)
const carouselItems = ref([
  {
    title: "Burger Klasik Lezat!",
    description: "Nikmati kelezatan burger klasik kami yang tak tertandingi.",
    image:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhhbWJ1cmdlcnxlbnwwfHwwfHx8MA%3D%3D",
    category: "Burger",
  },
  {
    title: "Side Dish Favoritmu!",
    description: "Tambahkan kentang goreng renyah atau onion ring gurih.",
    image:
      "https://images.unsplash.com/photo-1703080173985-936514c7c8bd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fFNpZGUlMjBEaXNoJTIwRmF2b3JpdG11IXxlbnwwfHwwfHx8MA%3D%3D",
    category: "Side Dishes",
  },
  {
    title: "Minuman Segar Dingin!",
    description: "Pilih dari berbagai minuman dingin untuk menyegarkan harimu.",
    image: "https://source.unsplash.com/random/1200x500?drinks,soda",
    category: "Minuman",
  },
]);

// Function to fetch products from backend
const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get("/products");
    products.value = response.data; // Store all products
    updateCategories(response.data); // Update categories based on all products
    filterAndAnimateProducts(); // Apply initial filter and animation
  } catch (err) {
    console.error("Gagal mengambil produk:", err);
    error.value =
      err.response?.data?.error || "Gagal memuat produk. Coba lagi nanti.";
    toast.error("Gagal memuat daftar menu.");
  } finally {
    loading.value = false;
  }
};

// Update allCategories based on fetched products
const updateCategories = (data) => {
  if (data && data.length > 0) {
    const categories = new Set();
    data.forEach((product) => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    allCategories.value = Array.from(categories);
  } else {
    allCategories.value = [];
  }
};

// Filter products based on selectedCategory and searchQuery and apply GSAP animation
const filterAndAnimateProducts = () => {
  const currentProducts = products.value;

  const newFilteredProducts = currentProducts.filter((product) => {
    const matchesCategory = selectedCategory.value
      ? product.category === selectedCategory.value
      : true;
    const matchesSearch = searchQuery.value
      ? product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Animate out current products before updating to new filtered products
  gsap.to(".product-card", {
    opacity: 0,
    y: 50,
    scale: 0.95,
    stagger: 0.05,
    duration: 0.5,
    ease: "power2.in",
    onComplete: () => {
      filteredProducts.value = newFilteredProducts;
      // Animate in new products
      gsap.fromTo(
        ".product-card",
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: "power3.out",
          overwrite: true,
        }
      );
    },
  });

  // If there are no products, update immediately
  if (newFilteredProducts.length === 0) {
    filteredProducts.value = newFilteredProducts;
  }
};

// Watchers for category and search changes
watch([selectedCategory, searchQuery], () => {
  filterAndAnimateProducts();
});

const setSelectedCategory = (category) => {
  selectedCategory.value = category;
  // No need to call fetchProducts here, as the watcher will handle filtering and animation.
};

const handleSearch = () => {
  // No need to call fetchProducts here, as the watcher will handle filtering and animation.
};

const handleCarouselButtonClick = (category) => {
  selectedCategory.value = category;
  // Scroll to product list section after category selection from carousel
  setTimeout(() => {
    const productListSection = document.querySelector(".product-list-section");
    if (productListSection) {
      productListSection.scrollIntoView({ behavior: "smooth" });
    }
  }, 100); // Small delay to allow category change to register
};

// --- START OF MODIFIED getImageUrl FUNCTION ---
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/400x300?text=No+Image"; // Placeholder jika tidak ada gambar
  }
  // Cek apakah imagePath sudah merupakan URL lengkap
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath; // Jika sudah lengkap, langsung gunakan
  }
  // Jika path relatif, tambahkan base URL backend
  // Sesuaikan port 5000 jika backend Anda berjalan di port lain
  return `http://localhost:5000${imagePath}`;
};
// --- END OF MODIFIED getImageUrl FUNCTION ---

const formatPrice = (price) => {
  if (price === null || typeof price === "undefined") {
    return "0";
  }
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return "0";
  }
  return numericPrice.toLocaleString("id-ID");
};

const addToCart = async (product) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.info("Anda harus login untuk menambahkan item ke keranjang.");
    router.push("/login");
    return;
  }

  addingToCart.value = product.id;

  try {
    const response = await api.post(
      "/cart/add",
      {
        productId: product.id,
        quantity: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Tambahkan token ke header
        },
      }
    );

    console.log("Produk berhasil ditambahkan ke keranjang:", response.data);
    toast.success(`${product.name} berhasil ditambahkan ke keranjang!`);

    window.dispatchEvent(new CustomEvent("cart-updated"));
  } catch (err) {
    console.error("Gagal menambahkan item ke keranjang:", err);

    let errorMessage = "Gagal menambahkan item ke keranjang. Coba lagi.";
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = "Sesi Anda habis. Silakan login kembali.";
        router.push("/login");
      } else if (err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
    }
    toast.error(errorMessage);
  } finally {
    addingToCart.value = null;
  }
};

const uniqueCategories = computed(() => {
  return [...new Set(allCategories.value)].sort();
});

onMounted(() => {
  fetchProducts();

  // GSAP animation for initial load of sections
  gsap.from(".carousel-section", {
    opacity: 0,
    y: -50,
    duration: 1,
    ease: "power3.out",
    delay: 0.2,
  });

  gsap.from(".category-nav-section", {
    opacity: 0,
    y: -30,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.5,
  });

  gsap.from(".search-filter-section", {
    opacity: 0,
    y: -20,
    duration: 0.7,
    ease: "power2.out",
    delay: 0.7,
  });

  gsap.from(".section-title", {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: "power2.out",
    delay: 0.9,
  });

  // Initial animation for product cards is handled within filterAndAnimateProducts
});
</script>

<style scoped>
/* CSS Variables */
:root {
  --primary-red: #e31937; /* Vibrant fast-food red */
  --dark-red: #c1121f; /* Darker red for accents */
  --primary-yellow: #ffc72c; /* Bright fast-food yellow */
  --accent-yellow: #ffaa00; /* Darker yellow for accents */
  --text-dark: #2b2d42; /* Dark text for contrast */
  --text-light: #ffffff; /* White text for readability */
  --light-bg: #fff8f0; /* Warm off-white background */
  --card-bg: #ffffff;
  --border-radius-large: 15px;
  --box-shadow-light: 0 4px 15px rgba(0, 0, 0, 0.08);
  --box-shadow-hover: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.menu-view {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--light-bg);
  font-family: "Poppins", sans-serif; /* Example: Use Poppins font */
}

/* --- Carousel Section --- */
.carousel-section {
  width: 100%;
  padding: 0;
  background-color: var(--dark-red);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.carousel-container {
  max-width: 1400px;
  margin: 0 auto;
}

.carousel-item {
  position: relative;
  width: 100%;
  height: 450px; /* Adjust height as needed */
  background-size: cover; /* Kembali ke cover */
  background-position: center; /* Kembali ke center */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-light);
  overflow: hidden;
  border-radius: var(--border-radius-large);
}

/* Hapus .carousel-image karena kita kembali menggunakan background-image */
/* .carousel-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: black;
} */

.carousel-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.6),
    rgba(0, 0, 0, 0.3)
  ); /* Overlay for readability */
  z-index: 1; /* Pastikan overlay di atas gambar tapi di bawah konten */
}

.carousel-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  max-width: 800px;
}

.carousel-title {
  font-size: 3.5em;
  font-weight: 900;
  margin-bottom: 15px;
  color: var(--primary-yellow);
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.5);
  /* animation: slideInLeft 1s ease-out; -> Dihapus karena akan ditangani GSAP global */
}

.carousel-description {
  font-size: 1.4em;
  margin-bottom: 30px;
  line-height: 1.6;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  /* animation: fadeIn 1.2s ease-out; -> Dihapus karena akan ditangani GSAP global */
}

.carousel-button {
  background-color: var(--primary-red);
  color: var(--text-light);
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  /* animation: zoomIn 1.5s ease-out; -> Dihapus karena akan ditangani GSAP global */
}

.carousel-button:hover {
  background-color: var(--dark-red);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

/* Vue Carousel custom styling */
.carousel__prev,
.carousel__next {
  background-color: rgba(255, 255, 255, 0.3) !important;
  color: var(--text-dark) !important;
  border-radius: 50% !important;
  width: 45px !important;
  height: 45px !important;
  margin: 0 10px !important;
  transition: all 0.3s ease;
}

.carousel__prev:hover,
.carousel__next:hover {
  background-color: rgba(255, 255, 255, 0.6) !important;
  transform: scale(1.1);
}

.carousel__pagination-button::after {
  background-color: rgba(255, 255, 255, 0.5) !important;
  transition: background-color 0.3s ease;
}

.carousel__pagination-button--active::after {
  background-color: var(--primary-yellow) !important;
}

/* --- Category Navigation Section --- */
.category-nav-section {
  background-color: var(--primary-yellow);
  padding: 20px 5%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.category-nav-container {
  max-width: 1200px;
  margin: 0 auto;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 15px;
}

.category-list li {
  padding: 12px 25px;
  border-radius: 50px;
  background-color: var(--card-bg);
  color: var(--text-dark);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.category-list li:hover {
  background-color: var(--primary-red);
  color: var(--text-light);
  transform: translateY(-3px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
}

.category-list li.active {
  background-color: var(--primary-red);
  color: var(--text-light);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transform: scale(1.03);
}

/* --- Search Filter Section --- */
.search-filter-section {
  padding: 30px 5%;
  background-color: var(--light-bg);
  text-align: center;
}

.search-filter-controls {
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
  gap: 15px;
}

.search-filter-controls input {
  flex-grow: 1;
  padding: 12px 20px;
  border-radius: 50px;
  border: 2px solid var(--primary-red);
  font-size: 1.1em;
  background-color: var(--card-bg);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.search-filter-controls input:focus {
  outline: none;
  border-color: var(--primary-yellow);
  box-shadow: 0 0 0 3px rgba(255, 199, 44, 0.5);
}

.search-filter-controls .search-button {
  background-color: var(--primary-red);
  color: var(--text-light);
  padding: 12px 25px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.search-filter-controls .search-button:hover {
  background-color: var(--dark-red);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

/* --- Product List Section --- */
.product-list-section {
  padding: 60px 5%;
  background-color: var(--light-bg);
  text-align: center;
  min-height: 400px;
}

.section-title {
  font-size: 3em;
  color: var(--text-dark);
  margin-bottom: 50px;
  font-weight: 800;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
}

/* Loading, Error, No Products States */
.loading-state,
.error-message,
.no-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  color: var(--text-dark);
  margin-top: 50px;
  padding: 20px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-light);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.error-message {
  color: var(--primary-red);
  font-weight: 700;
}

.no-products {
  color: var(--text-dark);
  font-style: italic;
}

/* Spinner */
.spinner {
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-red);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.product-grid {
  display: grid;
  /* Properti dari .discount-grid */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  justify-content: center;
  gap: 30px; /* Sama dengan discount-grid */
  max-width: 1200px; /* Batasan maksimum */
  margin: 0 auto;
}

.product-card {
  background-color: var(--card-bg); /* Menggunakan warna putih dari promo card */
  border-radius: 15px; /* Sama dengan promo card */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); /* Sama dengan promo card */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* Sama dengan promo card */
  border: 1px solid #eee; /* Sama dengan promo card */
  position: relative;
  /* Hapus height tetap untuk membuat card menyesuaikan kontennya */
  /* height: 400px; */
}

.product-card:hover {
  transform: translateY(-8px); /* Sama dengan promo card */
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15); /* Sama dengan promo card */
  border-color: #ddd; /* Warna border hover mirip promo card */
}

.product-image-wrapper {
  width: 100%;
  height: 180px; /* Tinggi gambar sama dengan promo card */
  background-color: #f0f0f0; /* Sama dengan promo card */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid #eee; /* Sama dengan promo card */
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Gunakan cover agar gambar mengisi area, memotong jika perlu */
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05); /* Sedikit zoom saat hover */
}

.product-info {
  padding: 20px; /* Padding sama dengan promo card */
  text-align: left;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Penting agar tombol "Add to Cart" selalu di bawah */
}

.product-name {
  font-size: 1.8em; /* Ukuran font lebih besar, sama dengan discount-code */
  font-weight: 700; /* Font weight sama dengan promo card */
  color: var(--text-dark); /* Menggunakan warna teks umum */
  margin-bottom: 10px; /* Sama dengan promo card */
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.product-description {
  font-size: 0.9em;
  color: #666; /* Sama dengan discount-dates */
  line-height: 1.5;
  margin-bottom: 15px; /* Sama dengan promo card */
  flex-grow: 1; /* Biarkan deskripsi tumbuh */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 15px;
  padding-top: 10px; /* Sama dengan promo card */
  border-top: 1px dashed #eee; /* Sama dengan promo card */
}

.product-price {
  font-size: 1.5em; /* Ukuran font harga sama dengan discount-value */
  font-weight: 800; /* Sama dengan promo card */
  color: var(--primary-red); /* Menggunakan merah yang menonjol untuk harga */
}

.product-stock {
  font-size: 0.9em;
  color: #888; /* Sama dengan usage-limit */
  opacity: 1;
  font-weight: 600;
}
.product-stock.low-stock {
  color: orange;
  font-weight: bold;
}
.product-stock.out-of-stock {
  color: var(--primary-red);
  font-weight: bold;
  text-transform: uppercase;
}

.add-to-cart-button {
  display: block;
  width: 100%;
  padding: 12px 20px; /* Padding tombol sama dengan claim-button */
  background-color: var(--primary-red);
  color: var(--text-light);
  font-weight: 600; /* Sama dengan claim-button */
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-size: 1.1em; /* Ukuran font tombol sama dengan claim-button */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: auto; /* Memastikan tombol selalu di bawah */
}

.add-to-cart-button:hover:not(:disabled) {
  background-color: var(--dark-red);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.add-to-cart-button:disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  opacity: 0.8;
}

/* Animations for GSAP (tetap sama) */
/* ... */

/* Responsive - Sesuaikan nilai-nilai ini agar konsisten dengan perubahan di atas */
@media (max-width: 1024px) {
  .carousel-item {
    height: 380px;
  }
  .carousel-title {
    font-size: 2.8em;
  }
  .carousel-description {
    font-size: 1.2em;
  }
  .carousel-button {
    padding: 12px 25px;
    font-size: 1.1em;
  }

  .section-title {
    font-size: 2.5em;
  }
  .product-grid {
    grid-template-columns: repeat(
      auto-fit,
      minmax(280px, 1fr)
    ); /* Ukuran card sama dengan promo card untuk tablet besar */
    gap: 25px;
  }
  .product-card {
    /* height: auto; */
  }
  .product-image-wrapper {
    height: 180px;
  }
  .product-name {
    font-size: 1.8em;
  }
  .product-price {
    font-size: 1.5em;
  }
  .add-to-cart-button {
    font-size: 1.1em;
    padding: 12px 20px;
  }
}

@media (max-width: 768px) {
  .carousel-item {
    height: 300px;
  }
  .carousel-title {
    font-size: 2.2em;
  }
  .carousel-description {
    font-size: 1em;
  }
  .carousel-button {
    padding: 10px 20px;
    font-size: 1em;
  }

  .category-list {
    gap: 10px;
  }
  .category-list li {
    padding: 10px 20px;
    font-size: 0.9em;
  }

  .search-filter-controls {
    flex-direction: column;
    align-items: center;
  }
  .search-filter-controls input,
  .search-filter-controls .search-button {
    width: 100%;
    max-width: 400px;
  }

  .product-grid {
    grid-template-columns: repeat(
      auto-fill,
      minmax(280px, 1fr)
    ); /* Pertahankan ukuran untuk tablet */
    gap: 20px;
  }
  .product-card {
    /* height: auto; */
  }
  .product-image-wrapper {
    height: 180px;
  }
  .product-name {
    font-size: 1.8em;
  }
  .product-description {
    font-size: 0.9em;
  }
  .product-price {
    font-size: 1.5em;
  }
  .add-to-cart-button {
    font-size: 1.1em;
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .carousel-item {
    height: 250px;
  }
  .carousel-title {
    font-size: 1.8em;
  }
  .carousel-description {
    font-size: 0.9em;
  }
  .carousel-button {
    font-size: 0.9em;
  }

  .category-nav-section {
    padding: 15px 3%;
  }
  .category-list {
    gap: 8px;
  }
  .category-list li {
    padding: 8px 15px;
    font-size: 0.85em;
  }

  .search-filter-section {
    padding: 20px 3%;
  }

  .product-list-section {
    padding: 40px 3%;
  }
  .section-title {
    font-size: 1.8em;
  }
  .product-grid {
    grid-template-columns: 1fr; /* Satu kolom untuk mobile */
    gap: 15px;
  }
  .product-card {
    margin: 0 10px; /* Margin samping untuk ponsel */
    /* height: auto; */ /* Hapus fixed height */
  }
  .product-image-wrapper {
    height: 180px;
  } /* Biarkan lebih besar di mobile */
  .product-name {
    font-size: 1.6em;
  }
  .product-description {
    font-size: 0.9em;
  }
  .product-price {
    font-size: 1.4em;
  }
  .product-stock {
    font-size: 0.85em;
  }
  .add-to-cart-button {
    font-size: 1em;
    padding: 10px 15px;
  }
}
</style>