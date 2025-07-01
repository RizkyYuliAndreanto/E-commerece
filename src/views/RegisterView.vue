<template>
    <div class="register-view">
      <div class="register-container">
        <div class="register-header">
          <img :src="Logo" alt="Foodiez Logo" class="register-logo" />
          <h2 class="register-title">Daftar Akun Baru</h2>
          <p class="register-subtitle">
            Gabung Foodiez sekarang dan dapatkan promo eksklusif!
          </p>
        </div>
  
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="name">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              v-model="name"
              placeholder="Masukkan nama lengkap Anda"
              required
              class="form-input"
            />
          </div>
  
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="Masukkan email Anda"
              required
              class="form-input"
            />
          </div>
  
          <div class="form-group">
            <label for="password">Kata Sandi</label>
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Buat kata sandi baru"
              required
              class="form-input"
            />
          </div>
  
          <div class="form-group">
            <label for="confirm-password">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              id="confirm-password"
              v-model="confirmPassword"
              placeholder="Ulangi kata sandi Anda"
              required
              class="form-input"
            />
          </div>
  
          <button type="submit" class="register-button primary-button" :disabled="loading">
            {{ loading ? 'Memuat...' : 'Daftar Sekarang' }}
          </button>
          <p v-if="error" class="error-message">{{ error }}</p>
        </form>
  
        <div class="register-footer">
          <p>
            Sudah punya akun?
            <router-link to="/login" class="login-link">Masuk di sini</router-link>
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import Logo from "../assets/Logo.jpeg";
  import { useRouter } from "vue-router";
  import api from "../api/axios"; // Sesuaikan path jika kamu tidak pakai instance axios.js
  
  const router = useRouter();
  const name = ref("");
  const email = ref("");
  const password = ref("");
  const confirmPassword = ref("");
  const loading = ref(false);
  const error = ref(null);
  
  const handleRegister = async () => {
    loading.value = true;
    error.value = null; // Reset error
  
    if (password.value !== confirmPassword.value) {
      error.value = "Kata sandi tidak cocok!";
      loading.value = false;
      return;
    }
  
    try {
      const response = await api.post("/auth/register", {
        name: name.value,
        email: email.value,
        password: password.value,
      });
  
      const { token, data: user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
  
      console.log("Pendaftaran berhasil:", user);
      router.push("/"); // Redirect ke halaman beranda setelah register
  
    } catch (err) {
      console.error("Pendaftaran gagal:", err);
      error.value = err.response?.data?.message || "Pendaftaran gagal. Coba lagi.";
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  /* Variabel CSS dan gaya lainnya sama seperti sebelumnya */
  :root {
    --primary-red: #e31937; /* Vibrant fast-food red */
    --dark-red: #c1121f; /* Darker red for accents */
    --primary-yellow: #ffc72c; /* Bright fast-food yellow */
    --accent-yellow: #ffaa00; /* Darker yellow for accents */
    --text-dark: #2b2d42; /* Dark text for contrast */
    --text-light: #ffffff; /* White text for readability */
    --light-bg: #fff8f0; /* Warm off-white background */
  }
  
  .register-view {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(
      45deg,
      var(--primary-red) 0%,
      var(--dark-red) 100%
    );
    padding: 20px;
    box-sizing: border-box;
  }
  
  .register-container {
    background-color: var(--light-bg);
    padding: 40px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 450px;
    text-align: center;
    border: 3px solid var(--primary-yellow);
  }
  
  .register-header {
    margin-bottom: 30px;
  }
  
  .register-logo {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid var(--primary-red);
    margin-bottom: 15px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .register-title {
    font-size: 2.2em;
    font-weight: 800;
    color: var(--text-dark);
    margin-bottom: 10px;
  }
  
  .register-subtitle {
    font-size: 1.05em;
    color: var(--text-dark);
    opacity: 0.8;
    line-height: 1.5;
  }
  
  .register-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .form-group {
    text-align: left;
  }
  
  .form-group label {
    display: block;
    font-size: 1em;
    color: var(--text-dark);
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid var(--primary-yellow);
    border-radius: 8px;
    font-size: 1em;
    color: var(--text-dark);
    background-color: white;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }
  
  .form-input::placeholder {
    color: #a0a0a0;
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--primary-red);
    box-shadow: 0 0 0 3px rgba(227, 25, 55, 0.2);
  }
  
  .register-button {
    display: block;
    width: 100%;
    padding: 15px;
    background-color: var(--primary-red);
    color: var(--text-light);
    font-size: 1.1em;
    font-weight: 700;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .register-button:hover:not(:disabled) {
    background-color: var(--dark-red);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
  
  .register-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  
  .error-message {
    color: var(--primary-red);
    font-size: 0.9em;
    margin-top: 10px;
  }
  
  .register-footer p {
    color: var(--text-dark);
    font-size: 0.95em;
    margin-bottom: 10px;
  }
  
  .login-link {
    color: var(--primary-red);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }
  
  .login-link:hover {
    color: var(--dark-red);
    text-decoration: underline;
  }
  
  @media (max-width: 480px) {
    .register-container {
      padding: 30px 20px;
      border-radius: 10px;
    }
  
    .register-title {
      font-size: 1.8em;
    }
  
    .register-subtitle {
      font-size: 0.9em;
    }
  
    .register-button {
      padding: 12px;
      font-size: 1em;
    }
  }
  </style>