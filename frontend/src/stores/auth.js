// Vue 3 + Pinia ストアの認証管理
import { defineStore } from 'pinia';
import axios from 'axios'; // API通信用

const API_BASE_URL = 'http://localhost:3001'; // バックエンドAPIのURL

export const useAuthStore = defineStore('auth', {
  // ストアの状態を定義
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loginError: null,
    isLoading: false,
  }),

  // ストアの状態を初期化するためのアクション
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userName: (state) => state.user?.name || 'Guest',
    userRole: (state) => state.user?.role,
  },

  // ストアのアクションを定義
  actions: {
    async login(credentials) {
      this.isLoading = true;
      this.loginError = null;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        // トークンとユーザー情報をlocalStorageに保存
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // ログイン成功後、ダッシュボードなどに遷移するために true を返す
        return true;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.loginError = error.response.data.message;
        } else {
          this.loginError = 'An unexpected error occurred. Please try again.';
        }
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      // モックAPIには/auth/logoutがあるが、クライアント側での処理が主
      // axios.post(`${API_BASE_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${this.token}` }});

      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // ログアウト後、ログインページなどに遷移
      // これはルーター側で制御する
    },
    
    // アプリケーション起動時にlocalStorageから情報を読み込むアクション（main.jsで呼ぶなど）
    // 今回はstateの初期値でlocalStorageを参照しているので必須ではない
    initializeAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.token = token;
            this.user = JSON.parse(user);
        }
    }
  },
});
