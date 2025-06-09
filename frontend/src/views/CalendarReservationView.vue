<template>
  <div class="calendar-reservation-view">
    <header class="page-header">
      <h1>カレンダー予約</h1>
    </header>

    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="prevMonth" class="nav-button">< 前月</button>
        <h2 class="current-month">{{ formattedCurrentMonth }}</h2>
        <button @click="nextMonth" class="nav-button">次月 ></button>
      </div>

      <div v-if="isLoadingReservations" class="loading-indicator">
        予約情報を読み込み中...
      </div>

      <div class="calendar-grid">
        <div v-for="dayName in dayNames" :key="dayName" class="day-name">
          {{ dayName }}
        </div>
        <div
          v-for="day in calendarDays"
          :key="day.date.toISOString()"
          class="calendar-day"
          :class="{
            'is-other-month': !day.isCurrentMonth,
            'is-today': day.isToday,
            'is-saturday': day.isSaturday,
            'is-sunday': day.isSunday,
          }"
          @dragover.prevent
          @drop="handleDropOnDate(day.date, $event)"
        >
          <span class="day-number">{{ day.formattedDate }}</span>
          <div class="reservations-in-day">
            <div
              v-for="reservation in day.reservations"
              :key="reservation.id"
              class="reservation-item"
              draggable="true"
              @dragstart="handleDragStart(reservation, $event)"
              @mouseover="showActions(reservation.id)"
              @mouseleave="hideActions(reservation.id)"
            >
              <span class="reservation-title">{{ reservation.title }}</span>
              <span class="reservation-time">{{ reservation.startTime }} - {{ reservation.endTime }}</span>
              <div
                v-if="hoveredReservationId === reservation.id"
                class="reservation-actions"
              >
                <button @click.stop="editReservation(reservation.id)" class="action-btn edit-btn">編集</button>
                <button @click.stop="confirmDeleteReservation(reservation.id)" class="action-btn delete-btn">削除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  isSameDay,
  addDays, // addDays をインポート
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/auth'; // 相対パス
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';
const authStore = useAuthStore();

const currentMonth = ref(new Date());
const allUserReservations = ref([]); // ログインユーザーの全予約
const isLoadingReservations = ref(false);
const hoveredReservationId = ref(null); // ホバー中の予約ID

const formattedCurrentMonth = computed(() => {
  return format(currentMonth.value, 'yyyy年MM月', { locale: ja });
});

const dayNames = computed(() => {
  const weekStartsOn = 0;
  return Array.from({ length: 7 }).map((_, i) =>
    format(new Date(2024, 0, 7 + i - (7 - weekStartsOn)), 'EEEEEE', { locale: ja })
  );
});

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentMonth.value);
  const monthEnd = endOfMonth(currentMonth.value);
  const calendarStartDate = startOfWeek(monthStart, { locale: ja, weekStartsOn: 0 });
  let calendarEndDate = endOfWeek(monthEnd, { locale: ja, weekStartsOn: 0 });

  // 6週間表示を保証するための調整 (任意)
  const daysInGrid = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate }).length;
  if (daysInGrid < 42) { // 6 weeks * 7 days
    calendarEndDate = addDays(calendarEndDate, 42 - daysInGrid);
  }


  const days = eachDayOfInterval({
    start: calendarStartDate,
    end: calendarEndDate,
  });

  return days.map(date => {
    const dayOfWeek = getDay(date);
    const reservationsForDay = allUserReservations.value.filter(res =>
      isSameDay(parseISO(res.date), date) // res.date は "YYYY-MM-DD" 形式と仮定
    );
    return {
      date: date,
      formattedDate: format(date, 'd'),
      isCurrentMonth: isSameMonth(date, currentMonth.value),
      isToday: isToday(date),
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
      reservations: reservationsForDay,
    };
  });
});

const fetchUserReservations = async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) {
    allUserReservations.value = [];
    return;
  }
  isLoadingReservations.value = true;
  try {
    // APIから全予約を取得し、フロントエンドでユーザーIDと期間でフィルタリング
    // 本来はAPI側でフィルタリングするのが望ましい
    const response = await axios.get(`${API_BASE_URL}/reservations`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    allUserReservations.value = response.data.filter(
      res => res.userId === authStore.user.id
    );
  } catch (error) {
    console.error('予約情報の取得に失敗しました:', error);
    allUserReservations.value = [];
    // TODO: ユーザーにエラーを通知
  } finally {
    isLoadingReservations.value = false;
  }
};


const prevMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1);
};

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1);
};

const showActions = (reservationId) => {
  hoveredReservationId.value = reservationId;
};

const hideActions = (reservationId) => {
  // すぐに非表示にするとクリックが難しいため、少し遅延させるか、
  // reservation-item からマウスが外れたら null にするなどの工夫も検討
  if (hoveredReservationId.value === reservationId) {
     // hoveredReservationId.value = null; // シンプルに即時非表示
  }
};
//mouseleaveでnullにする処理は、reservation-item側に記述する方が制御しやすい

const editReservation = (reservationId) => {
  console.log('編集する予約ID:', reservationId);
  // TODO: Vue Routerを使って編集ページに遷移
  // router.push({ name: 'ReservationEdit', params: { id: reservationId } });
  alert(`予約ID: ${reservationId} の編集画面へ（未実装）`);
};

