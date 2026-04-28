<template>
  <div class="admin-shell">
    <AppHeader :user-name="currentUserName" @logout="handleLogout" />

    <main class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-card">
          <p class="sidebar-eyebrow">Admin Workspace</p>
          <h2>管理面板</h2>
          <p class="sidebar-text">从这里查看总览数据、维护用户角色和管理后台入口。</p>
        </div>

        <nav class="sidebar-nav" aria-label="管理员导航">
          <button
            v-for="item in menuItems"
            :key="item.key"
            type="button"
            class="nav-item"
            :class="{ active: activeSection === item.key }"
            @click="activeSection = item.key"
          >
            <span class="nav-title">{{ item.label }}</span>
            <span class="nav-note">{{ item.note }}</span>
          </button>
        </nav>
      </aside>

      <section class="content-area">
        <template v-if="activeSection === 'overview'">
          <section class="hero hero-overview">
            <div class="hero-copy">
              <p class="eyebrow">Control Center</p>
              <h1>管理员总览</h1>
              <p class="hero-text">
                集中查看用户规模、识别记录增长、热门检测标签和最近活动。
              </p>
            </div>
            <button
              type="button"
              class="hero-action"
              :disabled="loading"
              @click="refreshOverview"
            >
              {{ loading ? '刷新中...' : '刷新总览' }}
            </button>
          </section>

          <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

          <section class="stat-grid">
            <StatCard
              label="普通用户"
              :value="summary.total_users"
              accent="#0f766e"
              description="当前系统内的普通用户数量。"
            />
            <StatCard
              label="管理员"
              :value="summary.total_admins"
              accent="#1d4ed8"
              description="具备后台权限的账号数量。"
            />
            <StatCard
              label="识别记录"
              :value="summary.total_records"
              accent="#b45309"
              description="累计保存到数据库的识别记录总数。"
            />
            <StatCard
              label="检测目标"
              :value="summary.total_detections"
              accent="#7c3aed"
              description="所有记录中的检测框累计数量。"
            />
          </section>

          <section class="panel-grid">
            <article class="panel">
              <div class="panel-header">
                <div>
                  <p class="panel-eyebrow">Recent Users</p>
                  <h2>最近注册用户</h2>
                </div>
              </div>

              <div v-if="recentUsers.length > 0" class="user-list">
                <div v-for="user in recentUsers" :key="user.id" class="user-item">
                  <div>
                    <strong>{{ user.username }}</strong>
                    <p>{{ user.joined_at }}</p>
                  </div>
                  <span class="role-badge" :class="user.role">{{ user.role }}</span>
                </div>
              </div>
              <p v-else class="empty-state">暂无用户数据</p>
            </article>

            <article class="panel">
              <div class="panel-header">
                <div>
                  <p class="panel-eyebrow">Popular Labels</p>
                  <h2>热门检测标签</h2>
                </div>
              </div>

              <div v-if="topLabels.length > 0" class="label-list">
                <div v-for="label in topLabels" :key="label.label" class="label-item">
                  <div class="label-meta">
                    <strong>{{ label.label }}</strong>
                    <span>{{ label.count }} 次</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: `${getLabelWidth(label.count)}%` }"></div>
                  </div>
                </div>
              </div>
              <p v-else class="empty-state">暂无标签统计</p>
            </article>
          </section>

          <section class="panel full-width">
            <div class="panel-header">
              <div>
                <p class="panel-eyebrow">Recent Records</p>
                <h2>最近识别记录</h2>
              </div>
            </div>

            <div v-if="recentRecords.length > 0" class="record-table">
              <div class="record-head">
                <span>记录 ID</span>
                <span>用户</span>
                <span>时间</span>
                <span>检测数</span>
              </div>

              <div v-for="record in recentRecords" :key="record.id" class="record-row">
                <span>#{{ record.id }}</span>
                <span>{{ record.username }}</span>
                <span>{{ record.created_at }}</span>
                <span>{{ record.detection_count }}</span>
              </div>
            </div>
            <p v-else class="empty-state">暂无识别记录</p>
          </section>
        </template>

        <template v-else-if="activeSection === 'users'">
          <section class="hero hero-users">
            <div class="hero-copy">
              <p class="eyebrow">User Management</p>
              <h1>用户管理</h1>
              <p class="hero-text">
                查看当前账户、筛选角色，并在普通用户与管理员之间切换权限。
              </p>
            </div>
            <div class="hero-btns">
              <button type="button" class="hero-action" @click="openCreateDialog">
                + 创建用户
              </button>
              <button
                type="button"
                class="hero-action"
                :disabled="usersLoading"
                @click="refreshUsers"
              >
                {{ usersLoading ? '刷新中...' : '刷新用户' }}
              </button>
            </div>
          </section>

          <p v-if="usersError" class="error-banner">{{ usersError }}</p>

          <section class="filter-bar">
            <label class="search-box">
              <span>搜索</span>
              <input v-model.trim="searchKeyword" type="text" placeholder="按用户名搜索" />
            </label>

            <div class="filter-pills">
              <button
                v-for="option in roleFilters"
                :key="option.value"
                type="button"
                class="filter-pill"
                :class="{ active: roleFilter === option.value }"
                @click="roleFilter = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </section>

          <section class="panel full-width">
            <div class="panel-header users-header">
              <div>
                <p class="panel-eyebrow">Users</p>
                <h2>全部用户</h2>
              </div>
              <span class="count-badge">{{ filteredUsers.length }}</span>
            </div>

            <div v-if="filteredUsers.length > 0" class="users-table">
              <div class="users-head">
                <span>用户名</span>
                <span>角色</span>
                <span>识别记录</span>
                <span>加入时间</span>
                <span>操作</span>
              </div>

              <div v-for="user in filteredUsers" :key="user.id" class="users-row">
                <div class="user-cell user-name">
                  <strong>{{ user.username }}</strong>
                  <span v-if="user.id === currentUserId" class="self-tag">当前账号</span>
                </div>
                <span class="role-badge" :class="user.role">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </span>
                <span>{{ user.record_count }}</span>
                <span>{{ user.joined_at }}</span>
                <div class="action-group">
                  <button
                    type="button"
                    class="manage-btn"
                    :disabled="
                      updatingUserId === user.id ||
                      deletingUserId === user.id ||
                      resettingPasswordUserId === user.id
                    "
                    @click="openManageDialog(user)"
                  >
                    管理
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="empty-state">没有符合条件的用户</p>
          </section>
        </template>

        <template v-else>
          <section class="hero hero-soon">
            <div class="hero-copy">
              <p class="eyebrow">Soon</p>
              <h1>更多后台功能</h1>
              <p class="hero-text">
                这里预留给后续的系统配置、模型管理或审计日志模块。
              </p>
            </div>
          </section>
        </template>

        <!-- 所有弹窗 -->
        <Teleport to="body">
          <!-- 创建用户弹窗 -->
          <div v-if="createDialog.visible" class="dialog-mask" @click.self="closeCreateDialog">
            <div class="dialog-box dialog-form" role="dialog" aria-modal="true">
              <div class="dialog-head">
                <div class="dialog-icon icon-create">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                    <line x1="12" y1="14" x2="12" y2="20"/>
                    <line x1="9" y1="17" x2="15" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h3>创建用户</h3>
                  <p>填写信息后新建一个账户</p>
                </div>
                <button type="button" class="dialog-close" @click="closeCreateDialog">✕</button>
              </div>
              <form @submit.prevent="handleCreateUser">
                <div class="form-fields">
                  <label class="field">
                    <span>用户名</span>
                    <input v-model.trim="createDialog.username" type="text" placeholder="输入用户名" autocomplete="off" />
                  </label>
                  <label class="field">
                    <span>密码</span>
                    <input v-model="createDialog.password" type="password" placeholder="输入初始密码" autocomplete="new-password" />
                  </label>
                  <label class="field">
                    <span>角色</span>
                    <select v-model="createDialog.role">
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </label>
                </div>
                <div class="dialog-actions">
                  <button type="button" class="dialog-cancel" @click="closeCreateDialog">取消</button>
                  <button type="submit" class="dialog-primary" :disabled="creatingUser">
                    {{ creatingUser ? '创建中...' : '创建用户' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 管理用户弹窗 -->
          <div v-if="manageDialog.visible" class="dialog-mask" @click.self="closeManageDialog">
            <div class="dialog-box dialog-form" role="dialog" aria-modal="true">
              <div class="dialog-head">
                <div class="dialog-icon icon-manage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3>{{ manageDialog.user?.username }}</h3>
                  <p>管理该用户的角色与权限</p>
                </div>
                <button type="button" class="dialog-close" @click="closeManageDialog">✕</button>
              </div>

              <div class="manage-section">
                <p class="manage-label">当前角色</p>
                <div class="role-switch">
                  <button
                    type="button"
                    class="role-switch-btn"
                    :class="{ active: manageDialog.user?.role === 'user' }"
                    :disabled="manageDialog.user?.role === 'user' || updatingUserId === manageDialog.user?.id || manageDialog.user?.id === currentUserId"
                    @click="changeRole('user')"
                  >
                    普通用户
                  </button>
                  <button
                    type="button"
                    class="role-switch-btn admin"
                    :class="{ active: manageDialog.user?.role === 'admin' }"
                    :disabled="manageDialog.user?.role === 'admin' || updatingUserId === manageDialog.user?.id"
                    @click="changeRole('admin')"
                  >
                    管理员
                  </button>
                </div>
                <p v-if="manageDialog.user?.id === currentUserId" class="manage-hint">当前账号无法降权</p>
              </div>

              <div class="manage-section">
                <p class="manage-label">重置密码</p>
                <div v-if="!manageDialog.showPasswordField" class="password-toggle">
                  <button type="button" class="ghost-btn" @click="manageDialog.showPasswordField = true">
                    点击设置新密码
                  </button>
                </div>
                <div v-else class="password-row">
                  <input
                    v-model="manageDialog.newPassword"
                    type="password"
                    placeholder="输入新密码"
                    autocomplete="new-password"
                    class="password-input"
                  />
                  <button
                    type="button"
                    class="dialog-primary"
                    :disabled="resettingPasswordUserId === manageDialog.user?.id"
                    @click="handleResetPassword"
                  >
                    {{ resettingPasswordUserId === manageDialog.user?.id ? '重置中...' : '确认重置' }}
                  </button>
                </div>
              </div>

              <div class="dialog-footer">
                <button
                  type="button"
                  class="dialog-danger"
                  :disabled="deletingUserId === manageDialog.user?.id || manageDialog.user?.id === currentUserId"
                  @click="deleteUser"
                >
                  {{ deletingUserId === manageDialog.user?.id ? '删除中...' : '删除用户' }}
                </button>
                <button type="button" class="dialog-cancel" @click="closeManageDialog">关闭</button>
              </div>
            </div>
          </div>

          <!-- 删除确认弹窗 -->
          <div v-if="confirmDialog.visible" class="dialog-mask" @click.self="cancelConfirm">
            <div class="dialog-box" role="alertdialog" aria-modal="true">
              <div class="dialog-icon icon-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="dialog-body">
                <h3>{{ confirmDialog.title }}</h3>
                <p>{{ confirmDialog.message }}</p>
              </div>
              <div class="dialog-actions">
                <button type="button" class="dialog-cancel" @click="cancelConfirm">取消</button>
                <button type="button" class="dialog-confirm" :disabled="confirmDialog.submitting" @click="confirmAction">
                  {{ confirmDialog.submitting ? '删除中...' : '确认删除' }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppHeader from '@/components/Header.vue'
import StatCard from '@/components/StatCard.vue'
import { useAdminStore } from '@/store/admin'
import type { AdminManagedUser } from '@/api/admin'

type AdminSection = 'overview' | 'users' | 'system'
type RoleFilter = 'all' | 'admin' | 'user'

const menuItems: Array<{ key: AdminSection; label: string; note: string }> = [
  { key: 'overview', label: '总览概况', note: '统计数据和近期活动' },
  { key: 'users', label: '用户管理', note: '查看用户并调整角色' },
  { key: 'system', label: '系统占位', note: '为后续模块预留入口' },
]

const roleFilters: Array<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: '全部角色' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
]

const router = useRouter()
const adminStore = useAdminStore()
const {
  overview,
  users,
  loading,
  usersLoading,
  updatingUserId,
  deletingUserId,
  creatingUser,
  resettingPasswordUserId,
  error,
  usersError,
} =
  storeToRefs(adminStore)

const currentUserName = ref('')
const currentUserId = ref<number | null>(null)
const activeSection = ref<AdminSection>('overview')
const searchKeyword = ref('')
const roleFilter = ref<RoleFilter>('all')

const summary = computed(() => overview.value.summary)
const recentUsers = computed(() => overview.value.recent_users)
const recentRecords = computed(() => overview.value.recent_records)
const topLabels = computed(() => overview.value.top_labels)
const errorMessage = computed(() => error.value)

const maxLabelCount = computed(() =>
  topLabels.value.reduce((max, item) => Math.max(max, item.count), 0),
)

const filteredUsers = computed(() => {
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(user => {
    const matchesKeyword = keyword ? user.username.toLowerCase().includes(keyword) : true
    const matchesRole = roleFilter.value === 'all' ? true : user.role === roleFilter.value
    return matchesKeyword && matchesRole
  })
})

const getLabelWidth = (count: number) => {
  if (maxLabelCount.value === 0) return 0
  return Math.max(16, Math.round((count / maxLabelCount.value) * 100))
}

const refreshOverview = async () => {
  await adminStore.fetchOverview()
}

const refreshUsers = async () => {
  await adminStore.fetchUsers()
}

// ── 创建用户弹窗 ──────────────────────────────────────────
const createDialog = ref({
  visible: false,
  username: '',
  password: '',
  role: 'user' as AdminManagedUser['role'],
})

const openCreateDialog = () => {
  createDialog.value = { visible: true, username: '', password: '', role: 'user' }
}
const closeCreateDialog = () => {
  createDialog.value.visible = false
}
const handleCreateUser = async () => {
  if (!createDialog.value.username || !createDialog.value.password) {
    adminStore.usersError = '请填写用户名和密码'
    return
  }
  try {
    await adminStore.createUser({
      username: createDialog.value.username,
      password: createDialog.value.password,
      role: createDialog.value.role,
    })
    closeCreateDialog()
    await adminStore.fetchOverview()
  } catch {
    // errors are surfaced through the store
  }
}

// ── 管理用户弹窗（角色 + 重置密码 + 删除） ───────────────
const manageDialog = ref<{
  visible: boolean
  user: AdminManagedUser | null
  newPassword: string
  showPasswordField: boolean
}>({
  visible: false,
  user: null,
  newPassword: '',
  showPasswordField: false,
})

const openManageDialog = (user: AdminManagedUser) => {
  manageDialog.value = { visible: true, user, newPassword: '', showPasswordField: false }
}
const closeManageDialog = () => {
  manageDialog.value.visible = false
}

const changeRole = async (role: AdminManagedUser['role']) => {
  if (!manageDialog.value.user) return
  try {
    await adminStore.changeUserRole(manageDialog.value.user.id, role)
    manageDialog.value.user = { ...manageDialog.value.user, role }
    await adminStore.fetchOverview()
  } catch {
    // errors are surfaced through the store
  }
}

const handleResetPassword = async () => {
  if (!manageDialog.value.user || !manageDialog.value.newPassword) {
    adminStore.usersError = '请输入新密码'
    return
  }
  try {
    await adminStore.resetUserPassword(manageDialog.value.user.id, manageDialog.value.newPassword)
    manageDialog.value.newPassword = ''
    manageDialog.value.showPasswordField = false
  } catch {
    // errors are surfaced through the store
  }
}

// ── 删除确认弹窗 ──────────────────────────────────────────
const confirmDialog = ref<{
  visible: boolean
  title: string
  message: string
  onConfirm: (() => Promise<void>) | null
  submitting: boolean
}>({
  visible: false,
  title: '',
  message: '',
  onConfirm: null,
  submitting: false,
})

const cancelConfirm = () => {
  confirmDialog.value.visible = false
  confirmDialog.value.onConfirm = null
}

const confirmAction = async () => {
  if (!confirmDialog.value.onConfirm) return
  confirmDialog.value.submitting = true
  await confirmDialog.value.onConfirm()
  confirmDialog.value.submitting = false
  cancelConfirm()
}

const deleteUser = () => {
  const user = manageDialog.value.user
  if (!user) return
  confirmDialog.value = {
    visible: true,
    title: '删除用户',
    message: `确认删除用户 "${user.username}" 吗？该操作不可恢复。`,
    submitting: false,
    onConfirm: async () => {
      try {
        await adminStore.removeUser(user.id)
        closeManageDialog()
        await adminStore.fetchOverview()
      } catch {
        // errors are surfaced through the store
      }
    },
  }
}

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(async () => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  currentUserName.value = typeof user?.username === 'string' ? user.username : ''
  currentUserId.value = typeof user?.id === 'number' ? user.id : null

  await Promise.all([refreshOverview(), refreshUsers()])
})
</script>

<style scoped>
.admin-shell {
  --primary: #0f766e;
  --border: rgba(148, 163, 184, 0.22);
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 32%),
    radial-gradient(circle at right 20%, rgba(191, 219, 254, 0.42), transparent 26%),
    linear-gradient(180deg, #f7fafc 0%, #eef4f7 100%);
}

.admin-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  padding: 20px;
  align-items: start;
}

