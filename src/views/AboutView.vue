<template>
    <div class="about-container">
      <h1>Tentang Aplikasi Kami</h1>
      <p>Aplikasi sederhana ini dibuat untuk mendemonstrasikan dasar-dasar Vue Router.</p>
      <router-link to="/" class="nav-link">Kembali ke Beranda</router-link>
    </div>
  </template>
  
  <script setup>
  // Tidak ada logika khusus di sini
  </script>
  
  <style scoped>
  .about-container {
    max-width: 800px;
    margin: 50px auto;
    padding: 30px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  h1 {
    color: #333;
    margin-bottom: 20px;
  }
  
  p {
    color: #666;
    font-size: 1.1em;
    margin-bottom: 30px;
  }
  
  .nav-link {
    display: inline-block;
    background-color: #6c757d; /* Warna abu-abu */
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    text-decoration: none;
    transition: background-color 0.3s ease;
  }
  
  .nav-link:hover {
    background-color: #5a6268;
  }
  </style>