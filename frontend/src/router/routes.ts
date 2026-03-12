import type { RouteRecordRaw } from 'vue-router'
import Login from '@/views/login/Login.vue'
import Register from '@/views/login/Register.vue'
import Home from '@/views/user/Home.vue'
import Dashboard from '@/views/admin/Dashboard.vue'

export const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        component: Login
    },
    {
        path: '/register',
        component: Register
    },
    {
        path: '/user',
        component: Home,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/',
        redirect: '/login'
    }
]
