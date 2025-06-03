import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  // 必要に応じて他のルートを追加
  // {
  //   path: '/my-reservations',
  //   name: 'MyReservations',
  //   component: () => import('./views/MyReservationsView.vue') // 遅延読み込み
  // }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;