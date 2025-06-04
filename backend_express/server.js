const express = require('express');
const cors = require('cors'); // CORSミドルウェアをインポート
const app = express();
const PORT = process.env.PORT || 3001; // バックエンドサーバーのポート

// ミドルウェアの設定
app.use(cors()); // すべてのオリジンからのリクエストを許可（開発用）
app.use(express.json()); // リクエストボディをJSONとしてパースする

// --- モックデータ ---
const mockUsers = [
    {
        id: 'u-001',
        email: 'test@example.com',
        password: 'password123', // 本来はハッシュ化されたパスワード
        name: 'テスト ユーザー',
        role: 'member', // 'admin' or 'member'
    },
    {
        id: 'u-002',
        email: 'admin@example.com',
        password: 'adminpassword',
        name: '管理者 ユーザー',
        role: 'admin',
    },
];

// --- APIエンドポイント ---

/**
 * ログインAPI (/auth/login)
 * POSTリクエスト
 * ボディ: { email: "...", password: "..." }
 */
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // モックユーザーデータから該当ユーザーを検索
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // パスワードの検証 (モックなので単純比較)
    if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 認証成功：ユーザー情報（パスワード除く）とモックトークンを返す
    // 本格的なJWT生成の場合は、jsonwebtokenライブラリを使用
    const mockToken = `mock-jwt-token-for-${user.id}-${Date.now()}`;

    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    res.status(200).json({
        message: 'Login successful',
        token: mockToken,
        user: userResponse,
    });
});

/**
 * ログアウトAPI (/auth/logout) - ダミー実装
 * POSTリクエスト
 */
app.post('/auth/logout', (req, res) => {
    // 実際のログアウト処理はクライアント側でトークンを破棄することが主
    // サーバー側でセッション管理している場合はここでセッション無効化など
    res.status(200).json({ message: 'Logged out successfully' });
});

// --- 他のモックAPIエンドポイント (例: /users) ---
// 必要に応じて、資料にある他のAPIのモックもここに追加できます。
// 例: GET /users
app.get('/users', (req, res) => {
    // 認証ミドルウェアを挟むのが理想だが、今回はモックなので省略
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token || !token.startsWith('mock-jwt-token')) {
    //     return res.status(401).json({ message: 'Unauthorized' });
    // }
    const usersForResponse = mockUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
    }));
    res.status(200).json(usersForResponse);
});


// サーバー起動
app.listen(PORT, () => {
    console.log(`Mock API server is running on http://localhost:${PORT}`);
});
