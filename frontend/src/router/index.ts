// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import CalendarReservationView from '../views/CalendarReservationView.vue';
import ReservationEditView from '../views/ReservationEditView.vue';

import RoomDetailView from '../views/RoomDetailView.vue'; // 新規追加
import ReservationCreateView from '../views/ReservationCreateView.vue'; // 新規追加

import { useAuthStore } from '../stores/auth'; // Piniaストアをインポート

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true } // ログイン済みユーザーはアクセスさせない (任意)
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }, // 認証が必要なルート
  },
  
  // 他のルート...
  {
    path: '/calendar-reservation',
    name: 'CalendarReservation',
    component: CalendarReservationView,
    meta: { requiresAuth: true } // 認証が必要なルート
  },
  {
    path: '/reservations/edit/:id', // :id で予約IDをパラメータとして受け取る
    name: 'ReservationEdit',
    component: ReservationEditView,
    meta: { requiresAuth: true },
    props: true // ルートパラメータをコンポーネントのpropsとして渡す
  },

  {
    path: '/rooms/:id', // :id で会議室IDをパラメータとして受け取る
    name: 'RoomDetail',
    component: RoomDetailView,
    meta: { requiresAuth: true },
    props: true // ルートパラメータをコンポーネントのpropsとして渡す
  },
  {
    path: '/reservations/new',
    name: 'ReservationCreate',
    component: ReservationCreateView,
    meta: { requiresAuth: true },
    // props: route => ({ date: route.query.date, roomId: route.query.roomId }) // カレンダーから渡す場合など
  },

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ナビゲーションガード
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Piniaストアが初期化される前にガードが動作するのを防ぐため、
  // アプリ起動時に initializeAuth() を呼ぶか、ここでトークンを直接確認する
  // if (!authStore.token && localStorage.getItem('token')) {
  //   authStore.initializeAuth(); // もしストアがまだ初期化されてなければ
  // }


  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 認証が必要なページで、未認証の場合
    next({ name: 'Login', query: { redirect: to.fullPath } }); // ログインページにリダイレクト、リダイレクト先をクエリに
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    // ログイン済みユーザー向けのページ（例：ログインページ）に、認証済みユーザーがアクセスした場合
    next({ name: 'Dashboard' }); // ダッシュボードなどにリダイレクト
  }
  else {
    next(); // それ以外は許可
  }
});

export default router;