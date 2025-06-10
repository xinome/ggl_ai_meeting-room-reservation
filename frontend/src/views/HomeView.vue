<template>
  <div class="btoc-home-view">
    <!-- 未ログインユーザー向け表示 -->
    <div v-if="!authStore.isAuthenticated" class="guest-view">
      <section class="hero-section">
        <div class="hero-background">
          <!-- 背景画像や動画をここに配置 (CSSで設定も可) -->
        </div>
        <div class="hero-content">
          <h1 class="hero-title">新しい働き方を、ここから始めよう。</h1>
          <p class="hero-subtitle">
            あなたのビジネスやプロジェクトに最適な空間を、簡単に見つけて予約。
          </p>
          <div class="hero-search-form">
            <input type="text" placeholder="エリア、駅名、キーワードで検索..." class="hero-search-input" v-model="guestSearchKeyword" @keyup.enter="searchRoomsGuest" />
            <button @click="searchRoomsGuest" class="hero-search-button">
              <i class="fas fa-search"></i> 今すぐ探す
            </button>
          </div>
          <router-link to="/login" class="hero-login-link">またはログイン</router-link>
        </div>
      </section>

      <section class="features-section">
        <h2 class="section-title">会議室予約をもっとスマートに</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon"><i class="fas fa-search-location"></i></div>
            <h3 class="feature-title">簡単検索</h3>
            <p class="feature-description">日付、場所、人数で絞り込み。あなたのニーズにぴったりの会議室がすぐに見つかります。</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="fas fa-calendar-alt"></i></div>
            <h3 class="feature-title">即時予約</h3>
            <p class="feature-description">空き状況をリアルタイムで確認。面倒な手続きなしで、その場で予約を確定できます。</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="fas fa-couch"></i></div>
            <h3 class="feature-title">多様なスペース</h3>
            <p class="feature-description">少人数ミーティングから大規模セミナーまで。多彩なタイプの会議室をご用意しています。</p>
          </div>
        </div>
      </section>

      <section class="popular-rooms-guest">
        <h2 class="section-title">人気の会議室をチェック</h2>
        <div v-if="isLoadingRooms" class="loading-indicator">情報を読み込み中...</div>
        <div v-else class="rooms-grid">
          <div v-for="room in popularRoomsGuest" :key="room.id" class="room-card-guest">
            <div class="room-card-image" :style="{ backgroundImage: `url(${getRoomImageUrl(room.id)})` }"></div>
            <div class="room-card-content">
              <h3 class="room-card-title">{{ room.name }}</h3>
              <p class="room-card-capacity">定員: {{ room.capacity }}名</p>
              <p class="room-card-branch">{{ room.branchName || 'N/A' }}</p>
              <router-link :to="authStore.isAuthenticated ? `/calendar-reservation` : '/login'" class="room-card-cta">
                {{ authStore.isAuthenticated ? '予約する' : '詳細・ログインして予約' }}
              </router-link>
            </div>
          </div>
          <div v-if="!isLoadingRooms && popularRoomsGuest.length === 0" class="no-data-message">
            現在表示できる人気の会議室はありません。
          </div>
        </div>
         <router-link to="/login" class="cta-button-section guest-more-rooms">
            もっと会議室を見る (要ログイン) <i class="fas fa-arrow-right"></i>
        </router-link>
      </section>

      <section class="cta-section-guest">
        <h2 class="section-title">準備はできましたか？</h2>
        <p>今すぐアカウントを作成して、あなたのビジネスを加速させましょう。</p>
        <router-link to="/register" class="cta-button primary">無料アカウント登録</router-link>
        <!-- /register ルートがまだなければ、/login にフォールバック -->
      </section>
    </div>

    <!-- ログインユーザー向け表示 (既存の機能を活かしつつBtoC風に) -->
    <div v-if="authStore.isAuthenticated" class="authenticated-view">
      <header class="page-header-auth">
        <h1>こんにちは、{{ authStore.userName }}さん！</h1>
        <p>今日も一日、頑張りましょう。</p>
      </header>

      <section class="quick-actions-section">
        <router-link to="/calendar-reservation" class="quick-action-button">
          <i class="fas fa-calendar-plus"></i> 新規予約作成
        </router-link>
        <!-- 他のクイックアクションボタンを追加可能 -->
      </section>

      <div class="dashboard-grid">
        <div class="dashboard-main-content">
          <!-- あなたの次の予約 -->
          <section class="content-section my-next-reservation-btoc">
            <h2><i class="fas fa-stopwatch icon"></i> あなたの次の予約</h2>
            <div v-if="isLoadingMyReservations && nextReservation" class="loading-indicator">予約情報を読み込み中...</div>
            <div v-else-if="nextReservation" class="next-reservation-card">
              <div class="reservation-card-header">
                <h3 class="reservation-card-title">{{ nextReservation.title }}</h3>
                <span class="reservation-card-status" :class="nextReservation.status">{{ nextReservation.status === 'confirmed' ? '確定済' : '仮予約' }}</span>
              </div>
              <p class="reservation-card-detail">
                <i class="fas fa-calendar-alt"></i> {{ nextReservation.date }} ({{ nextReservation.startTime }} - {{ nextReservation.endTime }})
              </p>
              <p class="reservation-card-detail">
                <i class="fas fa-map-marker-alt"></i> {{ nextReservation.roomName || 'N/A' }}
              </p>
              <div class="reservation-card-actions">
                 <router-link :to="`/reservations/edit/${nextReservation.id}`" class="action-button secondary-button icon-left">
                  <i class="fas fa-edit"></i> 編集
                </router-link>
                <router-link to="/calendar-reservation" class="action-button primary-button icon-left">
                  <i class="fas fa-calendar-day"></i> すべての予約を見る
                </router-link>
              </div>
            </div>
            <p v-else-if="!isLoadingMyReservations" class="no-data-message">今後の予約はありません。</p>
          </section>

          <!-- 会議室クイック検索 (ログインユーザー向け) -->
          <section class="content-section room-quick-search-btoc">
             <h2><i class="fas fa-search icon"></i> 会議室を検索</h2>
            <div class="quick-search-form">
                <input type="date" v-model="quickSearchDate" class="form-control">
                <select v-model="quickSearchBranchId" class="form-control">
                    <option value="">全ての支店</option>
                    <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{branch.name}}</option>
                </select>
                <button @click="searchRoomsAuthenticated" class="action-button primary-button">
                    <i class="fas fa-search"></i> 検索
                </button>
            </div>
            <!-- 検索結果表示エリア (今回は省略) -->
          </section>
        </div>

        <aside class="dashboard-sidebar">
           <!-- 最近利用した会議室 (既存のroomsから数件表示) -->
          <section class="content-section recent-rooms-btoc">
            <h3><i class="fas fa-history icon"></i> 最近チェックした会議室</h3>
            <div v-if="isLoadingRooms" class="loading-indicator">読み込み中...</div>
            <ul v-else-if="recentRooms.length > 0" class="simple-list">
              <li v-for="room in recentRooms" :key="room.id">
                <router-link :to="`/rooms/${room.id}`"> <!-- room詳細ページがあれば -->
                  {{ room.name }} ({{ room.branchName }})
                </router-link>
              </li>
            </ul>
            <p v-else class="no-data-message">履歴はありません。</p>
          </section>
          <!-- (既存の「選択した会議室の予約状況」はカレンダーページに集約する想定) -->
        </aside>
      </div>

       <!-- 既存の会議室一覧表示（スタイル調整） -->
      <section class="content-section rooms-list-section-btoc">
        <h2><i class="fas fa-door-open icon"></i>すべての会議室</h2>
        <div v-if="isLoadingRooms" class="loading-indicator">情報を読み込み中...</div>
        <div v-else-if="rooms.length > 0" class="rooms-grid">
           <div v-for="room in rooms" :key="room.id" class="room-card-auth">
            <div class="room-card-image" :style="{ backgroundImage: `url(${getRoomImageUrl(room.id)})` }"></div>
            <div class="room-card-content">
              <h3 class="room-card-title">{{ room.name }}</h3>
              <p class="room-card-capacity">定員: {{ room.capacity }}名</p>
              <p class="room-card-branch">{{ room.branchName || 'N/A' }}</p>
               <button @click="showRoomReservations(room)" class="room-card-cta">
                <i class="fas fa-eye"></i> この会議室の予約を見る
              </button>
            </div>
          </div>
        </div>
        <p v-else class="no-data-message">利用可能な会議室はありません。</p>
      </section>

    </div> <!-- authenticated-view end -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth'; // 相対パス
