const express = require('express');
const cors = require('cors');   // CORSミドルウェアをインポート
const fs = require('fs'); // fsモジュールをインポート
const path = require('path'); // pathモジュールをインポート

const app = express();
const PORT = process.env.PORT || 3001;  // バックエンドサーバーのポート番号

// --- モックデータの読み込み ---
let mockUsers = [];
let mockRooms = [];
let mockReservations = [];
let mockEquipment = [];
let mockBranches = [];

try {
    mockUsers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    mockRooms = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'rooms.json'), 'utf8'));
    mockReservations = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'reservations.json'), 'utf8'));
    mockEquipment = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'equipment.json'), 'utf8'));
    mockBranches = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'branches.json'), 'utf8'));
    console.log('Mock data loaded successfully.');
} catch (err) {
    console.error('Error loading mock data:', err);
    // エラー発生時は空の配列のままサーバーを起動するか、プロセスを終了するか選択
    // process.exit(1);
}


// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// --- APIエンドポイント ---

/**
 * ログインAPI (/auth/login)
 */
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = mockUsers.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password (user not found)' });
    }

    if (user.password !== password) { // 本来はハッシュ比較
        return res.status(401).json({ message: 'Invalid email or password (password mismatch)' });
    }

    const mockToken = `mock-jwt-token-for-${user.id}-${Date.now()}`;
    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        branchId: user.branchId
    };

    res.status(200).json({
        message: 'Login successful',
        token: mockToken,
        user: userResponse,
    });
});

/**
 * ログアウトAPI (/auth/logout) - ダミー実装
 */
app.post('/auth/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

// --- ユーザー関連API ---
// GET /users (ユーザー一覧取得)
app.get('/users', (req, res) => {
    const usersForResponse = mockUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        branchId: u.branchId
    }));
    res.status(200).json(usersForResponse);
});

