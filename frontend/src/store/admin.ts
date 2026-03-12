import { defineStore } from 'pinia'

import {
  createAdminUser,
  deleteAdminUser,
  getAdminOverview,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
  type AdminCreateUserPayload,
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
    deletingUserId: null as number | null,
    creatingUser: false,
    resettingPasswordUserId: null as number | null,
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

    async createUser(payload: AdminCreateUserPayload) {
      this.creatingUser = true
      this.usersError = ''

      try {
        const response = await createAdminUser(payload)
        this.users = [response.data.user, ...this.users]
      } catch (error: any) {
        this.usersError = error?.response?.data?.error || '创建用户失败'
        throw error
      } finally {
        this.creatingUser = false
      }
    },

    async removeUser(userId: number) {
      this.deletingUserId = userId
      this.usersError = ''

      try {
        await deleteAdminUser(userId)
        this.users = this.users.filter(user => user.id !== userId)
      } catch (error: any) {
        this.usersError = error?.response?.data?.error || '删除用户失败'
        throw error
      } finally {
        this.deletingUserId = null
      }
    },

    async resetUserPassword(userId: number, password: string) {
      this.resettingPasswordUserId = userId
      this.usersError = ''

      try {
        await resetAdminUserPassword(userId, { password })
      } catch (error: any) {
        this.usersError = error?.response?.data?.error || '重置密码失败'
        throw error
      } finally {
        this.resettingPasswordUserId = null
      }
    },
  },
})