import { useRouter } // useRouter をインポート
from 'vue-router';
import axios from 'axios';
import { format, parseISO, isFuture, isToday as dfIsToday } from 'date-fns';


const API_BASE_URL = 'http://localhost:3001';

const authStore = useAuthStore();
const router = useRouter();

// --- 共通 ---
const rooms = ref([]);
const branches = ref([]);
const isLoadingRooms = ref(false);
const getRoomImageUrl = (roomId) => { // ダミー画像URL生成
  // 実際のプロジェクトでは会議室ごとの画像URLをDBなどから取得
  const placeholderBase = 'https://via.placeholder.com/300x200.png?text=Room+';
  return `${placeholderBase}${roomId.substring(roomId.length - 1)}`; // ID末尾で変化
};


// --- 未ログインユーザー向け ---
const guestSearchKeyword = ref('');
const popularRoomsGuest = ref([]);

const searchRoomsGuest = () => {
  if (!guestSearchKeyword.value.trim()) {
    alert('検索キーワードを入力してください。');
    return;
  }
  // 実際にはAPIを叩くか、ログインを促す
  alert(`「${guestSearchKeyword.value}」で検索 (未実装)。ログインして詳細検索をご利用ください。`);
  router.push('/login');
};

const fetchPopularRoomsGuest = async () => {
    if (rooms.value.length > 0) { // 既に全会議室データがあればそれを利用
        popularRoomsGuest.value = rooms.value.slice(0, 3).map(room => ({
            ...room,
            branchName: branches.value.find(b => b.id === room.branchId)?.name
        }));
        return;
    }
  isLoadingRooms.value = true; // roomsがまだない場合
  try {
    // ログインしていなくても見れる人気会議室APIがあると良いが、今回は既存の/roomsを利用
    const roomsResponse = await axios.get(`${API_BASE_URL}/rooms`);
    const branchesResponse = await axios.get(`${API_BASE_URL}/branches`);
    branches.value = branchesResponse.data;
    rooms.value = roomsResponse.data;

    popularRoomsGuest.value = rooms.value.slice(0, 3).map(room => ({ // 先頭3件を「人気」とする
      ...room,
      branchName: branches.value.find(b => b.id === room.branchId)?.name
    }));
  } catch (error) {
    console.error('人気会議室情報取得に失敗:', error);
  } finally {
    isLoadingRooms.value = false;
  }
};


