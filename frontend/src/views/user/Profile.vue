<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'

import StatCard from '@/components/StatCard.vue'
import { useHistoryStore } from '@/store/history'

const historyStore = useHistoryStore()
const { historyList } = storeToRefs(historyStore)

const userName = ref('当前用户')
const userRole = ref('user')
const userId = ref<number | null>(null)
const userRoleText = computed(() => (userRole.value === 'admin' ? '管理员' : '普通用户'))

const totalRecords = computed(() => historyList.value.length)
const totalDetections = computed(() =>
  historyList.value.reduce((sum, item) => sum + (item.count ?? 0), 0),
)
const latestRecord = computed(() => historyList.value[0]?.time || '暂无记录')
const averageDetections = computed(() => {
  if (historyList.value.length === 0) return 0
  return (totalDetections.value / historyList.value.length).toFixed(1)
})

onMounted(async () => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  userName.value = typeof user?.username === 'string' ? user.username : '当前用户'
  userRole.value = typeof user?.role === 'string' ? user.role : 'user'
  userId.value = typeof user?.id === 'number' ? user.id : null

  if (historyList.value.length === 0) {
    await historyStore.fetchHistoryList()
  }
})
</script>

<template>
  <div class="page">
    <section class="hero hero-profile">
      <div class="hero-copy">
        <p class="eyebrow">个人中心</p>
        <h1>账号信息与使用概览</h1>
        <p class="hero-text">
          这里汇总了你的账号身份、识别使用情况以及常用工作入口，便于快速回到图像识别或历史记录页面。
        </p>
      </div>
    </section>

    <section class="summary-grid">
      <StatCard
        label="用户编号"
        :value="userId ?? '--'"
        accent="#0f766e"
        description="当前登录账号在系统中的唯一标识。"
      />
      <StatCard
        label="账号角色"
        :value="userRoleText"
        accent="#1d4ed8"
        description="当前账号拥有的工作台访问权限角色。"
      />
      <StatCard
        label="保存记录"
        :value="totalRecords"
        accent="#b45309"
        description="已经累计保存到系统中的识别记录数量。"
      />
      <StatCard
        label="平均识别数"
        :value="averageDetections"
        accent="#7c3aed"
        description="每条记录平均包含的检测目标数量。"
      />
    </section>

    <section class="profile-layout">
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">账号概览</p>
            <h2>{{ userName }}</h2>
          </div>
          <span class="role-chip">{{ userRoleText }}</span>
        </div>

        <div class="account-grid">
          <div class="account-item">
            <span class="account-label">用户名</span>
            <strong>{{ userName }}</strong>
          </div>
          <div class="account-item">
            <span class="account-label">角色身份</span>
            <strong>{{ userRoleText }}</strong>
          </div>
          <div class="account-item">
            <span class="account-label">最近一次识别</span>
            <strong>{{ latestRecord }}</strong>
          </div>
          <div class="account-item">
            <span class="account-label">累计检测目标</span>
            <strong>{{ totalDetections }}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">快捷入口</p>
            <h2>继续工作</h2>
          </div>
        </div>

        <RouterLink to="/user/recognition" class="link-card">
          <strong>返回图像识别</strong>
          <span>继续上传图片，查看目标框、动物类别和上层分类说明。</span>
        </RouterLink>

        <RouterLink to="/user/history" class="link-card">
          <strong>查看历史记录</strong>
          <span>回看已保存的图像、识别结果和分类统计信息。</span>
        </RouterLink>

        <div class="link-card muted-card">
          <strong>后续可继续扩展</strong>
          <span>后面可以在这里加入修改密码、头像设置、个性化偏好等功能。</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 18px;
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

.hero-profile {
  background: linear-gradient(135deg, #3f3f46 0%, #52525b 55%, #a1a1aa 100%);
}

.eyebrow,
.panel-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
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
  max-width: 720px;
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(248, 250, 252, 0.88);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.panel {
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
}

.panel-eyebrow {
  color: #94a3b8;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.role-chip {
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.account-item,
.link-card {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
}

.account-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.account-item strong,
.link-card strong {
  color: #0f172a;
}

.link-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.link-card span {
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.muted-card {
  background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profile-layout,
  .account-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero {
    padding: 22px 18px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }
}
</style>
