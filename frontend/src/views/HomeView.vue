<template>
  <div class="page-container home-view">
    <header class="page-header">
      <h1>会議室予約システム ホーム</h1>
    </header>

    <div v-if="authStore.isAuthenticated" class="content-authenticated">
      <p class="welcome-message">
        ようこそ、<strong>{{ authStore.userName }}</strong>さん。
      </p>

      <!-- ログインユーザーの予約状況 -->
      <section class="content-section my-reservations-section">
        <h2><i class="fas fa-calendar-check icon"></i>あなたの予約</h2>
        <div v-if="isLoadingMyReservations" class="loading-indicator">予約情報を読み込み中...</div>
        <div v-else-if="myReservations.length > 0" class="reservations-list">
          <ul class="item-list">
            <li v-for="reservation in myReservations" :key="reservation.id" class="list-item">
              <div class="item-main-info">
                <span class="item-title">{{ reservation.title }}</span>
                <span class="item-details">
                  {{ reservation.date }} ({{ reservation.startTime }} - {{ reservation.endTime }})
                </span>
              </div>
              <span class="item-sub-info">会議室: {{ reservation.roomName || 'N/A' }}</span>
            </li>
          </ul>
        </div>
        <p v-else class="no-data-message">現在、あなたの予約はありません。</p>
      </section>

      <!-- 会議室一覧 -->
      <section class="content-section rooms-list-section">
        <h2><i class="fas fa-door-open icon"></i>会議室一覧</h2>
        <div v-if="isLoadingRooms" class="loading-indicator">会議室情報を読み込み中...</div>
        <div v-else-if="rooms.length > 0">
          <ul class="item-list">
            <li v-for="room in rooms" :key="room.id" class="list-item room-list-item">
              <div class="item-main-info">
                <span class="item-title">{{ room.name }}</span>
                <span class="item-details">定員: {{ room.capacity }}名</span>
              </div>
              <button @click="showRoomReservations(room)" class="action-button primary-button">
                <i class="fas fa-eye icon-left"></i>この会議室の予約を見る
              </button>
            </li>
          </ul>
        </div>
        <p v-else class="no-data-message">利用可能な会議室はありません。</p>
      </section>

      <!-- 選択した会議室の予約状況 -->
      <section v-if="selectedRoom" class="content-section selected-room-reservations-section">
        <h3>
          <i class="fas fa-calendar-day icon"></i>
          「{{ selectedRoom.name }}」の予約状況
        </h3>
        <div class="date-selector form-group">
          <label for="room-reservation-date">日付を選択:</label>
          <input type="date" id="room-reservation-date" v-model="selectedDateForRoom" @change="fetchRoomReservationsDebounced" class="form-control">
        </div>
        <div v-if="isLoadingRoomReservations" class="loading-indicator">予約情報を読み込み中...</div>
        <div v-else-if="roomReservations.length > 0" class="reservations-list">
          <ul class="item-list">
            <li v-for="reservation in roomReservations" :key="reservation.id" class="list-item">
               <div class="item-main-info">
                <span class="item-title">{{ reservation.title }}</span>
                <span class="item-details">
                  {{ reservation.startTime }} - {{ reservation.endTime }}
                </span>
              </div>
              <span class="item-sub-info">予約者: {{ reservation.userName || (reservation.attendeeNames?.join(', ') || '情報なし') }}</span>
            </li>
          </ul>
        </div>
        <p v-else class="no-data-message">選択された日付に、この会議室の予約はありません。</p>
      </section>
    </div>

    <div v-else class="content-guest">
      <div class="guest-message-box">
        <h2>会議室予約システムへようこそ！</h2>
        <p>
          会議室の空き状況の確認、予約の作成・編集・削除が簡単に行えます。
        </p>
        <p>
          ご利用いただくには<router-link to="/login" class="login-link">ログイン</router-link>してください。
        </p>
        <router-link to="/login" class="action-button primary-button large-button">
          <i class="fas fa-sign-in-alt icon-left"></i>ログインページへ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth'; // 相対パスに修正済み
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const authStore = useAuthStore();
const router = useRouter(); // 現状未使用ですが、将来的なナビゲーションのために残しておきます

