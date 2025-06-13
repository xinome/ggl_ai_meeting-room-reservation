<template>
  <div class="page-container room-detail-view">
    <header class="page-header">
      <h1 v-if="room">{{ room.name }} - 詳細</h1>
      <h1 v-else-if="!isLoading && !loadError">会議室が見つかりません</h1>
      <h1 v-else>会議室詳細</h1>
    </header>

    <div v-if="isLoading" class="loading-indicator">情報を読み込み中...</div>
    <div v-if="loadError" class="error-message">
      情報の読み込みに失敗しました: {{ loadError }}
    </div>

    <div v-if="room" class="content-section room-info">
      <h2><i class="fas fa-door-open icon"></i>会議室情報</h2>
      <p><strong>名称:</strong> {{ room.name }}</p>
      <p><strong>定員:</strong> {{ room.capacity }} 名</p>
      <p><strong>場所:</strong> {{ room.location || '未設定' }}</p>
      <p><strong>説明:</strong> {{ room.description || '特になし' }}</p>

      <h3><i class="fas fa-tools icon"></i>利用可能な備品</h3>
      <ul v-if="room.equipments && room.equipments.length > 0" class="equipment-list">
        <li v-for="eq in room.equipments" :key="eq.id">{{ eq.name }}</li>
      </ul>
      <p v-else>利用可能な備品はありません。</p>
    </div>

    <div v-if="room" class="content-section room-reservations-today">
      <h2><i class="fas fa-calendar-day icon"></i>本日の予約状況 ({{ todayFormatted }})</h2>
       <div class="date-selector form-group" style="margin-bottom: 20px;">
          <label for="reservation-date-display">表示日付:</label>
          <input type="date" id="reservation-date-display" v-model="selectedDisplayDate" @change="fetchReservationsForSelectedDate" class="form-control" style="max-width: 200px;">
        </div>
      <div v-if="isLoadingTodaysReservations" class="loading-indicator">本日の予約を読み込み中...</div>
      <ul v-else-if="todaysReservations.length > 0" class="reservations-list">
        <li v-for="res in todaysReservations" :key="res.id" class="reservation-item-simple">
          <strong>{{ res.title }}</strong> ({{ res.startTime }} - {{ res.endTime }})
          <span v-if="res.userName"> - 予約者: {{ res.userName }}</span>
        </li>
      </ul>
      <p v-else>本日、この会議室の予約はありません。</p>
       <button @click="goToCreateReservation" class="action-button primary-button" style="margin-top: 20px;">
        <i class="fas fa-plus icon-left"></i>この会議室を予約する ({{selectedDisplayDate}})
      </button>
    </div>

    <div class="page-actions">
        <button @click="goBack" class="action-button secondary-button">戻る</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth'; // 相対パス
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

const props = defineProps({
  id: { // ルートパラメータから渡される会議室ID
    type: String,
    required: true,
  },
});

const API_BASE_URL = 'http://localhost:3001';
const authStore = useAuthStore();
import { useRouter } from 'vue-router'; // useRouter をインポート
const router = useRouter(); // router インスタンスを取得

const room = ref(null);
const todaysReservations = ref([]);
const allUsers = ref([]); // ユーザー名参照用
const selectedDisplayDate = ref(format(new Date(), 'yyyy-MM-dd')); // 表示する日付

const isLoading = ref(true);
const loadError = ref(null);
const isLoadingTodaysReservations = ref(false);

const todayFormatted = computed(() => format(parseISO(selectedDisplayDate.value), 'yyyy年MM月dd日 (EEEE)', { locale: ja }));

const fetchRoomDetails = async () => {
  isLoading.value = true;
  loadError.value = null;
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms/${props.id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    room.value = response.data;
  } catch (error) {
    console.error('会議室詳細の取得に失敗:', error);
    loadError.value = error.response?.data?.message || '会議室データの取得エラー';
    room.value = null;
  } finally {
    isLoading.value = false;
  }
};

const fetchAllUsersInternal = async () => {
  if (!authStore.token || allUsers.value.length > 0) return;
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    allUsers.value = response.data;
  } catch (error) {
    console.error('全ユーザー情報取得に失敗 (RoomDetailView):', error);
  }
};


const fetchReservationsForSelectedDate = async () => {
  if (!room.value?.id) return;
  isLoadingTodaysReservations.value = true;
  try {
    await fetchAllUsersInternal(); // ユーザー情報がない場合は取得
    const response = await axios.get(`${API_BASE_URL}/reservations/room/${room.value.id}?date=${selectedDisplayDate.value}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    todaysReservations.value = response.data.map(res => {
        const user = allUsers.value.find(u => u.id === res.userId);
        return {...res, userName: user ? user.name : '不明'};
    });
  } catch (error) {
    console.error('選択日の予約取得に失敗:', error);
    todaysReservations.value = [];
  } finally {
    isLoadingTodaysReservations.value = false;
  }
};

const goToCreateReservation = () => {
  if (room.value) {
    router.push({
      name: 'ReservationCreate',
      query: { roomId: room.value.id, date: selectedDisplayDate.value }
    });
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath }});
    return;
  }
  await fetchAllUsersInternal(); // 最初にユーザー情報をロード
  await fetchRoomDetails();
  if (room.value) { // room情報が取得できてからその日の予約を取得
    await fetchReservationsForSelectedDate();
  }
});
</script>

<style scoped>
/* ReservationEditView.vue や他の画面と共通のスタイルは省略、またはグローバルCSSに */
.page-container { max-width: 900px; margin: 20px auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
.page-header { text-align: center; border-bottom: 2px solid #007bff; margin-bottom: 30px; padding-bottom: 15px; }
.page-header h1 { color: #0056b3; }
.content-section { background-color: #fff; border:1px solid #eee; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
.content-section h2, .content-section h3 { color: #0056b3; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; }
.icon { margin-right: 8px; }
.loading-indicator, .error-message { text-align: center; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
.loading-indicator { background-color: #e9ecef; }
.error-message { background-color: #f8d7da; color: #721c24; }
.equipment-list, .reservations-list { list-style: none; padding-left: 0; }
.equipment-list li, .reservation-item-simple { padding: 8px 0; border-bottom: 1px dashed #eee; }
.equipment-list li:last-child, .reservation-item-simple:last-child { border-bottom: none; }
.reservation-item-simple strong { margin-right: 10px; }
.page-actions { margin-top:30px; text-align: right; }
.action-button { padding: 10px 20px; border:none; border-radius:5px; cursor:pointer; font-weight:500; }
.primary-button { background-color:#007bff; color:white;}
.secondary-button { background-color:#6c757d; color:white;}
.icon-left { margin-right: 6px; }
.form-group label { display: block; margin-bottom: 5px; font-weight:bold;}
.form-control { padding: 8px; border:1px solid #ccc; border-radius:4px; width: auto;}
</style>
