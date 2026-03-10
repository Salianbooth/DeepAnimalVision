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
  gap: 4px;
  min-height: 0;
}

.canvas-container {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  cursor: grab;
}

.canvas-container.dragging {
  cursor: grabbing;
}

.floating-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgb(255 255 255 / 90%);
  backdrop-filter: blur(8px);
}

.floating-toolbar button {
  border: none;
  border-radius: 6px;
  background: transparent;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.floating-toolbar button:hover {
  background: #f1f5f9;
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
  background: rgb(255 255 255 / 82%);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  margin-bottom: 10px;
  border: 3px solid #e2e8f0;
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
  margin-bottom: 4px;
  color: #334155;
}

.icon {
  display: block;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 700;
  opacity: 0.5;
  letter-spacing: 0.08em;
}

.action-bar {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn-primary {
  flex: 1;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  padding: 10px;
  text-align: center;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary.is-loading {
  opacity: 0.7;
}

.btn-primary input {
  display: none;
}

.btn-secondary {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  padding: 0 18px;
  font-weight: 600;
  cursor: pointer;
}
</style>
