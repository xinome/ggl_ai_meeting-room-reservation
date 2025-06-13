<template>
  <div class="page-container reservation-create-view">
    <header class="page-header">
      <h1>新規予約作成</h1>
    </header>

    <form @submit.prevent="handleCreateReservation" class="reservation-form content-section">
      <div class="form-group">
        <label for="title">件名 <span class="required-indicator">*</span></label>
        <input type="text" id="title" v-model="formData.title" required />
      </div>

      <div class="form-group">
        <label for="description">説明</label>
        <textarea id="description" v-model="formData.description" rows="3"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="date">日付 <span class="required-indicator">*</span></label>
          <input type="date" id="date" v-model="formData.date" required />
        </div>
        <div class="form-group">
          <label for="branch">支店 <span class="required-indicator">*</span></label>
          <select id="branch" v-model="selectedBranchId" @change="onBranchChange" required>
            <option disabled value="">選択してください</option>
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startTime">開始時刻 <span class="required-indicator">*</span></label>
          <input type="time" id="startTime" v-model="formData.startTime" step="900" required /> <!-- 15分単位 -->
        </div>
        <div class="form-group">
          <label for="endTime">終了時刻 <span class="required-indicator">*</span></label>
          <input type="time" id="endTime" v-model="formData.endTime" step="900" required /> <!-- 15分単位 -->
        </div>
      </div>

       <div class="form-group">
        <label for="room">会議室 <span class="required-indicator">*</span></label>
        <select id="room" v-model="formData.roomId" :disabled="!selectedBranchId || availableRooms.length === 0" required>
          <option disabled value="">まず支店を選択してください</option>
          <option v-for="room in availableRooms" :key="room.id" :value="room.id">
            {{ room.name }} (定員: {{ room.capacity }})
          </option>
        </select>
        <div v-if="selectedBranchId && availableRooms.length === 0 && !isLoadingMasterData" class="info-message">
          この支店に利用可能な会議室はありません。
        </div>
        <div v-if="formData.roomId && selectedDateForRoom && !isLoadingRoomSchedule" class="room-schedule-preview">
            <h4><i class="fas fa-calendar-alt icon"></i>選択日の予約状況 ({{selectedRoomName}})</h4>
            <ul v-if="roomSchedule.length > 0">
                <li v-for="res in roomSchedule" :key="res.id">{{ res.startTime }} - {{ res.endTime }} ({{ res.title }})</li>
            </ul>
            <p v-else>この日はまだ予約がありません。</p>
        </div>
      </div>

      <div class="form-group">
        <label for="attendees">参加者 (カンマ区切りでユーザーIDやメールアドレス)</label>
        <input type="text" id="attendees" v-model="attendeesInput" placeholder="例: u-001, guest@example.com" />
      </div>

      <div class="form-group">
        <label for="status">ステータス</label>
        <select id="status" v-model="formData.status">
          <option value="confirmed">確定</option>
          <option value="tentative">仮予約</option>
        </select>
      </div>


      <div v-if="createError" class="error-message form-error">
        予約作成に失敗しました: {{ createError }}
      </div>

      <div class="form-actions">
        <button type="button" @click="cancelCreate" class="action-button secondary-button">キャンセル</button>
        <button type="submit" :disabled="isCreating" class="action-button primary-button">
          {{ isCreating ? '作成中...' : '予約を作成' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth'; // 相対パス
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:3001';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formData = reactive({
  title: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'), // デフォルトは今日
  startTime: '09:00', // デフォルト開始時刻
  endTime: '10:00',   // デフォルト終了時刻
  roomId: '',
  status: 'confirmed',
});
const attendeesInput = ref('');

const branches = ref([]);
const allRooms = ref([]);
const selectedBranchId = ref('');
const roomSchedule = ref([]); // 選択した会議室のその日の予約状況

const isLoadingMasterData = ref(false); // 支店と会議室の読み込み
const isLoadingRoomSchedule = ref(false);
const isCreating = ref(false);
const createError = ref(null);

const availableRooms = computed(() => {
  if (!selectedBranchId.value) return [];
  return allRooms.value.filter(room => room.branchId === selectedBranchId.value);
});

const selectedDateForRoom = computed(() => formData.date); // 予約フォームの日付と連動
const selectedRoomName = computed(() => {
    const room = allRooms.value.find(r => r.id === formData.roomId);
    return room ? room.name : '';
});


