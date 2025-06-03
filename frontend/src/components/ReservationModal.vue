<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>{{ room?.name }} の予約</h3>
      <form @submit.prevent="handleSubmit">
        <div>
          <label for="date">日付:</label>
          <input type="date" id="date" v-model="reservationDate" required :min="todayDate">
        </div>
        <div>
          <label for="startTime">開始時刻:</label>
          <select id="startTime" v-model="startTimeSlot" required>
            <option v-for="slot in availableTimeSlots" :key="slot" :value="slot">
              {{ slot }}
            </option>
          </select>
        </div>
        <div>
          <label for="endTime">終了時刻:</label>
           <select id="endTime" v-model="endTimeSlot" required>
            <option v-for="slot in availableTimeSlots" :key="slot" :value="slot" :disabled="isEndTimeDisabled(slot)">
              {{ slot }}
            </option>
          </select>
        </div>
        <div>
          <label for="purpose">目的:</label>
          <input type="text" id="purpose" v-model="purpose" required>
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="modal-actions">
          <button type="submit" :disabled="isSubmitting">予約する</button>
          <button type="button" @click="closeModal">キャンセル</button>
        </div>
      </form>

      <div v-if="roomReservations.length > 0" class="existing-reservations">
        <h4>{{ reservationDate }} の予約状況:</h4>
        <ul>
          <li v-for="res in roomReservationsForSelectedDate" :key="res.id">
            {{ formatTime(res.startTime) }} - {{ formatTime(res.endTime) }} ({{ res.purpose }})
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import type { Room, Reservation, NewReservationData } from '../types';
import apiService from '../services/apiService';

const props = defineProps<{
  show: boolean;
  room: Room | null;
}>();

const emit = defineEmits(['close', 'reservationCreated']);

const reservationDate = ref(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
const startTimeSlot = ref('09:00');
const endTimeSlot = ref('10:00');
const purpose = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const roomReservations = ref<Reservation[]>([]); // 選択された部屋の全予約

const todayDate = computed(() => new Date().toISOString().split('T')[0]);

// 予約可能な時間帯 (例: 9:00 - 18:00、30分単位)
const availableTimeSlots = computed(() => {
  const slots = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('18:00');
  return slots;
});

const roomReservationsForSelectedDate = computed(() => {
  if (!reservationDate.value) return [];
  return roomReservations.value.filter(res => 
    res.startTime.startsWith(reservationDate.value)
  );
});

const isEndTimeDisabled = (slot: string) => {
  if (!startTimeSlot.value) return false;
  return slot <= startTimeSlot.value;
};

watch(startTimeSlot, (newStartTime) => {
  if (endTimeSlot.value <= newStartTime) {
    // 開始時刻より前の終了時刻が選択されていたら、自動で調整
    const startIndex = availableTimeSlots.value.indexOf(newStartTime);
    if (startIndex !== -1 && startIndex + 1 < availableTimeSlots.value.length) {
      endTimeSlot.value = availableTimeSlots.value[startIndex + 1];
    } else {
      // 適切な次のスロットがない場合は、とりあえず同じにする（バリデーションで弾く）
      endTimeSlot.value = newStartTime;
    }
  }
});


const fetchReservationsForRoom = async () => {
  if (props.room) {
    roomReservations.value = await apiService.getReservations(props.room.id);
  }
};

watch(() => props.room, (newRoom) => {
  if (newRoom) {
    fetchReservationsForRoom();
    // モーダルが開くときに日付をリセット
    reservationDate.value = new Date().toISOString().split('T')[0];
    startTimeSlot.value = '09:00';
    endTimeSlot.value = '10:00';
    purpose.value = '';
    errorMessage.value = null;

  }
}, { immediate: true });

// 日付が変更されたら、その日の予約を取得しなおす（UI表示用）
watch(reservationDate, () => {
    // ここでは全予約を再取得せず、roomReservationsからフィルタリングするだけで良い
    // fetchReservationsForRoom(); // これは部屋が変わった時だけで良い
});


const closeModal = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!props.room) return;
  errorMessage.value = null;

  if (endTimeSlot.value <= startTimeSlot.value) {
    errorMessage.value = '終了時刻は開始時刻より後に設定してください。';
    return;
  }

  const startDateTime = new Date(`${reservationDate.value}T${startTimeSlot.value}:00`);
  const endDateTime = new Date(`${reservationDate.value}T${endTimeSlot.value}:00`);

  const reservationData: NewReservationData = {
    roomId: props.room.id,
    userId: 'mockUser1', // TODO: 実際のユーザーIDに置き換える
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    purpose: purpose.value,
  };

  isSubmitting.value = true;
  const newReservation = await apiService.createReservation(reservationData);
  isSubmitting.value = false;

  if (newReservation) {
    emit('reservationCreated', newReservation);
    fetchReservationsForRoom(); // 予約リストを更新
    closeModal();
  } else {
    // apiService内でエラーメッセージは表示済み
    // errorMessage.value = '予約に失敗しました。時間帯が重複している可能性があります。';
  }
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  if (props.room) {
    fetchReservationsForRoom();
  }
});

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-content div {
  margin-bottom: 10px;
}
.modal-content label {
  display: block;
  margin-bottom: 5px;
}
.modal-content input, .modal-content select {
  width: calc(100% - 12px);
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.error-message {
  color: red;
  font-size: 0.9em;
  margin-top: 10px;
}
.existing-reservations {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}
.existing-reservations h4 {
  margin-top: 0;
}
.existing-reservations ul {
  list-style: none;
  padding: 0;
}
.existing-reservations li {
  font-size: 0.9em;
  padding: 5px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.existing-reservations li:last-child {
  border-bottom: none;
}
</style>
