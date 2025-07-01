<template>
  <div class="promo-view">
    <h1 class="page-title">Diskon & Promo Menarik!</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-message">Memuat promo...</p>
    </div>

    <p v-else-if="error" class="error-message">{{ error }}</p>

    <div v-else-if="discounts.length === 0" class="no-discounts">
      <p>Belum ada diskon atau promo yang tersedia saat ini.</p>
    </div>

    <div v-else class="discount-grid">
      <div
        class="discount-card"
        v-for="discount in discounts"
        :key="discount.id"
        :class="getCardColorClass(discount.id)"
      >
        <div class="discount-left">
          <div class="discount-value">
            <span v-if="discount.type === 'percentage'">{{ discount.value }}%</span>
            <span v-else-if="discount.type === 'fixed'">
              <span>Rp</span> {{ formatPrice(discount.value) }}
            </span>
          </div>
          <p class="discount-type">
            {{ discount.type === "percentage" ? "DISKON" : "POTONGAN" }}
          </p>
        </div>

        <div class="discount-middle-content">
          <img
            v-if="discount.image"
            :src="getImageUrl(discount.image)"
            :alt="discount.name || 'Promo Image'"
            class="discount-promo-image"
            loading="lazy"
          />
          <div class="coupon-details">
            <p class="store-name">FOODIEZ COFFEE</p>
            <h3 class="coupon-title">
              {{ discount.name || "VOUCHER SPESIAL" }}
            </h3>
            <p class="coupon-description">
              {{ discount.description || "Nikmati penawaran istimewa ini!" }}
            </p>
            <p class="valid-until">Berlaku hingga {{ formatDate(discount.valid_until) }}</p>
            <p class="discount-code">KODE: <strong>{{ discount.code }}</strong></p>
          </div>
        </div>

        <div class="discount-action-strip">
          <button
            class="claim-button"
            @click="claimDiscount(discount.id)"
            :disabled="!isDiscountClaimable(discount) || claiming[discount.id]"
          >
            {{
              claiming[discount.id]
                ? "Mengklaim..."
                : isDiscountClaimable(discount)
                ? "Klaim Sekarang!"
                : getClaimButtonText(discount)
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api/axios";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import moment from "moment-timezone";

const toast = useToast();
const router = useRouter();

const discounts = ref([]);
const loading = ref(false);
const error = ref(null);
const claiming = ref({});

const getCardColorClass = (id) => {
  const colors = ["red", "blue", "green", "purple", "orange"];
  return `color-${colors[id % colors.length]}`;
};

// Fungsi getImageUrl tetap sama, karena sudah konsisten
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/400x300?text=No+Image";
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `http://localhost:5000${imagePath}`;
};

// Fungsi getRightSideStyle diubah atau dihilangkan
// Sekarang hanya mengembalikan background warna default jika tidak ada gambar
const getRightSideStyle = (discount) => {
  if (!discount.image) {
    return { backgroundColor: "#f0f0f0", color: "#333" };
  }
  return {}; // Tidak perlu lagi mengatur background-image di sini
};

const fetchActiveDiscounts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get("/discounts/active");
    discounts.value = response.data.data;
  } catch (err) {
    console.error("Error fetching active discounts:", err);
    error.value = err.response?.data?.message || "Gagal memuat daftar promo.";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

const claimDiscount = async (discountId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.info("Anda harus login untuk mengklaim diskon.");
    router.push("/login");
    return;
  }

  claiming.value[discountId] = true;
  try {
    const response = await api.post("/discounts/claim", { discountId }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    toast.success(response.data.message);
    await fetchActiveDiscounts();
    window.dispatchEvent(new CustomEvent("discount-claimed"));
  } catch (err) {
    console.error("Error claiming discount:", err);
    const errorMessage = err.response?.data?.message || "Gagal mengklaim diskon.";
    toast.error(errorMessage);
    if (errorMessage.includes("Sesi Anda habis") || err.response?.status === 401) {
      router.push("/login");
    }
  } finally {
    claiming.value[discountId] = false;
  }
};

const isDiscountActive = (discount) => {
  const now = moment().utc();
  const startDate = moment.utc(discount.start_date);
  const validUntil = moment.utc(discount.valid_until);

  return (
    discount.active && now.isSameOrAfter(startDate) && now.isSameOrBefore(validUntil)
  );
};

const isDiscountClaimable = (discount) => {
  return isDiscountActive(discount);
};

const getClaimButtonText = (discount) => {
  if (!discount.active) {
    return "Tidak Aktif";
  }
  const now = moment().utc();
  const startDate = moment.utc(discount.start_date);
  const validUntil = moment.utc(discount.valid_until);

  if (now.isBefore(startDate)) {
    return "Belum Dimulai";
  }
  if (now.isAfter(validUntil)) {
    return "Kedaluwarsa";
  }
  return "Tidak Tersedia";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return moment.utc(dateString).local().format("DD MMM YYYY");
};

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

onMounted(() => {
  fetchActiveDiscounts();
});
</script>
<style scoped>
/* Variabel CSS (disarankan untuk diletakkan di file CSS global atau bagian root) */
:root {
  --primary-red: #e31937; /* Vibrant fast-food red */
  --dark-red: #c1121f; /* Darker red for accents */
  --primary-yellow: #ffc72c; /* Bright fast-food yellow */
  --accent-yellow: #ffaa00; /* Darker yellow for accents */
  --text-dark: #2b2d42; /* Dark text for contrast */
  --text-light: #ffffff; /* White text for readability */
  --light-bg: #f8f8f8; /* Warm off-white background */
  --card-bg: #ffffff;
  --border-radius-large: 15px;
  --box-shadow-light: 0 4px 15px rgba(0, 0, 0, 0.08);
  --box-shadow-hover: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.promo-view {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Poppins", sans-serif;
  background-color: var(--light-bg);
  min-height: 80vh;
}

.page-title {
  text-align: center;
  font-size: 3em;
  color: var(--text-dark);
  margin-bottom: 50px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-message,
.no-discounts {
  text-align: center;
  padding: 50px 20px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-light);
  margin-top: 50px;
}

.spinner {
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-red);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message,
.error-message,
.no-discounts p {
  font-size: 1.2em;
  color: var(--text-dark);
}

.error-message {
  color: var(--primary-red);
  font-weight: bold;
}

.discount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 30px;
  justify-content: center;
}

.discount-card {
  display: flex;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: var(--box-shadow-light);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 180px;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.1); /* Border lebih halus */
}

