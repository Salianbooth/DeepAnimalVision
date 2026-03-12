<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import request, { API_ORIGIN } from '@/api/request'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Header.vue'
import CanvasViewer from '@/components/CanvasViewer.vue'
import DetectionList from '@/components/DetectionList.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import StatCard from '@/components/StatCard.vue'
import { CLASS_COLOR_MAP, CLASS_TEXT_MAP } from '@/constants/classMap'
import { useHistoryStore } from '@/store/history'
import type { Detection, HistoryItem } from '@/store/history'

interface RawDetection {
  class_id?: number
  confidence?: number
  bbox?: number[]
}

interface DetectionStat {
  label: string
  count: number
  color: string
}

const DEFAULT_COLOR = '#8B5CF6'
const HIGHLIGHT_COLOR = '#F59E0B'
const MIN_SCALE = 0.2
const MAX_SCALE = 10

const router = useRouter()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<Detection[]>([])
const imageUrl = ref<string | null>(null)
const imageObj = ref<HTMLImageElement | null>(null)
const loading = ref(false)
const activeIndex = ref<number | null>(null)
const selectedRecordId = ref<number | null>(null)
const previewObjectUrl = ref<string | null>(null)
const currentUserName = ref('')

const historyStore = useHistoryStore()
const { historyList } = storeToRefs(historyStore)

const transform = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
})

const detectionsCount = computed(() => detections.value.length)
const historyCount = computed(() => historyList.value.length)
const canvasZoomText = computed(() => `${Math.round(transform.scale * 100)}%`)
const activeDetectionLabel = computed(() => {
  if (activeIndex.value === null) return '未选中目标'
  return detections.value[activeIndex.value]?.label || '未选中目标'
})
const latestHistoryTime = computed(() => historyList.value[0]?.time || '暂无记录')

const getDetectionLabel = (classId: number) => CLASS_TEXT_MAP[classId] || '未知'
const getDetectionColor = (classId: number) => CLASS_COLOR_MAP[classId] || DEFAULT_COLOR

const stats = computed<DetectionStat[]>(() => {
  const countMap: Record<number, number> = {}

  detections.value.forEach(det => {
    if (det.class_id >= 0) {
      countMap[det.class_id] = (countMap[det.class_id] || 0) + 1
    }
  })

  return Object.entries(countMap).map(([classId, count]) => {
    const id = Number(classId)
    return {
      label: getDetectionLabel(id),
      count,
      color: getDetectionColor(id),
    }
  })
})

