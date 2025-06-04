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
// GET /rooms/:id (特定会議室取得)
app.get('/rooms/:id', (req, res) => {
    const room = mockRooms.find(r => r.id === req.params.id);
    if (room) {
        res.status(200).json(room);
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
// GET /reservations/:id (特定予約取得)
app.get('/reservations/:id', (req, res) => {
    const reservation = mockReservations.find(r => r.id === req.params.id);
    if (reservation) {
        res.status(200).json(reservation);
    } else {
        res.status(404).json({ message: 'Reservation not found' });
    }
});
// POST /reservations (予約作成)
app.post('/reservations', (req, res) => {
    // 認証済みユーザーIDを本来はトークンから取得する
    // const userIdFromToken = "u-001"; // 仮
    const newReservation = {
        id: `res-${Date.now()}`,
        // userId: userIdFromToken,
        ...req.body,
        status: req.body.status || 'tentative', // デフォルトステータス
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // TODO: バリデーション (必須項目、日付の妥当性、会議室の空き状況など)
    mockReservations.push(newReservation);
    res.status(201).json(newReservation);
});


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