.discount-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--box-shadow-hover);
}

/* Warna-warna spesifik untuk kartu */
.discount-card.color-red {
  background-color: #e31937;
}
.discount-card.color-blue {
  background-color: #3f51b5;
}
.discount-card.color-green {
  background-color: #4caf50;
}
.discount-card.color-purple {
  background-color: #9c27b0;
}
.discount-card.color-orange {
  background-color: #ff9800;
}

/* Bagian Kiri: Informasi Diskon */
.discount-left {
  flex: 0 0 120px; /* Lebar tetap untuk bagian diskon */
  background-color: rgba(0, 0, 0, 0.2); /* Overlay gelap untuk kontras */
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  text-align: center;
  position: relative;
  /* Bentuk sobekan kupon */
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); /* Awal */
  margin-right: -10px; /* Overlap dengan bagian tengah */
}

.discount-left::after {
  content: "";
  position: absolute;
  right: -15px; /* Sesuaikan dengan ukuran lingkaran */
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: var(--light-bg); /* Warna background promo-view */
  border-radius: 50%;
  z-index: 1;
}

.discount-left::before {
  content: "";
  position: absolute;
  right: -10px; /* Sesuaikan dengan ukuran lingkaran */
  top: calc(50% - 30px); /* Atas lingkaran pertama */
  width: 20px;
  height: 20px;
  background-color: var(--light-bg);
  border-radius: 50%;
  z-index: 1;
}

/* Menyesuaikan posisi lingkaran bawah untuk efek "sobekan" */
.discount-left::after {
  content: "";
  position: absolute;
  right: -10px; /* Sesuaikan dengan ukuran lingkaran */
  top: calc(50% + 10px); /* Bawah lingkaran pertama */
  width: 20px;
  height: 20px;
  background-color: var(--light-bg);
  border-radius: 50%;
  z-index: 1;
}