const fetchMasterData = async () => {
  isLoadingMasterData.value = true;
  try {
    const [branchesRes, roomsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/branches`, { headers: { Authorization: `Bearer ${authStore.token}` } }),
      axios.get(`${API_BASE_URL}/rooms`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    ]);
    branches.value = branchesRes.data;
    allRooms.value = roomsRes.data;

    // クエリパラメータから初期値を設定
    if (route.query.date) {
        formData.date = route.query.date;
    }
    if (route.query.roomId) {
        const initialRoom = allRooms.value.find(r => r.id === route.query.roomId);
        if (initialRoom) {
            formData.roomId = initialRoom.id;
            selectedBranchId.value = initialRoom.branchId; // 支店も自動選択
        }
    }

  } catch (error) {
    console.error('マスターデータの取得に失敗:', error);
    createError.value = '初期データの読み込みに失敗しました。';
  } finally {
    isLoadingMasterData.value = false;
  }
};

const fetchRoomSchedule = async () => {
    if (!formData.roomId || !formData.date) {
        roomSchedule.value = [];
        return;
    }
    isLoadingRoomSchedule.value = true;
    try {
        const response = await axios.get(`${API_BASE_URL}/reservations/room/${formData.roomId}?date=${formData.date}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        roomSchedule.value = response.data;
    } catch (error) {
        console.error('会議室の予約状況取得に失敗:', error);
        roomSchedule.value = [];
    } finally {
        isLoadingRoomSchedule.value = false;
    }
};


const onBranchChange = () => {
  formData.roomId = ''; // 支店変更時は会議室選択をリセット
  roomSchedule.value = [];
};

const handleCreateReservation = async () => {
  isCreating.value = true;
  createError.value = null;

  const attendeesArray = attendeesInput.value
    .split(',')
    .map(att => att.trim())
    .filter(att => att !== '');

  const payload = {
    ...formData,
    attendees: attendeesArray,
    // userId はバックエンドの認証ミドルウェアでセットされる想定
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/reservations`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    alert('予約を作成しました。');
    router.push({ name: 'CalendarReservation' }); // または Home (Dashboard)
  } catch (error) {
    console.error('予約の作成に失敗:', error);
    if (error.response && error.response.data && error.response.data.message) {
        createError.value = error.response.data.message;
    } else if (error.message) {
        createError.value = error.message;
    } else {
        createError.value = '予約の作成中に不明なエラーが発生しました。';
    }
  } finally {
    isCreating.value = false;
  }
};

const cancelCreate = () => {
  router.back();
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath }});
    return;
  }
  await fetchMasterData();
  // 初期状態で選択されているかもしれない会議室と日付のスケジュールを取得
  if (formData.roomId && formData.date) {
      await fetchRoomSchedule();
  }
});

watch([() => formData.roomId, () => formData.date], ([newRoomId, newDate], [oldRoomId, oldDate]) => {
    if ((newRoomId && newDate) && (newRoomId !== oldRoomId || newDate !== oldDate)) {
        fetchRoomSchedule();
    } else if (!newRoomId || !newDate) {
        roomSchedule.value = [];
    }
});
</script>

<style scoped>
/* ReservationEditView.vue と同様のスタイル、または共通化 */
.page-container { max-width: 800px; margin: 20px auto; padding: 20px; font-family: 'Segoe UI', sans-serif;}
.page-header { text-align: center; border-bottom: 2px solid #007bff; margin-bottom: 30px; padding-bottom: 15px; }
.page-header h1 { color: #0056b3; }
.content-section { background-color: #fff; border:1px solid #eee; border-radius: 8px; padding: 30px; margin-bottom: 30px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group textarea,
.form-group select {
  width: 100%; padding: 12px; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; font-size: 1em;
}
.required-indicator { color: #dc3545; margin-left: 4px; }
.form-row { display: flex; gap: 20px; margin-bottom: 20px; }
.form-row .form-group { flex: 1; margin-bottom: 0; }
.form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; padding-top:20px; border-top:1px solid #eee; }
.action-button { padding: 10px 20px; border:none; border-radius:5px; cursor:pointer; font-weight:500;}
.primary-button { background-color:#007bff; color:white;}
.secondary-button { background-color:#6c757d; color:white;}
.error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding:10px; border-radius:4px; margin-bottom:15px;}
.info-message { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; padding:10px; border-radius:4px; margin-top:5px;}
.room-schedule-preview { margin-top: 15px; padding:10px; background-color:#f9f9f9; border-radius:4px; font-size:0.9em;}
.room-schedule-preview h4 { margin-top:0; margin-bottom:8px; font-size:1.1em; }
.room-schedule-preview ul { list-style:disc; margin-left:20px; padding-left:0; }
.icon { margin-right: 6px;}
</style>
