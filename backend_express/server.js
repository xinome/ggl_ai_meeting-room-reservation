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

// ★★★ 認証ミドルウェアの定義をここ (使用する箇所より前) に移動 ★★★
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('AuthenticateToken Middleware - Token:', token); // デバッグ用ログ

    if (token == null) {
        // トークンが必須ではないとのことなので、userIdを直接入れるオプションも考慮
        // ただし、POST /reservations ではユーザー特定が必要なので、何らかのユーザー識別子は必須
        // 今回は「トークンがなければ特定のデモユーザーIDを仮に使う」か「エラーにするか」の判断
        // 「トークンは必須ではないので、userIdをそのまま入れる形でも問題ありません」というコメントを考慮し、
        // もしトークンがない場合でも、リクエストボディにuserIdが含まれていればそれを使うか、
        // あるいは開発用に固定のuserIdを割り当てるか、などの代替策が必要。
        // ここでは、ひとまず「トークンがなければreq.userIdはセットされない」としておく。
        // その場合、POST /reservations での userIdFromToken の必須チェックが機能する。
        console.log('AuthenticateToken Middleware - No token provided.');
        return next(); // トークンがなくても次の処理へ（ルート側でuserIdの有無をチェック）
    }

    if (token.startsWith('mock-jwt-token-for-')) {
        // const userId = token.split('-')[4];
        // userIdの抽出方法を修正: Tokenの「-」区切りで最後から２、3番目を取得して「u-003」などのフォーマットで取得できる形に
        const parts = token.split('-');
        const userId = parts.length >= 4 ? parts.slice(4, 6).join('-') : null; // 「u-003」などの形式を想定

        const userExists = mockUsers.some(u => u.id === userId);

        console.log("mockUsers: ", mockUsers); // デバッグ用ログ
        console.log('AuthenticateToken Middleware - User ID from token:', userId); // デバッグ用ログ

        if (userExists) {
            req.userId = userId; // リクエストオブジェクトにユーザーIDをセット
            console.log('AuthenticateToken Middleware - User ID set from token:', req.userId);
            return next();
        } else {
            console.log('AuthenticateToken Middleware - User ID from token not found in mockUsers.');
            return res.status(403).json({ message: 'Forbidden - User from token not found' }); // ユーザーが存在しない場合
        }
    }
    console.log('AuthenticateToken Middleware - Invalid token format.');
    return res.status(403).json({ message: 'Forbidden - Invalid token' }); // トークン形式が無効
};

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

// 認証ミドルウェアを予約関連のAPIパスに適用 (または全体に)
// app.use('/reservations', authenticateToken); // ルート全体に適用する場合 (こちらの方が一般的)

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
app.post('/reservations', authenticateToken, (req, res) => {
    console.log('--- POST /reservations Request Received ---');
    console.log('User ID from token (in route handler):', req.userId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { title, date, startTime, endTime, roomId, description, attendees, status } = req.body;
    // const userIdFromToken = req.userId; // ミドルウェアでセットされたものを使う

    // ★ トークンが必須ではない場合の代替ユーザーID取得ロジック (もし導入する場合) ★
    let effectiveUserId = req.userId; // まずトークンからのIDを試す
    if (!effectiveUserId && req.body.userId) { // もしトークンがなく、リクエストボディにuserIdがあればそれを使う (開発用など)
        console.log('Using userId from request body as fallback:', req.body.userId);
        effectiveUserId = req.body.userId;
    } else if (!effectiveUserId) { // それでもユーザーIDがなければエラー
        console.error('Validation failed: User ID is missing (neither from token nor request body).');
        return res.status(400).json({ message: 'User ID is required.' });
    }

    console.log('Creating reservation with data:', req.body);
    // console.log('User ID from token:', userIdFromToken);

    // 1. 必須項目チェック
    if (!title || !date || !startTime || !endTime || !roomId /* || !effectiveUserId は上でチェック済み */) {
        console.error('Validation failed: Missing required fields. Received:', { title, date, startTime, endTime, roomId, userId: effectiveUserId });
        return res.status(400).json({ message: 'Missing required fields (title, date, startTime, endTime, roomId)' });
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
        userId: effectiveUserId,
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