const myReservations = ref([]);
const rooms = ref([]);
const allUsers = ref([]); // ユーザー名参照用
const selectedRoom = ref(null);
const roomReservations = ref([]);
const selectedDateForRoom = ref(new Date().toISOString().split('T')[0]);

const isLoadingMyReservations = ref(false);
const isLoadingRooms = ref(false);
const isLoadingRoomReservations = ref(false);

const isLoggedIn = computed(() => authStore.isAuthenticated);

// --- APIコール関数 ---
const fetchAllUsersInternal = async () => {
  if (!authStore.token || allUsers.value.length > 0) return; // 既に取得済みならスキップ
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    allUsers.value = response.data;
  } catch (error) {
    console.error('全ユーザー情報取得に失敗:', error);
  }
};


const fetchMyReservations = async () => {
  if (!authStore.user?.id || !authStore.token) return;
  isLoadingMyReservations.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/reservations`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    myReservations.value = response.data
      .filter(res => res.userId === authStore.user.id)
      .map(res => ({
        ...res,
        roomName: rooms.value.find(room => room.id === res.roomId)?.name || 'N/A',
      }));
  } catch (error) {
    console.error('自分の予約取得に失敗:', error);
    myReservations.value = [];
  } finally {
    isLoadingMyReservations.value = false;
  }
};

const fetchRooms = async () => {
  if (!authStore.token) return;
  isLoadingRooms.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    rooms.value = response.data;
  } catch (error) {
    console.error('会議室一覧取得に失敗:', error);
    rooms.value = [];
  } finally {
    isLoadingRooms.value = false;
  }
};

const fetchRoomReservations = async () => {
  if (!selectedRoom.value?.id || !authStore.token) return;
  isLoadingRoomReservations.value = true;
  try {
    await fetchAllUsersInternal(); // 予約者名表示のためにユーザー情報を確認・取得
    const response = await axios.get(`${API_BASE_URL}/reservations`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
      params: {
        roomId: selectedRoom.value.id,
        date: selectedDateForRoom.value,
      },
    });
    // モックAPIが roomId と date でフィルタリングしてくれることを期待
    // attendeeNames があればそれを使用し、なければ allUsers から引く
    roomReservations.value = response.data.map(res => {
      let userNameDisplay = '予約者情報なし';
      if (res.attendeeNames && res.attendeeNames.length > 0) {
        userNameDisplay = res.attendeeNames.join(', ');
      } else if (res.userId) {
        const user = allUsers.value.find(u => u.id === res.userId);
        if (user) {
            userNameDisplay = user.name;
        }
      }
      return { ...res, userName: userNameDisplay };
    });
  } catch (error) {
    console.error(`「${selectedRoom.value.name}」の予約取得に失敗:`, error);
    roomReservations.value = [];
  } finally {
    isLoadingRoomReservations.value = false;
  }
};

let debounceTimer;
const fetchRoomReservationsDebounced = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchRoomReservations();
  }, 300);
};

const showRoomReservations = (room) => {
  selectedRoom.value = room;
  // selectedDateForRoom.value = new Date().toISOString().split('T')[0]; // 必要なら日付をリセット
  fetchRoomReservations(); // 日付選択の変更を待たずに初期表示
};

// --- ライフサイクル & ウォッチャー ---
const loadInitialData = async () => {
    if (authStore.isAuthenticated) {
        await fetchAllUsersInternal(); // 最初にユーザー情報を取得
        await fetchRooms(); // 次に会議室情報
        if (rooms.value.length > 0 || !isLoadingRooms.value) { // 会議室取得後
            await fetchMyReservations(); // 自分の予約を取得
        }
    }
};

onMounted(loadInitialData);

watch(isLoggedIn, (newValue, oldValue) => {
  if (newValue && !oldValue) { // ログイン時
    loadInitialData();
  } else if (!newValue && oldValue) { // ログアウト時
    myReservations.value = [];
    rooms.value = [];
    allUsers.value = [];
    selectedRoom.value = null;
    roomReservations.value = [];
    // ローディングフラグもリセット
    isLoadingMyReservations.value = false;
    isLoadingRooms.value = false;
    isLoadingRoomReservations.value = false;
  }
});

// watch(selectedRoom, ...) は不要になりました。showRoomReservationsで直接呼ぶため。
</script>

<style scoped>
/* FontAwesomeなどのアイコンフォントをインポートしている前提 */
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'); */

.page-container {
  max-width: 900px; /* 少し広めに */
  margin: 20px auto; /* 上マージン追加 */
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  background-color: #f4f7f6; /* 全体の背景色を少し設定 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.page-header {
  text-align: center;
  border-bottom: 2px solid #007bff; /* App.vue のスタイルに合わせるか、独自にするか */
  margin-bottom: 30px;
  padding-bottom: 15px;
}

.page-header h1 {
  color: #0056b3; /* 少し濃い青 */
  font-size: 2.2em;
  font-weight: 600;
  margin: 0;
}

.welcome-message {
  font-size: 1.3em;
  margin-bottom: 25px;
  color: #28a745; /* 少し緑がかった色 */
  text-align: center;
  padding: 10px;
  background-color: #e9f5e9;
  border-radius: 6px;
}
.welcome-message strong {
  font-weight: 600;
}

.content-section {
  background-color: #ffffff;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.content-section h2, .content-section h3 {
  font-size: 1.6em; /* 少し大きめ */
  color: #0056b3;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
}
.content-section h3 {
  font-size: 1.4em;
}

.icon {
  margin-right: 10px;
  color: #007bff; /* アイコンの色 */
}
.icon-left {
  margin-right: 6px;
}

.loading-indicator, .no-data-message {
  color: #6c757d;
  font-style: italic;
  padding: 15px 5px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 10px;
}

.item-list {
  list-style: none;
  padding-left: 0;
}

.list-item {
  padding: 15px 10px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  flex-direction: column; /* デフォルトを縦並びに */
  gap: 5px; /* 要素間の隙間 */
}
.list-item:last-child {
  border-bottom: none;
}
.room-list-item {
    flex-direction: row; /* 会議室一覧は横並びを維持 */
    justify-content: space-between;
    align-items: center;
}

.item-main-info {
  display: flex;
  flex-direction: column; /* タイトルと詳細を縦に */
  flex-grow: 1;
}
.item-title {
  font-weight: 600;
  color: #343a40;
  font-size: 1.1em;
  margin-bottom: 3px;
}
.item-details {
  font-size: 0.9em;
  color: #495057;
}
.item-sub-info {
  font-size: 0.85em;
  color: #6c757d;
  margin-top: 4px;
}


.action-button {
  padding: 8px 15px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease;
  font-size: 0.95em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.action-button:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.primary-button {
  background-color: #007bff;
}
.primary-button:hover {
  background-color: #0069d9;
}
.large-button {
  padding: 12px 25px;
  font-size: 1.1em;
}


.form-group {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-group label {
  font-weight: 500;
  white-space: nowrap; /* ラベルが折り返さないように */
}
.form-control { /* input[type="date"] などに適用 */
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1em;
  flex-grow: 1; /* 入力欄がスペースを埋めるように */
}


.content-guest {
  text-align: center;
  padding: 40px 20px;
}
.guest-message-box {
  background-color: #e9f7ff;
  border: 1px solid #bce0fd;
  padding: 30px;
  border-radius: 8px;
  display: inline-block; /* 中央寄せのため */
  box-shadow: 0 4px 10px rgba(0,0,0,0.07);
}
.guest-message-box h2 {
  font-size: 1.8em;
  color: #004085;
  margin-bottom: 15px;
}
.guest-message-box p {
  font-size: 1.1em;
  color: #1c4a73;
  line-height: 1.6;
  margin-bottom: 20px;
}
.login-link {
  color: #0056b3;
  font-weight: bold;
  text-decoration: none;
}
.login-link:hover {
  text-decoration: underline;
}
</style>
