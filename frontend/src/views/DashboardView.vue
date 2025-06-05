<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome, {{ authStore.userName }}!</p>
    <p>Your role is: {{ authStore.userRole }}</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
