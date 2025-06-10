# ggl_ai_meeting-room-reservation

## 概要

- [Google AI Studio](https://aistudio.google.com/prompts/new_chat)を使用して作成
- ログイン機能
- 会議室予約システム


## 技術スタック

- フロントエンド
  - Vue3, Vite、Pinia
- バックエンド
  - Node.js（ネイティブ）→Expressに変更
- インフラ
  - 擬似モックデータを使用

## ファイル構成

### Backend

```
backend_express
├── data  // API用モックデータ
│   ├── branches.json
│   ├── equipment.json
│   ├── reservations.json
│   ├── rooms.json
│   └── users.json
├── mock-data.json
├── package-lock.json
├── package.json
└── server.js // Express管理用、モジュールデータ、ミドルウェア設定、APIエンドポイント設定

```

### Frontend

```
frontend
├── src
│   ├── assets
│   │   └── vue.svg
│   ├── components
│   │   ├── HelloWorld.vue
│   │   ├── ReservationModal.vue
│   │   └── RoomList.vue
│   ├── router
│   │   └── index.ts  // ページルーティング
│   ├── services
│   │   └── apiService.ts   // フロント側API処理
│   ├── stores    // 認証管理、バックエンドとの連携
│   │   ├── api.js
│   │   └── auth.js
│   ├── tests
│   │   └── unit
│   ├── types
│   │   └── index.ts
│   ├── views
│   │   ├── CalendarReservationView.vue
│   │   ├── DashboardView.vue
│   │   ├── HomeView.vue
│   │   ├── LoginView.vue
│   │   └── ReservationEditView.vue
│   ├── App_old.vue
│   ├── App.vue
│   ├── main.ts
│   ├── shims-vue.d.ts
│   ├── style.css
│   └── vite-env.d.ts
├── tests   // ユニットテスト
│   └── unit
│       ├── example.spec.ts
│       └── RoomList.spec.ts
├── .gitignore
├── index.html
├── jest.config.cjs
├── jest.setup.ts
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts


```