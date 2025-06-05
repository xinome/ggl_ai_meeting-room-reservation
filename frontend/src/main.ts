import { createApp } from 'vue'
import { createPinia } from 'pinia' // Piniaをインポート

import App from './App.vue'
import router from './router' // router.ts をインポート
// import { useAuthStore } from './stores/auth'; // 必要なら

// import './assets/main.css' // グローバルなスタイルがあれば

const app = createApp(App)

const pinia = createPinia() // Piniaインスタンスを作成
app.use(pinia) // Piniaをアプリケーションに登録

// アプリケーション起動時に認証情報を初期化 (任意、ストアの初期値でも対応可)
// const authStore = useAuthStore(); // Pinia を useした後でないと使えない
// authStore.initializeAuth();


app.use(router) // Vue Routerをアプリケーションに登録

app.mount('#app') // アプリケーションをマウント