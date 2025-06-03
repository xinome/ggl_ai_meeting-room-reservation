const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001; // フロントエンドとポートを分ける

// --- データストア (簡易的なインメモリ + ファイル読み書き) ---
let rooms = [];
let reservations = [];
const roomsPath = path.join(__dirname, 'data', 'rooms.json');
const reservationsPath = path.join(__dirname, 'data', 'reservations.json');

function loadData() {
    try {
        rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
        reservations = JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
        console.log("Data loaded successfully.");
    } catch (err) {
        console.error("Error loading data:", err);
        // 初期データがない場合は空配列で開始
        if (rooms.length === 0) {
          rooms = [
            { "id": "room1", "name": "会議室A", "capacity": 10, "equipment": ["プロジェクター", "ホワイトボード"] },
            { "id": "room2", "name": "会議室B", "capacity": 6, "equipment": ["モニター"] },
            { "id": "room3", "name": "小会議室C", "capacity": 4, "equipment": [] }
          ];
          fs.writeFileSync(roomsPath, JSON.stringify(rooms, null, 2), 'utf8');
        }
        if (reservations.length === 0) {
          reservations = [];
          fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2), 'utf8');
        }
    }
}

function saveData() {
    try {
        fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2), 'utf8');
        console.log("Reservations saved successfully.");
    } catch (err) {
        console.error("Error saving reservations:", err);
    }
}

loadData();

// --- サーバーロジック ---
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*'); // 開発用。本番では具体的に指定
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    res.setHeader('Content-Type', 'application/json');

    // --- API Routes ---
    if (pathname === '/api/rooms' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(rooms));
    } else if (pathname.startsWith('/api/rooms/') && method === 'GET') {
        const roomId = pathname.split('/')[3];
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            res.writeHead(200);
            res.end(JSON.stringify(room));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Room not found' }));
        }
    } else if (pathname === '/api/reservations' && method === 'GET') {
        // クエリパラメータでフィルタリング (例: ?roomId=room1&date=2024-03-15)
        const { roomId, date } = parsedUrl.query;
        let filteredReservations = [...reservations];

        if (roomId) {
            filteredReservations = filteredReservations.filter(r => r.roomId === roomId);
        }
        if (date) { // YYYY-MM-DD形式のdateを期待
            filteredReservations = filteredReservations.filter(r => r.startTime.startsWith(date));
        }
        res.writeHead(200);
        res.end(JSON.stringify(filteredReservations));

    } else if (pathname === '/api/reservations' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newReservation = JSON.parse(body);
                // TODO: バリデーションと重複チェック
                // 簡単な重複チェック（同じ部屋で時間が一部でも重なる予約はNG）
                const isConflict = reservations.some(existing =>
                    existing.roomId === newReservation.roomId &&
                    (
                        (new Date(newReservation.startTime) >= new Date(existing.startTime) && new Date(newReservation.startTime) < new Date(existing.endTime)) ||
                        (new Date(newReservation.endTime) > new Date(existing.startTime) && new Date(newReservation.endTime) <= new Date(existing.endTime)) ||
                        (new Date(newReservation.startTime) <= new Date(existing.startTime) && new Date(newReservation.endTime) >= new Date(existing.endTime))
                    )
                );

                if (isConflict) {
                    res.writeHead(409); // Conflict
                    res.end(JSON.stringify({ message: 'Reservation conflict' }));
                    return;
                }

                newReservation.id = `res${Date.now()}`; // 簡単なID生成
                reservations.push(newReservation);
                saveData();
                res.writeHead(201);
                res.end(JSON.stringify(newReservation));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON format' }));
            }
        });
    } else if (pathname.startsWith('/api/reservations/') && method === 'DELETE') {
        const reservationId = pathname.split('/')[3];
        const initialLength = reservations.length;
        reservations = reservations.filter(r => r.id !== reservationId);
        if (reservations.length < initialLength) {
            saveData();
            res.writeHead(204); // No Content
            res.end();
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Reservation not found' }));
        }
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
