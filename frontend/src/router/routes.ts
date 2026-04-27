import type { RouteRecordRaw } from 'vue-router'
import Login from '@/views/login/Login.vue'
import Register from '@/views/login/Register.vue'
import UserLayout from '@/views/user/UserLayout.vue'
import Home from '@/views/user/Home.vue'
import UserHistory from '@/views/user/History.vue'
import UserProfile from '@/views/user/Profile.vue'
import Dashboard from '@/views/admin/Dashboard.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/register',
    component: Register,
  },
  {
    path: '/user',
    component: UserLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/user/recognition',
      },
      {
        path: 'recognition',
        component: Home,
      },
      {
        path: 'history',
        component: UserHistory,
      },
      {
        path: 'profile',
        component: UserProfile,
      },
    ],
  },
  {
    path: '/admin',
    component: Dashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/',
    redirect: '/login',
  },
]
