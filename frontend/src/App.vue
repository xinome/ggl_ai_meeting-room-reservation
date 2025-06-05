<template>
  <div id="app-layout">
    <header>
      <nav>
        <router-link to="/">Home</router-link> |
        <template v-if="authStore.isAuthenticated">
          <router-link to="/dashboard">Dashboard</router-link> |
          <span>User: {{ authStore.userName }} ({{ authStore.userRole }}) </span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login">Login</router-link>
        </template>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
header {
  background-color: #f8f9fa;
  padding: 10px 20px;
  border-bottom: 1px solid #dee2e6;
}
nav {
  display: flex;
  align-items: center;
  gap: 15px;
}
nav a {
  text-decoration: none;
  color: #007bff;
}
nav a.router-link-exact-active {
  font-weight: bold;
  color: #0056b3;
}
.logout-button {
  margin-left: auto; /* 右寄せにする場合 */
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
main {
  padding: 20px;
}
</style>
