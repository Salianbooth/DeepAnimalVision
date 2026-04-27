<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import request from '@/api/request'
import CanvasViewer from '@/components/CanvasViewer.vue'
import DetectionList from '@/components/DetectionList.vue'
import StatCard from '@/components/StatCard.vue'
import {
  getAnimalCategory,
  getAnimalCategoryMeta,
  getAnimalCategoryMetaByLabel,
  type AnimalCategory,
} from '@/constants/animalCategories'
import { CLASS_COLOR_MAP } from '@/constants/classMap'
import { useHistoryStore } from '@/store/history'
import type { Detection } from '@/store/history'

interface RawDetection {
  class_id?: number
  label?: string
  confidence?: number
  bbox?: number[]
}

interface DetectionStat {
  label: string
  description: string
  count: number
  color: string
}

const DEFAULT_COLOR = '#8B5CF6'
const HIGHLIGHT_COLOR = '#F59E0B'
const MIN_SCALE = 0.2
const MAX_SCALE = 10

const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<Detection[]>([])
const imageUrl = ref<string | null>(null)
const imageObj = ref<HTMLImageElement | null>(null)
const loading = ref(false)
const activeIndex = ref<number | null>(null)
const previewObjectUrl = ref<string | null>(null)

const historyStore = useHistoryStore()

const transform = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
})

const detectionsCount = computed(() => detections.value.length)
const canvasZoomText = computed(() => `${Math.round(transform.scale * 100)}%`)
const activeDetection = computed(() =>
  activeIndex.value === null ? null : detections.value[activeIndex.value] || null,
)
const activeDetectionLabel = computed(() => activeDetection.value?.label || '未选中目标')
const activeDetectionCategory = computed(() =>
  activeDetection.value ? getAnimalCategoryMetaByLabel(activeDetection.value.label).name : '未分类',
)
const activeDetectionConfidence = computed(() =>
  activeDetection.value ? `${(activeDetection.value.confidence * 100).toFixed(1)}%` : '--',
)

const getDetectionColor = (classId: number) => CLASS_COLOR_MAP[classId] || DEFAULT_COLOR
const getFallbackLabel = (classId: number) => (classId >= 0 ? `class_${classId}` : 'unknown')

const categoryStats = computed<DetectionStat[]>(() => {
  const countMap: Partial<Record<AnimalCategory | 'unknown', number>> = {}

  detections.value.forEach(det => {
    const category = getAnimalCategory(det.label)
    countMap[category] = (countMap[category] || 0) + 1
  })

  return Object.entries(countMap)
    .map(([category, count]) => {
      const meta = getAnimalCategoryMeta(category as AnimalCategory | 'unknown')
      return {
        label: meta.name,
        description: meta.description,
        count: count || 0,
        color: meta.color,
      }
    })
    .sort((left, right) => right.count - left.count)
})

const normalizeDetections = (raw: RawDetection[] = []): Detection[] =>
  raw.map(det => ({
    class_id: det.class_id ?? -1,
    label:
      typeof det.label === 'string' && det.label.trim()
        ? det.label
        : getFallbackLabel(det.class_id ?? -1),
    confidence: det.confidence ?? 0,
    bbox: Array.isArray(det.bbox) ? det.bbox.slice(0, 4) : [0, 0, 0, 0],
  }))

