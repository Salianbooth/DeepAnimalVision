<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppHeader from '@/components/Header.vue'
import { useHistoryStore } from '@/store/history'

const menuItems = [
  {
    to: '/user/recognition',
    label: '图像识别',
    note: '上传图片并查看识别与分类结果',
  },
  {
    to: '/user/history',
    label: '历史记录',
    note: '查看历史识别记录与详情',
  },
  {
    to: '/user/profile',
    label: '个人中心',
    note: '查看账号信息和使用统计',
  },
]

const router = useRouter()
const historyStore = useHistoryStore()
const { historyList } = storeToRefs(historyStore)

const currentUserName = ref('')
const currentUserRole = ref('user')
const currentUserRoleText = computed(() => (currentUserRole.value === 'admin' ? '管理员' : '普通用户'))

const latestRecordTime = computed(() => historyList.value[0]?.time || '暂无记录')
const totalRecords = computed(() => historyList.value.length)
const totalDetections = computed(() =>
  historyList.value.reduce((sum, item) => sum + (item.count ?? 0), 0),
)

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(async () => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  currentUserName.value = typeof user?.username === 'string' ? user.username : ''
  currentUserRole.value = typeof user?.role === 'string' ? user.role : 'user'

  if (historyList.value.length === 0) {
    await historyStore.fetchHistoryList()
  }
})
</script>

<template>
  <div class="workspace-shell">
    <AppHeader :user-name="currentUserName" @logout="handleLogout" />

    <main class="workspace-layout">
      <aside class="sidebar">
        <div class="sidebar-card">
          <p class="sidebar-eyebrow">用户工作台</p>
          <h2>{{ currentUserName || '当前用户' }}</h2>
          <p class="sidebar-text">
            上传图像、查看动物分类结果、回看历史记录，并管理个人账号信息。
          </p>
          <span class="role-chip">{{ currentUserRoleText }}</span>
        </div>

        <nav class="sidebar-nav" aria-label="用户导航">
          <RouterLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-title">{{ item.label }}</span>
            <span class="nav-note">{{ item.note }}</span>
          </RouterLink>
        </nav>

        <div class="sidebar-card status-card">
          <p class="sidebar-eyebrow">工作台状态</p>
          <div class="status-row">
            <span>最近记录</span>
            <strong>{{ latestRecordTime }}</strong>
          </div>
          <div class="status-row">
            <span>累计记录</span>
            <strong>{{ totalRecords }}</strong>
          </div>
          <div class="status-row">
            <span>累计检测</span>
            <strong>{{ totalDetections }}</strong>
          </div>
          <div class="status-row">
            <span>当前模型</span>
            <strong>best (1).pt</strong>
          </div>
        </div>
      </aside>

      <section class="content-area">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<style scoped>
.workspace-shell {
  --primary: #0f766e;
  --border: rgba(148, 163, 184, 0.22);
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 32%),
    radial-gradient(circle at right 20%, rgba(191, 219, 254, 0.42), transparent 26%),
    linear-gradient(180deg, #f7fafc 0%, #eef4f7 100%);
}

.workspace-layout {
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
.sidebar-nav {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.sidebar-card {
  display: grid;
  gap: 12px;
  padding: 22px;
}

.sidebar-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}

.sidebar-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.sidebar-text {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.role-chip {
  width: fit-content;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.nav-item {
  display: grid;
  gap: 4px;
  border-radius: 18px;
  padding: 14px 16px;
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

.status-card {
  gap: 10px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.status-row strong {
  color: #0f172a;
  text-align: right;
}

.content-area {
  display: grid;
  gap: 18px;
  min-width: 0;
  align-content: start;
}

@media (max-width: 980px) {
  .workspace-layout {
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
  .workspace-layout {
    padding: 14px;
    gap: 14px;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .workspace-layout {
    padding: 12px;
  }

  .sidebar-nav {
    grid-template-columns: 1fr;
  }
}
</style>
