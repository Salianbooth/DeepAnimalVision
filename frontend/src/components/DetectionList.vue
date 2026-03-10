<script setup lang="ts">
import { CLASS_COLOR_MAP } from '@/constants/classMap'
import type { Detection } from '@/store/history'

interface DetectionStat {
  label: string
  count: number
  color: string
}

defineProps<{
  detections: Detection[]
  stats: DetectionStat[]
  activeIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
}>()

const getDetectionColor = (classId: number) => CLASS_COLOR_MAP[classId] || '#8B5CF6'
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span>检测结果</span>
      <span v-if="detections.length > 0" class="badge">{{ detections.length }}</span>
    </div>

    <div class="card-body">
      <div v-if="stats.length > 0" class="stats">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-pill"
          :style="{ background: `${stat.color}20`, color: stat.color }"
        >
          {{ stat.label }} ({{ stat.count }})
        </div>
      </div>

      <div class="det-list">
        <div
          v-for="(det, index) in detections"
          :key="`${det.class_id}-${index}`"
          class="det-item"
          :class="{ active: activeIndex === index }"
          @click="emit('select', index)"
        >
          <i :style="{ background: getDetectionColor(det.class_id) }"></i>
          <span class="name">{{ det.label }}</span>
          <span class="conf">{{ (det.confidence * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <div v-if="detections.length === 0" class="empty">暂无检测结果</div>
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
  border-radius: 8px;
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 800;
}

.badge {
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  padding: 1px 6px;
  font-size: 9px;
}

.card-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  font-size: 12px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.stat-pill {
  border-radius: 18px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
}

.det-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.det-item {
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #f8fafc;
  padding: 8px;
  cursor: pointer;
}

.det-item.active {
  border-color: var(--primary);
  background: #eef2ff;
}

.det-item i {
  width: 4px;
  height: 12px;
  margin-right: 6px;
  border-radius: 2px;
}

.name {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
}

.conf {
  font-size: 11px;
  color: #94a3b8;
}

.empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
}
</style>
