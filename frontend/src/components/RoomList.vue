<template>
  <div class="room-list">
    <h2>会議室一覧</h2>
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <ul v-if="!loading && !error && rooms.length > 0">
      <li v-for="room in rooms" :key="room.id" class="room-item">
        <h3>{{ room.name }}</h3>
        <p>定員: {{ room.capacity }}名</p>
        <p v-if="room.equipment.length > 0">備品: {{ room.equipment.join(', ') }}</p>
        <p v-else>備品: なし</p>
        <button @click="$emit('selectRoom', room)">この会議室を予約</button>
      </li>
    </ul>
    <p v-if="!loading && !error && rooms.length === 0">利用可能な会議室はありません。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Room } from '../types';
import apiService from '../services/apiService';

defineEmits(['selectRoom']);

const rooms = ref<Room[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    rooms.value = await apiService.getRooms();
  } catch (err) {
    console.error(err);
    error.value = '会議室の読み込みに失敗しました。';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.room-list {
  margin-bottom: 20px;
}
.room-item {
  border: 1px solid #ccc;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
}
.room-item h3 {
  margin-top: 0;
}
.loading, .error-message {
  padding: 10px;
  text-align: center;
}
.error-message {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
}
</style>