const confirmDeleteReservation = async (reservationId) => {
  if (window.confirm('この予約を削除してもよろしいですか？')) {
    try {
      isLoadingReservations.value = true; // 画面全体にローディング表示してもよい
      await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      // 削除成功後、予約リストを再読み込み
      await fetchUserReservations();
      alert('予約を削除しました。');
    } catch (error) {
      console.error('予約の削除に失敗しました:', error);
      alert('予約の削除に失敗しました。');
      // TODO: ユーザーにエラーを通知
    } finally {
      isLoadingReservations.value = false;
    }
  }
};

// ドラッグアンドドロップ関連（おまけ程度、本格実装は複雑）
const handleDragStart = (reservation, event) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', reservation.id);
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDropOnDate = async (targetDate, event) => {
  if (event.dataTransfer) {
    const reservationId = event.dataTransfer.getData('text/plain');
    const reservationToUpdate = allUserReservations.value.find(r => r.id === reservationId);

    if (reservationToUpdate) {
      const newDate = format(targetDate, 'yyyy-MM-dd');
      if (window.confirm(`${reservationToUpdate.title} を ${newDate} に移動しますか？`)) {
        // ここでAPIを呼んで日付を更新する
        console.log(`予約ID: ${reservationId} を ${newDate} に移動 (API呼び出しは未実装)`);
        // 例:
        // try {
        //   await axios.put(`${API_BASE_URL}/reservations/${reservationId}`,
        //     { ...reservationToUpdate, date: newDate },
        //     { headers: { Authorization: `Bearer ${authStore.token}` } }
        //   );
        //   fetchUserReservations(); // 更新後に再読み込み
        // } catch (error) {
        //   console.error("予約の移動に失敗:", error);
        // }
        alert(`予約ID: ${reservationId} を ${newDate} に移動 (API呼び出しは未実装)`);
      }
    }
  }
};


onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchUserReservations();
  }
});

watch(currentMonth, () => {
  // 月が変わった場合、表示期間内の予約を更新するために再取得する必要があるが、
  // 今回は全予約を保持し、computedでフィルタリングしているので、
  // fetchUserReservationsを再度呼ぶ必要はない（APIが期間指定をサポートしていない場合）。
  // もしAPIが期間指定をサポートするなら、ここで再度APIを叩く。
  // 今回は、月が変わっても保持している全予約から表示を再計算するので何もしない。
});

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    fetchUserReservations();
  } else {
    allUserReservations.value = []; // ログアウト時にクリア
  }
});

</script>

<style scoped>
/* ... (前回と同じスタイル、または調整) ... */
.calendar-reservation-view {
  max-width: 1000px; /* 少し広げる */
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header {
  text-align: center;
  border-bottom: 2px solid #007bff;
  margin-bottom: 30px;
  padding-bottom: 15px;
}

.page-header h1 {
  color: #0056b3;
}

.calendar-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.current-month {
  font-size: 1.8em;
  font-weight: 500;
}

.nav-button {
  padding: 8px 15px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.nav-button:hover {
  background-color: #0056b3;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #666;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border: 1px solid #e0e0e0;
}

.day-name {
  background-color: #f8f9fa;
  padding: 10px 5px;
  text-align: center;
  font-weight: bold;
}

.calendar-day {
  background-color: #fff;
  padding: 8px; /* 少しパディングを調整 */
  min-height: 120px; /* 高さを少し増やす */
  position: relative;
}

.calendar-day:hover {
  background-color: #f0f8ff;
}

.day-number {
  font-size: 0.9em;
  font-weight: 500;
  display: block; /* 日付をブロック要素にしてスペースを作る */
  margin-bottom: 5px;
}

.calendar-day.is-other-month .day-number {
  color: #adb5bd;
}

.calendar-day.is-today .day-number {
  color: white;
  background-color: #007bff;
  border-radius: 50%;
  padding: 3px 6px;
  display: inline-block;
}

.calendar-day.is-saturday { /* 土曜日の日付の背景を変える例 */
  /* background-color: #eef7ff;  */
}
.calendar-day.is-saturday .day-number {
  color: #007bff;
}

.calendar-day.is-sunday { /* 日曜日の日付の背景を変える例 */
  /* background-color: #ffeef0; */
}
.calendar-day.is-sunday .day-number {
  color: #dc3545;
}

.reservations-in-day {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 予約間のスペース */
}

.reservation-item {
  background-color: #e9f7ff;
  border-left: 3px solid #007bff;
  padding: 6px 8px;
  border-radius: 3px;
  font-size: 0.85em;
  cursor: grab; /* ドラッグ可能であることを示す */
  position: relative; /* アクションボタンの位置決めのため */
}
.reservation-item:hover {
  background-color: #d1ecff;
}

.reservation-title {
  font-weight: bold;
  display: block;
  margin-bottom: 2px;
}
.reservation-time {
  font-size: 0.9em;
  color: #555;
}

.reservation-actions {
  position: absolute;
  top: 0px; /* 微調整が必要 */
  right: 0px; /* 微調整が必要 */
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  padding: 3px;
  display: flex;
  gap: 3px;
  z-index: 10; /* 他の要素より手前に */
}

.action-btn {
  background: none;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 0.8em;
  border-radius: 2px;
}
.action-btn:hover {
  background-color: #f0f0f0;
}
.edit-btn { color: #007bff; }
.delete-btn { color: #dc3545; }

</style>