// --- ログインユーザー向け ---
const myReservations = ref([]);
const isLoadingMyReservations = ref(false);
const quickSearchDate = ref(format(new Date(), 'yyyy-MM-dd'));
const quickSearchBranchId = ref('');
const allUsers = ref([]); // 既存のコードから (必要なら)
const selectedRoom = ref(null); // 既存のコードから (必要なら)
const roomReservations = ref([]); // 既存のコードから (必要なら)
const selectedDateForRoom = ref(format(new Date(), 'yyyy-MM-dd')); // 既存のコードから (必要なら)


const nextReservation = computed(() => {
  if (!myReservations.value || myReservations.value.length === 0) return null;
  return myReservations.value
    .filter(res => dfIsToday(parseISO(res.date)) || isFuture(parseISO(res.date))) // 今日以降の予約
    .sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime)) // 日時でソート
    [0]; // 最も近い予約
});

const recentRooms = computed(() => { // ダミーで全会議室の先頭2件
    return rooms.value.slice(0, 2).map(room => ({
        ...room,
        branchName: branches.value.find(b => b.id === room.branchId)?.name
    }));
});

const fetchRoomsAndBranchesAuth = async () => {
    if (!authStore.token) return;
    isLoadingRooms.value = true;
    try {
        const [roomsRes, branchesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/rooms`, { headers: { Authorization: `Bearer ${authStore.token}` } }),
            axios.get(`${API_BASE_URL}/branches`, { headers: { Authorization: `Bearer ${authStore.token}` } })
        ]);
        rooms.value = roomsRes.data;
        branches.value = branchesRes.data;
    } catch (error) {
        console.error('会議室または支店情報の取得に失敗 (Auth):', error);
    } finally {
        isLoadingRooms.value = false;
    }
};

const fetchMyReservationsAuth = async () => {
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
        roomName: rooms.value.find(room => room.id === res.roomId)?.name || 'N/A', // 会議室名を追加
      }));
  } catch (error) {
    console.error('自分の予約取得に失敗 (Auth):', error);
  } finally {
    isLoadingMyReservations.value = false;
  }
};

const searchRoomsAuthenticated = () => {
    // 検索条件 (quickSearchDate, quickSearchBranchId) を使ってカレンダー予約画面に遷移
    // または、この画面内で結果を表示する
    router.push({
        name: 'CalendarReservation', // カレンダー予約画面のルート名
        query: {
            date: quickSearchDate.value,
            branch: quickSearchBranchId.value
        }
    });
};

// 既存の showRoomReservations, fetchRoomReservationsDebounced などはカレンダーページに移管済み、またはこのページでは不要なら削除


// --- ライフサイクル & ウォッチャー ---
const loadInitialData = async () => {
  if (authStore.isAuthenticated) {
    await fetchRoomsAndBranchesAuth();
    await fetchMyReservationsAuth();
  } else {
    // 未ログイン時は人気会議室などを表示
    await fetchPopularRoomsGuest();
  }
};

onMounted(loadInitialData);

watch(() => authStore.isAuthenticated, (isAuth) => {
  // ログイン状態が変更されたらデータを再読み込み
  loadInitialData();
});

</script>

<style scoped>
/* 基本スタイル */
.btoc-home-view {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
}
.section-title {
  text-align: center;
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 40px;
  font-weight: 300;
  position: relative;
  padding-bottom: 15px;
}
.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #3498db;
}
.loading-indicator, .no-data-message {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}
.action-button, .cta-button, .hero-search-button, .room-card-cta {
  display: inline-block;
  padding: 12px 25px;
  border: none;
  border-radius: 25px; /* 丸みを帯びたボタン */
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  font-size: 1em;
}
.action-button:hover, .cta-button:hover, .hero-search-button:hover, .room-card-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.primary-button, .hero-search-button, .cta-button.primary {
  background-color: #3498db;
  color: white;
}
.primary-button:hover, .hero-search-button:hover, .cta-button.primary:hover {
  background-color: #2980b9;
}
.secondary-button {
  background-color: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
}
.secondary-button:hover {
  background-color: #dadedf;
}
.icon-left .fas { margin-right: 8px;}


/* 未ログイン時: Hero Section */
.hero-section {
  position: relative;
  height: 70vh; /* ビューポートの高さの70% */
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  overflow: hidden; /* 背景がはみ出ないように */
}
.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1100&q=80'); /* フリー素材例 */
  background-size: cover;
  background-position: center;
  filter: brightness(0.6); /* 少し暗くして文字を見やすく */
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  max-width: 700px;
}
.hero-title {
  font-size: 3.2em;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
.hero-subtitle {
  font-size: 1.4em;
  margin-bottom: 30px;
  font-weight: 300;
  opacity: 0.9;
}
.hero-search-form {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
  background-color: rgba(255,255,255,0.15);
  padding: 15px;
  border-radius: 30px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
.hero-search-input {
  flex-grow: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 20px;
  font-size: 1em;
  background-color: white;
  color: #333;
}
.hero-login-link {
  color: #f1c40f; /* 目立つ色 */
  text-decoration: underline;
  font-weight: bold;
}

/* 未ログイン時: Features Section */
.features-section {
  padding: 60px 20px;
  background-color: #f9f9f9;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1100px;
  margin: 0 auto;
}
.feature-item {
  text-align: center;
  padding: 25px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.07);
}
.feature-icon {
  font-size: 2.5em;
  color: #3498db;
  margin-bottom: 15px;
}
.feature-title {
  font-size: 1.5em;
  color: #2c3e50;
  margin-bottom: 10px;
}
.feature-description {
  font-size: 0.95em;
  color: #555;
}

/* 未ログイン時: 人気の会議室 / CTA */
.popular-rooms-guest, .cta-section-guest {
  padding: 60px 20px;
  text-align: center;
}
.cta-section-guest p {
  font-size: 1.2em;
  margin-bottom: 30px;
  color: #555;
}
.guest-more-rooms {
    margin-top: 30px;
    font-size: 1.1em;
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
}
.guest-more-rooms:hover { color: #2980b9; }

/* ログイン時: 全体 */
.authenticated-view {
  padding: 20px;
}
.page-header-auth {
  text-align: left;
  margin-bottom: 30px;
  padding: 15px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 8px;
}
.page-header-auth h1 { font-size: 2em; margin-bottom: 5px;}
.page-header-auth p { font-size: 1.1em; opacity: 0.9; margin:0;}

.quick-actions-section {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    justify-content: flex-start; /* 左寄せ */
}
.quick-action-button {
    background-color: #28a745;
    color: white;
    padding: 12px 20px;
}
.quick-action-button:hover { background-color: #218838; }


/* ログイン時: ダッシュボードグリッド */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr; /* スマホでは1カラム */
  gap: 30px;
}
@media (min-width: 992px) { /* PCではサイドバーあり */
  .dashboard-grid {
    grid-template-columns: 2fr 1fr; /* メインコンテンツとサイドバー */
  }
}
.content-section {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px; /* グリッドアイテムとしてのマージン */
}
.content-section h2, .content-section h3 {
  font-size: 1.4em;
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}
.content-section h3 { font-size: 1.2em; }


/* ログイン時: あなたの次の予約 */
.my-next-reservation-btoc .next-reservation-card {
  background-color: #e9f7ff;
  border: 1px solid #bce0fd;
  border-radius: 6px;
  padding: 20px;
}
.reservation-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.reservation-card-title { font-size: 1.3em; color: #004085; margin:0;}
.reservation-card-status {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: bold;
}
.reservation-card-status.confirmed { background-color: #28a745; color: white;}
.reservation-card-status.tentative { background-color: #ffc107; color: #333;}
.reservation-card-detail { margin: 8px 0; color: #1c4a73; }
.reservation-card-detail .fas { margin-right: 8px; color: #0056b3;}
.reservation-card-actions { margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;}


/* ログイン時: 会議室クイック検索 */
.quick-search-form {
    display: flex;
    gap: 10px;
    align-items: center;
}
.quick-search-form .form-control {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    flex-grow: 1;
}
.quick-search-form select.form-control { flex-grow: 0.5; } /* 支店選択は少し狭く */


/* ログイン時: 最近利用した会議室 */
.simple-list { list-style: none; padding-left: 0; }
.simple-list li { padding: 8px 0; border-bottom: 1px dashed #eee; }
.simple-list li:last-child { border-bottom: none; }
.simple-list li a { color: #007bff; text-decoration: none; }
.simple-list li a:hover { text-decoration: underline; }

/* 会議室カード (ログイン時・未ログイン時共通部分) */
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
}
.room-card-guest, .room-card-auth {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  overflow: hidden; /* 画像のはみ出し防止 */
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.room-card-guest:hover, .room-card-auth:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.room-card-image {
  height: 180px;
  background-size: cover;
  background-position: center;
}
.room-card-content {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.room-card-title {
  font-size: 1.3em;
  color: #333;
  margin: 0 0 8px 0;
}
.room-card-capacity, .room-card-branch {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}
.room-card-branch .fas { margin-right: 5px;}
.room-card-cta {
  margin-top: auto; /* ボタンを下部に配置 */
  background-color: #5cb85c;
  color: white;
  text-align: center;
  padding: 10px 15px;
  border-radius: 5px;
}
.room-card-cta:hover {
  background-color: #4cae4c;
}
/* FontAwesome アイコン用のプレースホルダー */
.fas {
  /* スタイルは適宜調整 */
}

</style>
