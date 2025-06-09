<template>
  <div class="page-container reservation-edit-view">
    <header class="page-header">
      <h1>予約編集</h1>
    </header>

    <div v-if="isLoading" class="loading-indicator">
      予約情報を読み込み中...
    </div>
    <div v-else-if="loadError" class="error-message">
      予約情報の読み込みに失敗しました: {{ loadError }}
    </div>

    <form v-if="reservation" @submit.prevent="handleUpdateReservation" class="reservation-form content-section">
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
          <input type="time" id="startTime" v-model="formData.startTime" required />
        </div>
        <div class="form-group">
          <label for="endTime">終了時刻 <span class="required-indicator">*</span></label>
          <input type="time" id="endTime" v-model="formData.endTime" required />
        </div>
      </div>

      <div class="form-group">
        <label for="room">会議室 <span class="required-indicator">*</span></label>
        <select id="room" v-model="formData.roomId" :disabled="!selectedBranchId || availableRooms.length === 0" required>
          <option disabled value="">支店を選択してください</option>
          <option v-for="room in availableRooms" :key="room.id" :value="room.id">
            {{ room.name }} (定員: {{ room.capacity }})
          </option>
        </select>
        <div v-if="selectedBranchId && availableRooms.length === 0 && !isLoadingRooms" class="info-message">
          この支店には利用可能な会議室がありません。
        </div>
      </div>

      <div class="form-group">
        <label for="attendees">参加者 (カンマ区切りでメールアドレスまたはユーザーID)</label>
        <input type="text" id="attendees" v-model="attendeesInput" placeholder="例: user1@example.com, u-002" />
        <small>カンマ区切りで参加者のメールアドレスまたはIDを入力してください。</small>
      </div>
       <div class="form-group">
        <label for="status">ステータス</label>
        <select id="status" v-model="formData.status">
          <option value="confirmed">確定</option>
          <option value="tentative">仮予約</option>
        </select>
      </div>


      <div v-if="updateError" class="error-message form-error">
        更新に失敗しました: {{ updateError }}
      </div>

      <div class="form-actions">
        <button type="button" @click="cancelEdit" class="action-button secondary-button">キャンセル</button>
        <button type="submit" :disabled="isUpdating" class="action-button primary-button">
          {{ isUpdating ? '更新中...' : '更新する' }}
        </button>
      </div>
    </form>

    <div v-if="!isLoading && !reservation && !loadError" class="info-message">
      指定された予約が見つかりません。
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth'; // 相対パス
import axios from 'axios';
import { format, parseISO } from 'date-fns'; // 日付フォーマット用

const props = defineProps({
  id: { // ルートパラメータから渡される予約ID
    type: String,
    required: true,
  },
});

const API_BASE_URL = 'http://localhost:3001';
const router = useRouter();
const authStore = useAuthStore();

const reservation = ref(null);
const formData = reactive({
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  roomId: '',
  status: 'confirmed', // デフォルト
  // attendees は attendeesInput から変換
});
const attendeesInput = ref(''); // 参加者入力用 (カンマ区切り文字列)

const branches = ref([]);
const allRooms = ref([]); // 全ての会議室
const selectedBranchId = ref('');

const isLoading = ref(true);
const loadError = ref(null);
const isUpdating = ref(false);
const updateError = ref(null);
const isLoadingRooms = ref(false);

const availableRooms = computed(() => {
  if (!selectedBranchId.value) return [];
  return allRooms.value.filter(room => room.branchId === selectedBranchId.value);
});

const fetchReservationData = async () => {
  isLoading.value = true;
  loadError.value = null;
  try {
    const response = await axios.get(`${API_BASE_URL}/reservations/${props.id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    reservation.value = response.data;

    // フォームデータを初期化
    if (reservation.value) {
      formData.title = reservation.value.title;
      formData.description = reservation.value.description || '';
      // APIからの日付は "YYYY-MM-DD" 形式、時刻は "HH:mm" 形式であることを想定
      formData.date = reservation.value.date; // format(parseISO(reservation.value.date), 'yyyy-MM-dd');
      formData.startTime = reservation.value.startTime;
      formData.endTime = reservation.value.endTime;
      formData.roomId = reservation.value.roomId;
      formData.status = reservation.value.status || 'confirmed';

      // 参加者リストをカンマ区切り文字列に変換 (attendees が配列の場合)
      if (Array.isArray(reservation.value.attendees)) {
        attendeesInput.value = reservation.value.attendees.join(', ');
      } else if (typeof reservation.value.attendees === 'string') { // 文字列の場合もあるかもしれない
        attendeesInput.value = reservation.value.attendees;
      }

      // 会議室から支店IDを特定
      const room = allRooms.value.find(r => r.id === formData.roomId);
      if (room) {
        selectedBranchId.value = room.branchId;
      }
    }
  } catch (error) {
    console.error('予約情報の取得に失敗:', error);
    loadError.value = error.response?.data?.message || '予約データの取得中にエラーが発生しました。';
    reservation.value = null;
  } finally {
    isLoading.value = false;
  }
};

const fetchBranchesAndRooms = async () => {
  isLoadingRooms.value = true;
  try {
    const [branchesRes, roomsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/branches`, { headers: { Authorization: `Bearer ${authStore.token}` } }),
      axios.get(`${API_BASE_URL}/rooms`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    ]);
    branches.value = branchesRes.data;
    allRooms.value = roomsRes.data;
  } catch (error) {
    console.error('支店または会議室情報の取得に失敗:', error);
    loadError.value = (loadError.value ? loadError.value + '; ' : '') + '支店/会議室データの取得に失敗。';
  } finally {
    isLoadingRooms.value = false;
  }
};

