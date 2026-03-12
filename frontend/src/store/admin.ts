import { defineStore } from 'pinia'

import {
  getAdminOverview,
  getAdminUsers,
  updateAdminUserRole,
  type AdminManagedUser,
  type AdminOverview,
} from '@/api/admin'

const emptyOverview = (): AdminOverview => ({
  summary: {
    total_users: 0,
    total_admins: 0,
    total_records: 0,
    total_detections: 0,
  },
  recent_users: [],
  recent_records: [],
  top_labels: [],
})

export const useAdminStore = defineStore('admin', {
  state: () => ({
    overview: emptyOverview(),
    users: [] as AdminManagedUser[],
    loading: false,
    usersLoading: false,
    updatingUserId: null as number | null,
    error: '',
    usersError: '',
  }),

  actions: {
    async fetchOverview() {
      this.loading = true
      this.error = ''

      try {
        const response = await getAdminOverview()
        this.overview = response.data
      } catch (error: any) {
        this.error = error?.response?.data?.error || '管理员数据加载失败'
      } finally {
        this.loading = false
      }
    },

    async fetchUsers() {
      this.usersLoading = true
      this.usersError = ''

      try {
        const response = await getAdminUsers()
        this.users = response.data.users
      } catch (error: any) {
        this.usersError = error?.response?.data?.error || '用户列表加载失败'
      } finally {
        this.usersLoading = false
      }
    },

    async changeUserRole(userId: number, role: AdminManagedUser['role']) {
      this.updatingUserId = userId
      this.usersError = ''

      try {
        const response = await updateAdminUserRole(userId, role)
        const nextUser = response.data.user
        this.users = this.users.map(user => (user.id === userId ? nextUser : user))
      } catch (error: any) {
        this.usersError = error?.response?.data?.error || '用户角色更新失败'
        throw error
      } finally {
        this.updatingUserId = null
      }
    },
  },
})