const clearCanvas = () => {
  if (!canvasRef.value) return
  const context = canvasRef.value.getContext('2d')
  context?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

const revokePreviewObjectUrl = () => {
  if (!previewObjectUrl.value) return
  URL.revokeObjectURL(previewObjectUrl.value)
  previewObjectUrl.value = null
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const drawCanvas = () => {
  const canvas = canvasRef.value
  const img = imageObj.value

  if (!canvas || !img) return

  const context = canvas.getContext('2d')
  const wrapper = canvas.parentElement
  if (!context || !wrapper) return

  canvas.width = wrapper.clientWidth
  canvas.height = wrapper.clientHeight
  context.clearRect(0, 0, canvas.width, canvas.height)

  const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95
  const drawWidth = img.width * baseScale
  const drawHeight = img.height * baseScale
  const originX = -drawWidth / 2
  const originY = -drawHeight / 2

  context.save()
  context.translate(canvas.width / 2 + transform.offsetX, canvas.height / 2 + transform.offsetY)
  context.scale(transform.scale, transform.scale)
  context.drawImage(img, originX, originY, drawWidth, drawHeight)

  detections.value.forEach((det, index) => {
    const [rawX1 = 0, rawY1 = 0, rawX2 = 0, rawY2 = 0] = det.bbox
    const x1 = rawX1 * baseScale
    const y1 = rawY1 * baseScale
    const x2 = rawX2 * baseScale
    const y2 = rawY2 * baseScale
    const boxX = originX + x1
    const boxY = originY + y1
    const boxW = x2 - x1
    const boxH = y2 - y1
    const color = index === activeIndex.value ? HIGHLIGHT_COLOR : getDetectionColor(det.class_id)
    const labelText = `${det.label} ${(det.confidence * 100).toFixed(1)}%`
    const padding = 4 / transform.scale
    const textHeight = 16 / transform.scale

    context.strokeStyle = color
    context.lineWidth = 2 / transform.scale
    context.strokeRect(boxX, boxY, boxW, boxH)

    context.font = `${14 / transform.scale}px sans-serif`
    context.textBaseline = 'top'

    const textWidth = context.measureText(labelText).width

    context.fillStyle = color
    context.fillRect(
      boxX,
      boxY - textHeight - padding * 2,
      textWidth + padding * 2,
      textHeight + padding * 2,
    )

    context.fillStyle = '#fff'
    context.fillText(labelText, boxX + padding, boxY - textHeight - padding)
  })

  context.restore()
}

const resetTransform = () => {
  transform.scale = 1
  transform.offsetX = 0
  transform.offsetY = 0
  drawCanvas()
}

const setCanvasRef = (canvas: HTMLCanvasElement | null) => {
  canvasRef.value = canvas
  if (canvas && imageObj.value) {
    drawCanvas()
  }
}

const startDrag = (event: MouseEvent) => {
  if (!imageUrl.value) return
  transform.isDragging = true
  transform.startX = event.clientX - transform.offsetX
  transform.startY = event.clientY - transform.offsetY
}

const dragCanvas = (event: MouseEvent) => {
  if (!transform.isDragging) return
  transform.offsetX = event.clientX - transform.startX
  transform.offsetY = event.clientY - transform.startY
  drawCanvas()
}

const stopDrag = () => {
  transform.isDragging = false
}

const handleZoom = (delta: number) => {
  const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale + delta))
  if (nextScale === transform.scale) return
  transform.scale = nextScale
  drawCanvas()
}

const selectDetection = (index: number) => {
  activeIndex.value = index
  drawCanvas()
}

const saveAsImage = () => {
  if (!canvasRef.value) return
  const dataUrl = canvasRef.value.toDataURL('image/png')
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = `DeepAnimalVision_${Date.now()}.png`
  anchor.click()
}

