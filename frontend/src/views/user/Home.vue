<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import request, { API_ORIGIN } from '@/api/request'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/Header.vue'
import CanvasViewer from '@/components/CanvasViewer.vue'
import DetectionList from '@/components/DetectionList.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
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

    <main class="app-content">
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
    </main>
  </div>
</template>

<style scoped>
:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.app-shell {
  --primary: #4f46e5;
  --border: #d1d5db;
  min-height: 100vh;
  background: #fff;
  color: #1e293b;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}

.app-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
}

.sidebar-section {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 4px;
}

* {
  box-sizing: border-box;
}
</style>
