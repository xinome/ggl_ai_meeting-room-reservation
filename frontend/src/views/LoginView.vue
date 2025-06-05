<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v.model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v.model="password" required />
      </div>
      <button type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
      </button>
      <p v-if="authStore.loginError" class="error-message">{{ authStore.loginError }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';

const email = ref('');
const password = ref('');

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const handleLogin = async () => {
  const success = await authStore.login({ email: email.value, password: password.value });
  if (success) {
    // ログイン成功後、リダイレクト先がクエリにあればそこへ、なければダッシュボードへ
    const redirectPath = route.query.redirect || '/dashboard';
    router.push(redirectPath);
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>