const exportResult = () => {
  if (detections.value.length === 0) return

  const blob = new Blob(
    [
      JSON.stringify(
        {
          image: imageUrl.value,
          detections: detections.value,
          categories: categoryStats.value,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `DeepAnimalVision_${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

const handleUpload = async (file: File | null) => {
  if (!file) return

  const nextPreviewUrl = URL.createObjectURL(file)

  try {
    const img = await loadImage(nextPreviewUrl)
    revokePreviewObjectUrl()
    previewObjectUrl.value = nextPreviewUrl
    imageObj.value = img
    imageUrl.value = nextPreviewUrl
    detections.value = []
    activeIndex.value = null
    resetTransform()

    const formData = new FormData()
    formData.append('image', file)

    loading.value = true
    const response = await request.post('/detect/', formData)
    detections.value = normalizeDetections(response.data.detections)
    drawCanvas()
    await historyStore.fetchHistoryList()
  } catch (error) {
    URL.revokeObjectURL(nextPreviewUrl)
    console.error('图像识别失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', drawCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawCanvas)
  revokePreviewObjectUrl()
  clearCanvas()
})
</script>

<template>
  <div class="page">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">图像识别</p>
        <h1>动物识别与分类分析</h1>
        <p class="hero-text">上传图片后，系统会给出检测框、具体动物类别和动物大类分布。</p>
      </div>

      <div class="hero-status">
        <span class="status-chip">当前缩放 {{ canvasZoomText }}</span>
      </div>
    </section>

    <section class="summary-grid">
      <StatCard
        label="检测目标"
        :value="detectionsCount"
        accent="#0f766e"
        description="当前图像中识别到的目标数量。"
      />
      <StatCard
        label="当前选中"
        :value="activeDetectionLabel"
        accent="#1d4ed8"
        description="你在右侧结果列表中选中的具体动物。"
      />
      <StatCard
        label="选中目标大类"
        :value="activeDetectionCategory"
        accent="#b45309"
        description="当前选中目标所属的动物大类。"
      />
      <StatCard
        label="选中目标置信度"
        :value="activeDetectionConfidence"
        accent="#7c3aed"
        description="模型对当前选中目标的识别把握程度。"
      />
    </section>

    <section class="main-grid">
      <article class="panel canvas-panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">识别画布</p>
            <h2>目标框查看区</h2>
          </div>
          <span class="panel-note">支持拖拽、缩放、保存图片和导出 JSON。</span>
        </div>

        <CanvasViewer
          :image-url="imageUrl"
          :loading="loading"
          :is-dragging="transform.isDragging"
          :has-detections="detectionsCount > 0"
          @canvas-mounted="setCanvasRef"
          @zoom="handleZoom"
          @reset="resetTransform"
          @save="saveAsImage"
          @export="exportResult"
          @upload="handleUpload"
          @drag-start="startDrag"
          @drag="dragCanvas"
          @drag-end="stopDrag"
        />
      </article>

      <section class="side-column">
        <article class="panel compact-panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">分类概览</p>
              <h2>动物大类分布</h2>
            </div>
            <span class="count-badge">{{ categoryStats.length }}</span>
          </div>

          <div v-if="categoryStats.length > 0" class="category-grid">
            <div
              v-for="stat in categoryStats"
              :key="stat.label"
              class="category-item"
              :style="{ borderColor: `${stat.color}30` }"
            >
              <span class="category-dot" :style="{ background: stat.color }"></span>
              <div class="category-copy">
                <div class="category-head">
                  <strong>{{ stat.label }}</strong>
                  <span>{{ stat.count }} 个</span>
                </div>
                <p>{{ stat.description }}</p>
              </div>
            </div>
          </div>
          <p v-else class="empty-state">上传图像后，这里会展示动物大类分布。</p>
        </article>

        <DetectionList
          :detections="detections"
          :stats="categoryStats"
          :active-index="activeIndex"
          @select="selectDetection"
        />

        <article class="panel compact-panel note-panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">使用提示</p>
              <h2>怎么看结果</h2>
            </div>
          </div>

          <div class="note-list">
            <p>左侧画布显示检测框，点击右侧识别结果可以高亮对应目标。</p>
            <p>“动物大类分布”用于把识别结果按哺乳动物、鸟类、鱼类等更大的类别汇总展示。</p>
          </div>
        </article>
      </section>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 18px;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  padding: 28px;
  border-radius: 28px;
  background: linear-gradient(135deg, #0f2f33 0%, #16555b 55%, #6ea28f 100%);
  color: #f8fafc;
  box-shadow: 0 24px 60px rgba(15, 47, 51, 0.18);
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

.hero-panel h1 {
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

.hero-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 10px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(360px, 0.95fr);
  gap: 18px;
  align-items: start;
}

.side-column {
  display: grid;
  gap: 18px;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.canvas-panel {
  min-height: clamp(420px, 64vh, 760px);
}

.compact-panel {
  min-height: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-eyebrow {
  color: #94a3b8;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.panel-note {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.count-badge {
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.category-grid {
  display: grid;
  gap: 10px;
}

.category-item {
  display: flex;
  align-items: start;
  gap: 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 14px;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 6px;
  flex-shrink: 0;
}

.category-copy {
  display: grid;
  gap: 6px;
}

.category-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.category-head strong {
  color: #0f172a;
}

.category-head span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.category-copy p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.note-list {
  display: grid;
  gap: 10px;
}

.note-list p,
.empty-state {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 1320px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-panel {
    flex-direction: column;
    align-items: start;
    padding: 22px 18px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .category-head {
    flex-direction: column;
    align-items: start;
  }

  .panel {
    padding: 18px;
  }
}
</style>