const onBranchChange = () => {
  // 支店が変更されたら、選択されている会議室がその支店に属さない場合はリセット
  if (formData.roomId && selectedBranchId.value) {
    const roomExistsInBranch = availableRooms.value.some(room => room.id === formData.roomId);
    if (!roomExistsInBranch) {
      formData.roomId = ''; // 会議室選択をリセット
    }
  }
};

const handleUpdateReservation = async () => {
  isUpdating.value = true;
  updateError.value = null;

  // attendeesInput を配列に変換 (空要素は除去)
  const attendeesArray = attendeesInput.value
    .split(',')
    .map(att => att.trim())
    .filter(att => att !== '');

  const payload = {
    ...formData,
    attendees: attendeesArray,
    userId: reservation.value?.userId, // 作成者は変更しない想定 (API仕様による)
  };

  // 不要なIDやタイムスタンプを含めないように注意 (APIが受け付けるフィールドのみ)
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;


  try {
    const response = await axios.put(`${API_BASE_URL}/reservations/${props.id}`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    alert('予約情報を更新しました。');
    router.push({ name: 'CalendarReservation' }); // または詳細画面へ
  } catch (error) {
    console.error('予約の更新に失敗:', error);
    updateError.value = error.response?.data?.message || '予約の更新中にエラーが発生しました。';
  } finally {
    isUpdating.value = false;
  }
};

const cancelEdit = () => {
  // 変更を破棄してカレンダー画面などに戻る
  router.back(); // 直前のページに戻る
  // または router.push({ name: 'CalendarReservation' });
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath }});
    return;
  }
  await fetchBranchesAndRooms(); // 最初に支店と会議室を取得
  if (props.id) {
    await fetchReservationData(); // 次に予約データを取得
  } else {
    isLoading.value = false;
    loadError.value = "予約IDが指定されていません。";
  }
});

// 支店IDが変わったら利用可能な会議室が更新されるので、それに合わせて会議室選択をクリアするかもしれない
watch(selectedBranchId, (newBranchId, oldBranchId) => {
  if (newBranchId !== oldBranchId) {
    // onBranchChange で対応済みだが、もしリセットロジックが必要ならここにも
  }
});

</script>

<style scoped>
/* CalendarReservationView.vue や LoginView.vue と同様のスタイルを適用 */
.page-container {
  max-width: 800px;
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

.content-section { /* フォーム全体を囲む */
  background-color: #ffffff;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.loading-indicator, .error-message, .info-message {
  text-align: center;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}
.loading-indicator { background-color: #e9ecef; color: #495057; }
.error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.info-message { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
.form-error { margin-top: 15px; }


.reservation-form .form-group {
  margin-bottom: 20px;
}
.reservation-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}
.reservation-form input[type="text"],
.reservation-form input[type="date"],
.reservation-form input[type="time"],
.reservation-form textarea,
.reservation-form select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1em;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.reservation-form input:focus,
.reservation-form textarea:focus,
.reservation-form select:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.reservation-form textarea {
  resize: vertical;
}
.required-indicator {
  color: #dc3545;
  margin-left: 4px;
}
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.form-row .form-group {
  flex: 1; /* 各項目が均等にスペースを取る */
  margin-bottom: 0; /* form-row がマージンを持つため */
}

.form-group small {
  display: block;
  margin-top: 5px;
  font-size: 0.85em;
  color: #6c757d;
}


.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}
.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s, box-shadow 0.2s;
}
.primary-button {
  background-color: #007bff;
  color: white;
}
.primary-button:hover {
  background-color: #0069d9;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.primary-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #6c757d;
  color: white;
}
.secondary-button:hover {
  background-color: #5a6268;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
</style>
