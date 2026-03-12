<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  imageUrl: string | null
  loading: boolean
  isDragging: boolean
  hasDetections: boolean
}>()

const emit = defineEmits<{
  (e: 'canvas-mounted', canvas: HTMLCanvasElement | null): void
  (e: 'zoom', delta: number): void
  (e: 'reset'): void
  (e: 'save'): void
  (e: 'export'): void
  (e: 'upload', file: File | null): void
  (e: 'drag-start', event: MouseEvent): void
  (e: 'drag', event: MouseEvent): void
  (e: 'drag-end'): void
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  emit('upload', input.files?.[0] ?? null)
  input.value = ''
}

onMounted(() => {
  emit('canvas-mounted', canvasEl.value)
})
</script>

<template>
  <section class="viewport-section">
    <div
      class="canvas-container"
      :class="{ dragging: props.isDragging }"
      @mousedown="emit('drag-start', $event)"
      @mousemove="emit('drag', $event)"
      @mouseup="emit('drag-end')"
      @mouseleave="emit('drag-end')"
    >
      <div v-if="props.imageUrl && !props.loading" class="floating-toolbar">
        <button type="button" @click="emit('zoom', 0.2)">+</button>
        <button type="button" @click="emit('zoom', -0.2)">-</button>
        <button type="button" @click="emit('reset')">Reset</button>
        <div class="v-line"></div>
        <button type="button" class="btn-save" @click="emit('save')">Save</button>
      </div>

      <div v-if="props.loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>正在分析图像...</p>
      </div>

      <canvas ref="canvasEl"></canvas>

      <div v-if="!props.imageUrl && !props.loading" class="canvas-placeholder">
        <div class="placeholder-content">
          <span class="icon">IMG</span>
          <h3>准备就绪</h3>
          <p>请上传图像以开始检测</p>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <label class="btn-primary" :class="{ 'is-loading': props.loading }">
        <span>{{ props.loading ? '识别中...' : '选择本地图像' }}</span>
        <input type="file" accept="image/*" :disabled="props.loading" @change="handleFileChange" />
      </label>
      <button
        v-if="props.hasDetections"
        type="button"
        class="btn-secondary"
        @click="emit('export')"
      >
        导出 JSON
      </button>
    </div>
  </section>
</template>

<style scoped>
.viewport-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.canvas-container {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.06), transparent 22%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  cursor: grab;
  min-height: clamp(320px, 50vh, 520px);
}

.canvas-container.dragging {
  cursor: grabbing;
}

.floating-toolbar {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgb(255 255 255 / 88%);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.floating-toolbar button {
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a;
}

.floating-toolbar button:hover {
  border-color: rgba(148, 163, 184, 0.18);
  background: #f8fafc;
}

.btn-save {
  color: var(--primary);
}

.v-line {
  width: 1px;
  height: 14px;
  background: var(--border);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 78%);
}

.loading-spinner {
  width: 34px;
  height: 34px;
  margin-bottom: 12px;
  border: 3px solid #dbe4ea;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94a3b8;
}

.placeholder-content h3,
.placeholder-content p {
  margin: 0;
}

.placeholder-content h3 {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 24px;
}

.icon {
  display: block;
  margin-bottom: 12px;
  font-size: 32px;
  font-weight: 700;
  opacity: 0.5;
  letter-spacing: 0.08em;
}

.action-bar {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btn-primary {
  flex: 1;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f766e 0%, #38bdf8 100%);
  color: #fff;
  padding: 14px 18px;
  text-align: center;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 28px rgba(15, 118, 110, 0.2);
}

.btn-primary.is-loading {
  opacity: 0.7;
}

.btn-primary input {
  display: none;
}

.btn-secondary {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  padding: 0 18px;
  font-weight: 600;
  cursor: pointer;
  color: #334155;
}

@media (max-width: 720px) {
  .canvas-container {
    min-height: clamp(280px, 42vh, 400px);
  }

  .action-bar {
    flex-direction: column;
  }
}
</style>
