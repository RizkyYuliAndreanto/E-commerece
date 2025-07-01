<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <img :src="Logo" alt="Foodiez Logo" class="login-logo" />
        <h2 class="login-title">Masuk ke Akun Anda</h2>
        <p class="login-subtitle">
          Nikmati promo spesial dan pesan makanan favorit Anda!
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
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
            placeholder="Masukkan kata sandi Anda"
            required
            class="form-input"
          />
        </div>

        <button type="submit" class="login-button primary-button" :disabled="loading">
          {{ loading ? 'Memuat...' : 'Masuk' }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <div class="login-footer">
        <p>
          Belum punya akun?
          <router-link to="/register" class="register-link"
            >Daftar Sekarang</router-link
          >
        </p>
        <router-link to="/forgot-password" class="forgot-password-link"
          >Lupa Kata Sandi?</router-link
        >
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
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref(null);

const handleLogin = async () => {
  loading.value = true;
  error.value = null; // Reset error

  try {
    const response = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    const { token, data: user } = response.data;
    localStorage.setItem("token", token); // Simpan token
    localStorage.setItem("user", JSON.stringify(user)); // Simpan data user (opsional)

    console.log("Login berhasil:", user);
    router.push("/"); // Redirect ke halaman beranda setelah login

  } catch (err) {
    console.error("Login gagal:", err);
    error.value = err.response?.data?.message || "Login gagal. Coba lagi.";
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

.login-view {
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

.login-container {
  background-color: var(--light-bg);
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
  text-align: center;
  border: 3px solid var(--primary-yellow);
}

.login-header {
  margin-bottom: 30px;
}

.login-logo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--primary-red);
  margin-bottom: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 2.2em;
  font-weight: 800;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.login-subtitle {
  font-size: 1.05em;
  color: var(--text-dark);
  opacity: 0.8;
  line-height: 1.5;
}

.login-form {
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

.login-button {
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

.login-button:hover:not(:disabled) {
  background-color: var(--dark-red);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.login-button:disabled {
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

.login-footer p {
  color: var(--text-dark);
  font-size: 0.95em;
  margin-bottom: 10px;
}

.register-link,
.forgot-password-link {
  color: var(--primary-red);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.register-link:hover,
.forgot-password-link:hover {
  color: var(--dark-red);
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
    border-radius: 10px;
  }

  .login-title {
    font-size: 1.8em;
  }

  .login-subtitle {
    font-size: 0.9em;
  }

  .login-button {
    padding: 12px;
    font-size: 1em;
  }
}
</style>