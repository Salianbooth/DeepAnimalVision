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

.badge {
  border-radius: 999px;
  background: linear-gradient(135deg, #0f766e 0%, #38bdf8 100%);
  color: #fff;
  padding: 5px 9px;
  font-size: 10px;
}

.card-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  font-size: 12px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.stat-pill {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
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
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px 14px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.det-item.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(56, 189, 248, 0.1));
  box-shadow: 0 14px 26px rgba(15, 118, 110, 0.08);
}

.det-item:hover {
  transform: translateY(-1px);
}

.det-item i {
  width: 6px;
  height: 18px;
  margin-right: 10px;
  border-radius: 999px;
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
