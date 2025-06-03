<template>
  <div class="home-view">
    <h1>会議室予約システム</h1>

    <div class="reservations-section">
      <h2>あなたの予約 (モック)</h2>
      <div v-if="myReservationsLoading">読み込み中...</div>
      <ul v-if="!myReservationsLoading && myReservations.length > 0">
        <li v-for="res in myReservations" :key="res.id" class="my-reservation-item">
          <strong>{{ getRoomName(res.roomId) }}</strong> -
          {{ formatDate(res.startTime) }} {{ formatTime(res.startTime) }}〜{{ formatTime(res.endTime) }}
          ({{ res.purpose }})
          <button @click="cancelReservation(res.id)" class="cancel-btn">キャンセル</button>
        </li>
      </ul>
      <p v-if="!myReservationsLoading && myReservations.length === 0">予約はありません。</p>
    </div>

    <RoomList @selectRoom="openReservationModal" />

    <ReservationModal
      :show="isModalOpen"
      :room="selectedRoom"
      @close="closeReservationModal"
      @reservationCreated="handleReservationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import RoomList from '../components/RoomList.vue';
import ReservationModal from '../components/ReservationModal.vue';
import type { Room, Reservation } from '../types';
import apiService from '../services/apiService';

const selectedRoom = ref<Room | null>(null);
const isModalOpen = ref(false);
const allRooms = ref<Room[]>([]); // 部屋名参照用
const myReservations = ref<Reservation[]>([]);
const myReservationsLoading = ref(true);

// モックユーザーID。実際には認証情報から取得
const MOCK_USER_ID = "mockUser1";

const fetchAllRooms = async () => {
  allRooms.value = await apiService.getRooms();
};

const fetchMyReservations = async () => {
  myReservationsLoading.value = true;
  // バックエンドに /api/users/:userId/reservations のようなエンドポイントがあればそれを使う
  // 今回は全予約を取得してクライアント側でフィルタリング（デモ用）
  const allRes = await apiService.getReservations();
  myReservations.value = allRes.filter(r => r.userId === MOCK_USER_ID)
                              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  myReservationsLoading.value = false;
};

onMounted(async () => {
  await fetchAllRooms();
  await fetchMyReservations();
});

const openReservationModal = (room: Room) => {
  selectedRoom.value = room;
  isModalOpen.value = true;
};

const closeReservationModal = () => {
  isModalOpen.value = false;
  selectedRoom.value = null;
};

const handleReservationCreated = (newReservation: Reservation) => {
  // myReservations.value.push(newReservation);
  // myReservations.value.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  fetchMyReservations(); // リストを再取得して更新
  alert('予約が作成されました！');
};

const cancelReservation = async (reservationId: string) => {
  if (confirm('この予約をキャンセルしますか？')) {
    const success = await apiService.deleteReservation(reservationId);
    if (success) {
      myReservations.value = myReservations.value.filter(r => r.id !== reservationId);
      alert('予約をキャンセルしました。');
    } else {
      alert('予約のキャンセルに失敗しました。');
    }
  }
};

const getRoomName = (roomId: string): string => {
  const room = allRooms.value.find(r => r.id === roomId);
  return room ? room.name : '不明な会議室';
};

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('ja-JP');
};
const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

</script>

<style scoped>
.home-view {
  padding: 20px;
  font-family: sans-serif;
}
.reservations-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
}
.my-reservation-item {
  list-style: none;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.my-reservation-item:last-child {
  border-bottom: none;
}
.cancel-btn {
  margin-left: 10px;
  padding: 3px 8px;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.cancel-btn:hover {
  background-color: #ee5253;
}
</style>
