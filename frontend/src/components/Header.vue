<script setup lang="ts">
defineProps<{
  userName?: string
}>()

const emit = defineEmits<{
  (e: 'logout'): void
}>()
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <div class="logo-box">AI</div>
      <div class="title-group">
        <h1>DeepAnimalVision</h1>
        <p>AI 识别与细节分析控制台</p>
      </div>
    </div>

    <div v-if="userName" class="header-actions">
      <span class="user-chip">{{ userName }}</span>
      <button type="button" class="logout-button" @click="emit('logout')">
        退出
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-box {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.16), rgba(56, 189, 248, 0.16));
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.title-group h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
}

.title-group p {
  margin: 0;
  font-size: 10px;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-chip {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #475569;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.logout-button {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #334155;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.logout-button:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}
</style>
