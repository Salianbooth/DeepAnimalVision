import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null

    // 需要登录，但没登录
    if (to.meta.requiresAuth && !user) {
        next('/login')
        return
    }

    // 需要管理员，但不是管理员
    if (to.meta.requiresAdmin && user?.role !== 'admin') {
        next('/user')
        return
    }

    next()
})

export default router
