<template>
  <div class="default-layout">
    <main class="main-content-area">
      <router-view /> </main>
    </div>
</template>

<script setup>
// Penting: JANGAN lagi mengimpor Navbar di sini karena sudah diimpor di App.vue
// import Navbar from "../components/Navbar.vue"; // <-- HAPUS BARIS INI
// import Footer from "../components/Footer.vue"; // Jika Anda memiliki komponen Footer
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--navbar-height)); /* Tinggi dihitung dari sisa layar setelah Navbar utama */
  margin-top: var(--navbar-height); /* Dorong layout ke bawah Navbar utama */
}

.main-content-area {
  flex-grow: 1; /* Konten utama akan mengambil sisa ruang */
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
  height: 100vh;  /* Padding default untuk konten halaman */
}

/*
Tambahkan media query jika DefaultLayout ini perlu perilaku berbeda di mobile.
Misalnya, jika Anda ingin margin-top menyesuaikan dengan perubahan tinggi navbar mobile.
*/
</style>