const normalizeDetections = (raw: RawDetection[] = []): Detection[] =>
  raw.map(det => ({
    class_id: det.class_id ?? -1,
    label: getDetectionLabel(det.class_id ?? -1),
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

const loadImage = (src: string, isRemote = false) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    if (isRemote) {
      img.crossOrigin = 'anonymous'
    }
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

const clearCanvasState = () => {
  revokePreviewObjectUrl()
  detections.value = []
  imageUrl.value = null
  imageObj.value = null
  activeIndex.value = null
  transform.scale = 1
  transform.offsetX = 0
  transform.offsetY = 0
  transform.isDragging = false
  clearCanvas()
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

const loadRecords = async () => {
  await historyStore.fetchHistoryList()
}

const loadHistory = async (item: Pick<HistoryItem, 'id'>) => {
  try {
    const record = await historyStore.fetchRecordDetail(item.id)
    const remoteImageUrl = `${API_ORIGIN}${record.image}`
    const img = await loadImage(remoteImageUrl, true)

    revokePreviewObjectUrl()
    detections.value = normalizeDetections(record.detections)
    imageObj.value = img
    imageUrl.value = remoteImageUrl
    activeIndex.value = null
    selectedRecordId.value = item.id
    resetTransform()
  } catch (error) {
    console.error('加载历史记录失败', error)
  }
}

const deleteHistory = async (item: Pick<HistoryItem, 'id'>) => {
  if (!window.confirm('确认删除该历史记录吗？')) return

  const shouldClearCanvas = selectedRecordId.value === item.id
  await historyStore.removeRecord(item.id)

  if (shouldClearCanvas) {
    selectedRecordId.value = null
    clearCanvasState()
  }
}

const clearAllHistory = async () => {
  if (!window.confirm('确认清空所有历史记录吗？该操作不可恢复')) return

  await historyStore.clearAll()
  selectedRecordId.value = null
  clearCanvasState()
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
    selectedRecordId.value = null
    resetTransform()

    const formData = new FormData()
    formData.append('image', file)

    loading.value = true
    const response = await request.post('/detect/', formData)
    detections.value = normalizeDetections(response.data.detections)
    drawCanvas()
    await loadRecords()
  } catch (error) {
    URL.revokeObjectURL(nextPreviewUrl)
    console.error('图片识别失败', error)
  } finally {
    loading.value = false
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
  await loadRecords()
  window.addEventListener('resize', drawCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawCanvas)
  revokePreviewObjectUrl()
})
</script>

<template>
  <div class="app-shell">
    <AppHeader :user-name="currentUserName" @logout="handleLogout" />

    <main class="page-body">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">User Workspace</p>
          <h1>动物识别工作台</h1>
          <p class="hero-text">
            上传图像、查看检测框、回放历史记录，并把当前识别结果导出为结构化数据。
          </p>
        </div>

        <div class="hero-status">
          <span class="status-chip">当前缩放 {{ canvasZoomText }}</span>
          <span class="status-chip subtle">最近记录 {{ latestHistoryTime }}</span>
        </div>
      </section>

      <section class="summary-grid">
        <StatCard
          label="历史记录"
          :value="historyCount"
          accent="#0f766e"
          description="你已保存到系统中的识别历史数量。"
        />
        <StatCard
          label="当前目标"
          :value="detectionsCount"
          accent="#1d4ed8"
          description="当前画布图像中识别到的目标总数。"
        />
        <StatCard
          label="高亮目标"
          :value="activeDetectionLabel"
          accent="#b45309"
          description="右侧选中的检测结果会在画布中联动高亮。"
        />
        <StatCard
          label="工作状态"
          :value="loading ? '识别中' : '就绪'"
          accent="#7c3aed"
          description="上传图像后会自动请求后端并刷新历史面板。"
        />
      </section>

      <section class="workspace-grid">
        <div class="workspace-main">
          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-eyebrow">Canvas Workspace</p>
                <h2>识别画布</h2>
              </div>
              <span class="panel-note">支持拖拽、缩放、导出结果图与 JSON</span>
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
        </div>

        <aside class="sidebar-section">
          <HistoryPanel
            :items="historyList"
            :active-record-id="selectedRecordId"
            @select="loadHistory"
            @delete="deleteHistory"
            @clear="clearAllHistory"
          />

          <DetectionList
            :detections="detections"
            :stats="stats"
            :active-index="activeIndex"
            @select="selectDetection"
          />
        </aside>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #fff;
}

.app-shell {
  --primary: #0f766e;
  --border: rgba(148, 163, 184, 0.22);
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 32%),
    radial-gradient(circle at right 24%, rgba(191, 219, 254, 0.4), transparent 26%),
    linear-gradient(180deg, #f7fafc 0%, #eef4f7 100%);
  color: #1e293b;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}

.page-body {
  display: grid;
  gap: 18px;
  padding: 20px;
  align-content: start;
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
  max-width: 700px;
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

.status-chip.subtle {
  color: rgba(248, 250, 252, 0.82);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.workspace-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.workspace-main,
.sidebar-section {
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: clamp(360px, 58vh, 720px);
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

.sidebar-section {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 18px;
}

* {
  box-sizing: border-box;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 860px) {
  .page-body {
    padding: 14px;
    gap: 14px;
  }

  .hero-panel {
    padding: 22px 20px;
  }

  .panel {
    min-height: clamp(320px, 52vh, 560px);
  }
}

@media (max-width: 720px) {
  .page-body {
    padding: 12px;
  }

  .hero-panel {
    flex-direction: column;
    align-items: start;
    padding: 22px 18px;
  }

  .hero-status,
  .summary-grid {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
    padding: 18px;
  }

  .panel-header {
    flex-direction: column;
    align-items: start;
  }
}
</style>
