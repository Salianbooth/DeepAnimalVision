<script setup lang="ts">
import type { HistoryItem } from '@/store/history'

defineProps<{
  items: HistoryItem[]
  activeRecordId: number | null
}>()

const emit = defineEmits<{
  (e: 'select', item: HistoryItem): void
  (e: 'delete', item: HistoryItem): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span>最近记录</span>
      <button v-if="items.length > 0" type="button" class="btn-clear-all" @click="emit('clear')">
        清空
      </button>
    </div>

    <div class="card-body">
      <div
        v-for="item in items"
        :key="item.id"
        class="item"
        :class="{ active: activeRecordId === item.id }"
        @click="emit('select', item)"
      >
        <div class="item-info">
          <span class="time">{{ item.time }}</span>
          <span>{{ item.count ?? 0 }} 个检测目标</span>
        </div>

        <button
          type="button"
          class="btn-delete"
          title="删除记录"
          @click.stop="emit('delete', item)"
        >
          ×
        </button>
      </div>

      <div v-if="items.length === 0" class="empty">暂无历史记录</div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.btn-clear-all {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: #fff;
  color: #475569;
  padding: 7px 12px;
  cursor: pointer;
}

.card-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  font-size: 12px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px 14px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.item.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(56, 189, 248, 0.1));
  box-shadow: 0 14px 26px rgba(15, 118, 110, 0.08);
}

.item:hover {
  transform: translateY(-1px);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.time {
  font-weight: 700;
  color: #0f172a;
}

.btn-delete {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #94a3b8;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.btn-delete:hover,
.btn-clear-all:hover {
  color: #0f172a;
}

.empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
}
</style>