// GET /users/:id (特定ユーザー取得)
app.get('/users/:id', (req, res) => {
    const user = mockUsers.find(u => u.id === req.params.id);
    if (user) {
        const { password, ...userResponse } = user; // パスワードを除外
        res.status(200).json(userResponse);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// POST /users (ユーザー新規作成) - パスワードはハッシュ化する想定
app.post('/users', (req, res) => {
    const newUser = {
        id: `u-${Date.now()}`, // 簡単なID生成
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // TODO: バリデーションを追加
    mockUsers.push(newUser);
    const { password, ...userResponse } = newUser;
    res.status(201).json(userResponse);
});

// --- 会議室関連API ---
// GET /rooms (会議室一覧取得)
app.get('/rooms', (req, res) => {
    res.status(200).json(mockRooms);
});

// GET /rooms/:id (特定会議室取得 - 備品情報付きに修正)
app.get('/rooms/:id', (req, res) => {
    const room = mockRooms.find(r => r.id === req.params.id);
    if (room) {
        // 備品情報をルックアップして追加
        const roomWithEquipment = {
            ...room,
            equipments: room.equipmentIds
                ? room.equipmentIds.map(eqId => mockEquipment.find(eq => eq.id === eqId)).filter(Boolean) // filter(Boolean) で undefined を除去
                : []
        };
        res.status(200).json(roomWithEquipment);
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

// --- 予約関連API ---
// GET /reservations (予約一覧取得)
app.get('/reservations', (req, res) => {
    // TODO: クエリパラメータ (date, roomId, userId 등) に基づくフィルタリングを実装
    res.status(200).json(mockReservations);
});

// (新規) GET /reservations/room/:roomId?date=YYYY-MM-DD (特定会議室の特定日の予約一覧)
app.get('/reservations/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { date } = req.query; // date は YYYY-MM-DD 形式を期待

    if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
    }
    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required' });
    }

    const roomExists = mockRooms.some(room => room.id === roomId);
    if (!roomExists) {
        return res.status(404).json({ message: 'Room not found' });
    }

    const reservationsForRoomOnDate = mockReservations.filter(
        res => res.roomId === roomId && res.date === date
    );
    res.status(200).json(reservationsForRoomOnDate);
});

// GET /reservations/:id (特定予約取得)
app.get('/reservations/:id', (req, res) => {
    const reservation = mockReservations.find(r => r.id === req.params.id);
    if (reservation) {
        res.status(200).json(reservation);
    } else {
        res.status(404).json({ message: 'Reservation not found' });
    }
});

// POST /reservations (予約作成 - バリデーション強化)
app.post('/reservations', (req, res) => {
    const { title, date, startTime, endTime, roomId, description, attendees, status } = req.body;
    const userIdFromToken = req.userId; // ★認証ミドルウェアから取得する想定（後述）

    // 1. 必須項目チェック
    if (!title || !date || !startTime || !endTime || !roomId || !userIdFromToken) {
        return res.status(400).json({ message: 'Missing required fields (title, date, startTime, endTime, roomId, userId)' });
    }

    // 2. 時刻の整合性 (簡易チェック、実際はdate-fnsなどで正確に比較)
    if (startTime >= endTime) {
        return res.status(400).json({ message: 'End time must be after start time' });
    }

    // 3. 会議室の存在確認
    const roomExists = mockRooms.some(room => room.id === roomId);
    if (!roomExists) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // 4. 予約の重複チェック (同じ会議室、同じ日付、時間帯の重複)
    const conflictingReservation = mockReservations.find(res =>
        res.roomId === roomId &&
        res.date === date &&
        // 時間帯の重複ロジック (簡易版: 開始時刻または終了時刻が既存の予約時間内に入るか)
        // (A.start < B.end) && (A.end > B.start)
        (startTime < res.endTime && endTime > res.startTime)
    );

    if (conflictingReservation) {
        return res.status(409).json({ message: 'Time slot conflict. The room is already booked for the selected time.' });
    }

    const newReservation = {
        id: `res-${Date.now()}`,
        title,
        date,
        startTime,
        endTime,
        roomId,
        userId: userIdFromToken,
        description: description || '',
        attendees: attendees || [],
        status: status || 'confirmed', // デフォルトは 'confirmed'
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockReservations.push(newReservation);
    console.log('New reservation created:', newReservation);
    res.status(201).json(newReservation);
});

// PUT /reservations/:id (予約更新) <--- ★★★ この部分を追加 ★★★
app.put('/reservations/:id', (req, res) => {
    const reservationId = req.params.id;
    const updatedData = req.body;

    const reservationIndex = mockReservations.findIndex(r => r.id === reservationId);

    if (reservationIndex === -1) {
        return res.status(404).json({ message: 'Reservation not found for update' });
    }

    // 更新対象の予約を取得し、新しいデータで上書き
    // 注意: 本来はもっと厳密なバリデーションや、更新すべきでないフィールドの保護が必要です。
    // (例: userId や createdAt は通常更新させない)
    const originalReservation = mockReservations[reservationIndex];
    mockReservations[reservationIndex] = {
        ...originalReservation,       // 既存のデータをスプレッド
        ...updatedData,               // リクエストボディのデータで上書き
        id: reservationId,            // IDは変更しない
        userId: originalReservation.userId, // 作成者は変更しない (ポリシーによる)
        createdAt: originalReservation.createdAt, // 作成日時も変更しない
        updatedAt: new Date().toISOString(), // 更新日時を現在時刻に設定
    };

    console.log(`Reservation ${reservationId} updated:`, mockReservations[reservationIndex]);
    res.status(200).json(mockReservations[reservationIndex]); // 更新後のデータを返す
});


// DELETE /reservations/:id (予約削除)
app.delete('/reservations/:id', (req, res) => {
    const reservationId = req.params.id;
    const initialLength = mockReservations.length;
    mockReservations = mockReservations.filter(r => r.id !== reservationId);

    if (mockReservations.length < initialLength) {
        console.log(`Reservation ${reservationId} deleted.`);
        res.status(200).json({ message: 'Reservation deleted successfully' });
        // res.status(204).send(); // No Content もよく使われる
    } else {
        res.status(404).json({ message: 'Reservation not found for deletion' });
    }
});

// ★認証ミドルウェアの簡単な例 (全ての /api ルートに適用する場合など)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        // 予約作成など、認証必須のAPIでは401を返す
        // GET系で未認証でも一部情報を見せる場合は next() を呼ぶか、分岐する
        // 今回は予約作成にユーザーIDが必要なので、未認証はエラーとする
        if (req.method === 'POST' && req.path.startsWith('/reservations')) {
             return res.sendStatus(401); // Unauthorized
        }
        return next(); // 他のルートは認証なしで許可 (デモ用)
    }

    // モックトークンの検証 (簡易版)
    if (token.startsWith('mock-jwt-token-for-')) {
        const userId = token.split('-')[4]; // 'mock-jwt-token-for-u-001-timestamp' の u-001 部分
        if (mockUsers.some(u => u.id === userId)) {
            req.userId = userId; // リクエストオブジェクトにユーザーIDをセット
            return next();
        }
    }
    return res.sendStatus(403); // Forbidden (トークンが無効)
};

// 認証ミドルウェアを予約関連のAPIパスに適用 (または全体に)
// app.use('/api', authenticateToken); // 例: /api で始まる全ルート
app.use('/reservations', authenticateToken); // /reservations で始まるルートに適用



// --- 備品関連API ---
app.get('/equipment', (req, res) => {
    res.status(200).json(mockEquipment);
});

// --- 支店関連API ---
app.get('/branches', (req, res) => {
    res.status(200).json(mockBranches);
});


// サーバー起動
app.listen(PORT, () => {
    console.log(`Mock API server is running on http://localhost:${PORT}`);
});
