import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // router.ts をインポート

const app = createApp(App)
app.use(router) // ルーターをアプリケーションに登録
app.mount('#app')