.sidebar {
  display: grid;
  gap: 16px;
  align-self: start;
  position: sticky;
  top: 20px;
}

.sidebar-card,
.sidebar-nav,
.panel {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.sidebar-card {
  padding: 22px;
}

.sidebar-eyebrow,
.eyebrow,
.panel-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.sidebar-eyebrow,
.panel-eyebrow {
  color: #94a3b8;
}

.sidebar-card h2 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 28px;
}

.sidebar-text {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.nav-item {
  display: grid;
  gap: 4px;
  border: none;
  border-radius: 18px;
  background: transparent;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover {
  background: #f8fafc;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(56, 189, 248, 0.1));
  transform: translateX(2px);
}

.nav-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.nav-note {
  color: #64748b;
  font-size: 12px;
}

.content-area {
  display: grid;
  gap: 18px;
  min-width: 0;
  align-content: start;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  padding: 28px;
  border-radius: 28px;
  color: #f8fafc;
  box-shadow: 0 24px 60px rgba(15, 47, 51, 0.18);
}

.hero-overview {
  background: linear-gradient(135deg, #0f2f33 0%, #16555b 55%, #6ea28f 100%);
}

.hero-users {
  background: linear-gradient(135deg, #172554 0%, #1d4ed8 45%, #60a5fa 100%);
}

.hero-soon {
  background: linear-gradient(135deg, #3f3f46 0%, #52525b 55%, #a1a1aa 100%);
}

.eyebrow {
  color: rgba(248, 250, 252, 0.74);
}

.hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1;
}

.hero-text {
  max-width: 680px;
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(248, 250, 252, 0.88);
}

.hero-action {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.hero-action:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.error-banner {
  margin: 0;
  border: 1px solid rgba(234, 88, 12, 0.18);
  border-radius: 16px;
  background: rgba(255, 237, 213, 0.9);
  color: #c2410c;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.panel {
  padding: 22px;
}

.full-width {
  width: 100%;
}

.panel-header {
  margin-bottom: 18px;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.user-list,
.label-list {
  display: grid;
  gap: 12px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px 16px;
}

.user-item strong,
.label-meta strong,
.user-name strong {
  display: block;
  color: #0f172a;
}

.user-item p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.role-badge.admin {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.role-badge.user {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.label-item {
  display: grid;
  gap: 8px;
}

.label-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: #475569;
  font-size: 13px;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e 0%, #38bdf8 100%);
}

.record-table,
.users-table {
  display: grid;
  gap: 10px;
}

.record-head,
.record-row {
  display: grid;
  grid-template-columns: 110px 1fr 1.4fr 100px;
  gap: 12px;
  align-items: center;
}

.users-head,
.users-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 120px 110px 1.3fr minmax(220px, 1fr);
  gap: 12px;
  align-items: center;
}

.record-head,
.users-head {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-row,
.users-row {
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px 16px;
  color: #0f172a;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.search-box input {
  min-width: 260px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 14px;
  color: #0f172a;
}

.search-box input:focus {
  outline: none;
  border-color: rgba(15, 118, 110, 0.4);
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
}

.filter-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #475569;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.filter-pill.active {
  border-color: rgba(15, 118, 110, 0.22);
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.count-badge,
.self-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.count-badge {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  padding: 6px 10px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.self-tag {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  padding: 4px 8px;
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.manage-btn {
  border: 1px solid rgba(15, 118, 110, 0.22);
  border-radius: 12px;
  background: #fff;
  color: #0f766e;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.manage-btn:hover {
  background: rgba(15, 118, 110, 0.06);
}

.manage-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.empty-state {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  animation: fade-in 0.15s ease;
}

.dialog-box {
  width: min(460px, calc(100vw - 32px));
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22);
  padding: 28px;
  display: grid;
  gap: 20px;
  animation: slide-up 0.18s ease;
}

.dialog-form {
  width: min(520px, calc(100vw - 32px));
}

.dialog-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-head > div {
  flex: 1;
  min-width: 0;
}

.dialog-head h3 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-head p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.dialog-close {
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  width: 32px;
  height: 32px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  background: #e2e8f0;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-icon svg {
  width: 24px;
  height: 24px;
}

.icon-create {
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
}

.icon-manage {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.icon-danger {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

.form-fields {
  display: grid;
  gap: 14px;
  margin-bottom: 6px;
}

.field {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 14px;
  color: #0f172a;
  font-size: 14px;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: rgba(15, 118, 110, 0.4);
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
}

.manage-section {
  border-top: 1px solid var(--border);
  padding-top: 16px;
  display: grid;
  gap: 10px;
}

.manage-label {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.manage-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.role-switch {
  display: flex;
  gap: 8px;
}

.role-switch-btn {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.role-switch-btn.active {
  background: rgba(15, 118, 110, 0.1);
  border-color: rgba(15, 118, 110, 0.3);
  color: #0f766e;
}

.role-switch-btn.admin.active {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.3);
  color: #1d4ed8;
}

.role-switch-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.password-toggle {
  display: flex;
}

.ghost-btn {
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.ghost-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.password-row {
  display: flex;
  gap: 10px;
}

.password-input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  padding: 10px 14px;
  font-size: 14px;
  color: #0f172a;
  min-width: 0;
}

.password-input:focus {
  outline: none;
  border-color: rgba(15, 118, 110, 0.4);
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.dialog-body h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 18px;
}

.dialog-body p {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-cancel {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background: #fff;
  color: #475569;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.dialog-cancel:hover {
  background: #f8fafc;
}

.dialog-primary {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #0f766e 0%, #38bdf8 100%);
  color: #fff;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.dialog-primary:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.dialog-confirm {
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 12px;
  background: #dc2626;
  color: #fff;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.dialog-confirm:hover {
  background: #b91c1c;
}

.dialog-confirm:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.dialog-danger {
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 12px;
  background: transparent;
  color: #dc2626;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.dialog-danger:hover {
  background: rgba(220, 38, 38, 0.06);
}

.dialog-danger:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.hero-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@keyframes fade-in {
  from { opacity: 0 }
  to   { opacity: 1 }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px) }
  to   { opacity: 1; transform: translateY(0) }
}

@media (max-width: 1280px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }

  .users-head,
  .users-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .sidebar-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-height: 860px) {
  .admin-layout {
    padding: 14px;
    gap: 14px;
  }

  .hero {
    padding: 22px 20px;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .admin-layout {
    padding: 12px;
  }

  .hero {
    flex-direction: column;
    align-items: start;
    padding: 22px 18px;
  }

  .stat-grid,
  .sidebar-nav {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }

  .record-head,
  .users-head {
    display: none;
  }

  .record-row {
    grid-template-columns: 1fr 1fr;
  }

  .search-box input {
    min-width: 0;
    width: 100%;
  }
}
</style>