.discount-value {
  font-size: 2.8em;
  font-weight: 900;
  line-height: 1;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.discount-value span:first-child {
  font-size: 0.6em; /* Ukuran lebih kecil untuk "Rp" */
  margin-right: 5px;
}

.discount-type {
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 5px;
  opacity: 0.8;
}

/* MODIFIKASI CSS UNTUK .discount-middle-content dan .discount-promo-image */
.discount-middle-content {
  flex-grow: 1;
  padding: 15px 20px;
  display: flex;
  flex-direction: column; /* Mengatur layout vertikal */
  justify-content: center;
  align-items: center; /* Pusatkan konten horizontal */
  position: relative; /* Penting untuk positioning gambar absolut */
  background-color: var(--card-bg); /* Warna latar belakang default jika tidak ada gambar */
  overflow: hidden; /* Pastikan gambar dan konten tidak keluar dari div */
  z-index: 0;
}

.discount-promo-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Pastikan gambar memenuhi area */
  position: absolute; /* Posisikan gambar di belakang konten lain */
  top: 0;
  left: 0;
  z-index: 1; /* Pastikan ini di bawah coupon-details */
}

.coupon-details {
  position: relative;
  z-index: 2; /* Pastikan detail kupon di atas gambar */
  text-align: center; /* Perataan teks di tengah */
  background-color: rgba(0, 0, 0, 0.5); /* Overlay gelap agar teks terbaca */
  padding: 10px 15px;
  border-radius: 8px;
  /* Warna teks diatur secara eksplisit menjadi putih di sini */
  color: white;
  margin-top: auto; /* Dorong ke bawah jika konten lain di atas */
  margin-bottom: auto; /* Pusatkan secara vertikal jika ada ruang */
}

/* Pastikan semua teks di dalam coupon-details berwarna putih dan memiliki shadow */
.coupon-details .store-name,
.coupon-details .coupon-title,
.coupon-details .coupon-description,
.coupon-details .valid-until {
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
}

.discount-code {
  background-color: rgba(0, 0, 0, 0.3); /* Background yang lebih gelap untuk kontras */
  padding: 5px 8px;
  border-radius: 5px;
  display: inline-block;
  margin-top: 5px;
  font-weight: bold;
  color: white; /* Pastikan kode itu sendiri putih */
  text-shadow: none; /* Hapus shadow pada background-code agar tidak terlalu tebal */
}

.discount-code strong {
  color: white; /* Pastikan kode di dalam strong tetap putih */
}


/* Bagian Kanan: Tombol Klaim */
.discount-action-strip {
  flex: 0 0 100px; /* Lebar tetap */
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px 5px;
  position: relative;
  /* Bentuk sobekan kupon */
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); /* Awal */
  margin-left: -10px; /* Overlap dengan bagian tengah */
}

.discount-action-strip::before {
  content: "";
  position: absolute;
  left: -15px; /* Sesuaikan dengan ukuran lingkaran */
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: var(--light-bg); /* Warna background promo-view */
  border-radius: 50%;
  z-index: 1;
}

.claim-button {
  display: block;
  width: 90%;
  padding: 12px 8px;
  background-color: var(--primary-red);
  color: var(--text-light);
  border: none;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-align: center;
  white-space: normal;
  line-height: 1.3;
}

.claim-button:hover:not(:disabled) {
  background-color: var(--dark-red);
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.claim-button:disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  opacity: 0.8;
}

/* Media Queries */
@media (max-width: 768px) {
  .page-title {
    font-size: 2.5em;
    margin-bottom: 40px;
  }
  .discount-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  .discount-card {
    height: 160px;
  }
  .discount-left {
    flex-basis: 100px;
  }
  .discount-value {
    font-size: 2.2em;
  }
  .coupon-title {
    font-size: 1.6em;
  }
  .coupon-description {
    font-size: 0.8em;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
  .valid-until,
  .discount-code,
  .store-name {
    font-size: 0.75em;
  }
  .discount-action-strip {
    flex-basis: 90px;
  }
  .claim-button {
    font-size: 0.8em;
    padding: 10px 5px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2em;
    margin-bottom: 30px;
  }
  .discount-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .discount-card {
    height: 140px;
    margin: 0 10px;
  }
  .discount-left {
    flex-basis: 90px;
  }
  .discount-value {
    font-size: 2em;
  }
  .coupon-title {
    font-size: 1.4em;
  }
  .coupon-description {
    display: none;
  } /* Sembunyikan deskripsi di mobile */
  .valid-until,
  .discount-code,
  .store-name {
    font-size: 0.7em;
  }
  .discount-action-strip {
    flex-basis: 80px;
  }
  .claim-button {
    font-size: 0.7em;
    padding: 8px 4px;
  }
}
</style>