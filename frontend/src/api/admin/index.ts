import request from '@/api/request'

export interface AdminSummary {
  total_users: number
  total_admins: number
  total_records: number
  total_detections: number
}

export interface AdminRecentUser {
  id: number
  username: string
  role: string
  joined_at: string
}

export interface AdminRecentRecord {
  id: number
  username: string
  image: string
  created_at: string
  detection_count: number
}

export interface AdminTopLabel {
  label: string
  count: number
}

export interface AdminManagedUser {
  id: number
  username: string
  role: 'user' | 'admin'
  is_active: boolean
  joined_at: string
  record_count: number
}

export interface AdminOverview {
  summary: AdminSummary
  recent_users: AdminRecentUser[]
  recent_records: AdminRecentRecord[]
  top_labels: AdminTopLabel[]
}

export const getAdminOverview = () => request.get<AdminOverview>('/admin/overview/')

export const getAdminUsers = () =>
  request.get<{ users: AdminManagedUser[] }>('/admin/users/')

export const updateAdminUserRole = (userId: number, role: AdminManagedUser['role']) =>
  request.patch<{ user: AdminManagedUser }>(`/admin/users/${userId}/role/`, { role })
