// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Impor Vue-Toastification
import Toast, { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css"; // Jangan lupa impor CSS-nya!

const app = createApp(App);

// Gunakan Vue-Toastification
app.use(Toast, {
  // Opsi konfigurasi Toastification global (opsional)
  position: POSITION.TOP_RIGHT, // Contoh: toast muncul di kanan atas
  timeout: 3000, // Toast akan hilang setelah 3 detik
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
});

app.use(router);
app.mount("#app");
