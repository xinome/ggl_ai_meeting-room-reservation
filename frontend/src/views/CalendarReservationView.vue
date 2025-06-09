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
        >
          <span class="day-number">{{ day.formattedDate }}</span>
          <!-- ここに予約情報を表示するロジックを後で追加 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
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
  // getWeeksInMonth, // 必要なら
} from 'date-fns';
import { ja } from 'date-fns/locale'; // 日本語ロケール

const currentMonth = ref(new Date()); // 現在の日付を基準月とする

const formattedCurrentMonth = computed(() => {
  return format(currentMonth.value, 'yyyy年MM月', { locale: ja });
});

const dayNames = computed(() => {
  // 週の始まりを日曜日に固定
  const weekStartsOn = 0; // 0: Sunday, 1: Monday, ...
  return Array.from({ length: 7 }).map((_, i) =>
    format(new Date(2024, 0, 7 + i - (7 - weekStartsOn)), 'EEEEEE', { locale: ja })
  );
});


const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentMonth.value);
  const monthEnd = endOfMonth(currentMonth.value);

  // カレンダー表示の開始日（現在の月の最初の週の日曜日）
  const calendarStartDate = startOfWeek(monthStart, { locale: ja, weekStartsOn: 0 });
  // カレンダー表示の終了日（現在の月の最後の週の土曜日）
  // 6週間表示を保証するために調整する場合もあるが、今回はシンプルに
  let calendarEndDate = endOfWeek(monthEnd, { locale: ja, weekStartsOn: 0 });

  // カレンダーが常に6行になるように調整 (任意)
  // const daysInCalendar = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate }).length;
  // if (daysInCalendar < 42) { // 6 weeks * 7 days
  //   calendarEndDate = addDays(calendarEndDate, 42 - daysInCalendar);
  // }


  const days = eachDayOfInterval({
    start: calendarStartDate,
    end: calendarEndDate,
  });

  return days.map(date => {
    const dayOfWeek = getDay(date); // 0 (Sunday) to 6 (Saturday)
    return {
      date: date,
      formattedDate: format(date, 'd'),
      isCurrentMonth: isSameMonth(date, currentMonth.value),
      isToday: isToday(date),
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
    };
  });
});

const prevMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1);
};

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1);
};

// 祝日判定はdate-fns単体では難しいため、今回は含めていません。
// 必要であれば、外部ライブラリ (@holiday-jp/holiday_jp など) の導入を検討してください。
</script>

<style scoped>
.calendar-reservation-view {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  background-color: #f4f7f6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.page-header {
  text-align: center;
  border-bottom: 2px solid #007bff;
  margin-bottom: 30px;
  padding-bottom: 15px;
}

.page-header h1 {
  color: #0056b3;
  font-size: 2.2em;
  font-weight: 600;
  margin: 0;
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
  color: #0056b3;
}

.nav-button {
  padding: 8px 15px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.nav-button:hover {
  background-color: #0056b3;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px; /* 細い線で区切る */
  background-color: #e0e0e0; /* グリッド線の色 */
  border: 1px solid #e0e0e0;
}

.day-name {
  background-color: #f8f9fa;
  padding: 10px 5px;
  text-align: center;
  font-weight: bold;
  color: #343a40;
}

.calendar-day {
  background-color: #fff;
  padding: 10px 5px;
  min-height: 100px; /* ある程度の高さを確保 */
  position: relative;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f0f8ff; /* ホバー時に少し色を変える */
}

.day-number {
  font-size: 0.9em;
  font-weight: 500;
}

.calendar-day.is-other-month .day-number {
  color: #adb5bd; /* 当月以外の日付 */
}

.calendar-day.is-today .day-number {
  color: white;
  background-color: #007bff;
  border-radius: 50%;
  padding: 3px 6px;
  display: inline-block;
}

.calendar-day.is-saturday .day-number {
  color: #007bff; /* 土曜日 */
}

.calendar-day.is-sunday .day-number {
  color: #dc3545; /* 日曜日 */
}

/* 予約情報を表示するためのプレースホルダー */
/* .reservations-in-day {
  margin-top: 5px;
  font-size: 0.8em;
} */
</style>
