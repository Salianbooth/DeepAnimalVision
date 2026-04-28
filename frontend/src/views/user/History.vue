<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import DetectionList from '@/components/DetectionList.vue'
import StatCard from '@/components/StatCard.vue'
import {
  getAnimalCategory,
  getAnimalCategoryMeta,
  type AnimalCategory,
} from '@/constants/animalCategories'
import { CLASS_COLOR_MAP } from '@/constants/classMap'
import { useHistoryStore } from '@/store/history'
import type { HistoryItem, RecordDetail } from '@/store/history'

interface DetectionStat {
  label: string
  description: string
  count: number
  color: string
}

const DEFAULT_COLOR = '#8B5CF6'
const HIGHLIGHT_COLOR = '#F59E0B'

const historyStore = useHistoryStore()
const { historyList } = storeToRefs(historyStore)

const searchKeyword = ref('')
const selectedRecordId = ref<number | null>(null)
const activeDetectionIndex = ref<number | null>(null)
const selectedRecord = ref<RecordDetail | null>(null)
const historyCanvasRef = ref<HTMLCanvasElement | null>(null)
const historyImageObj = ref<HTMLImageElement | null>(null)

const filteredRecords = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return historyList.value

  return historyList.value.filter(item => {
    const time = item.time.toLowerCase()
    return time.includes(keyword) || String(item.id).includes(keyword)
  })
})

const categoryStats = computed<DetectionStat[]>(() => {
  const countMap: Partial<Record<AnimalCategory | 'unknown', number>> = {}

  ;(selectedRecord.value?.detections || []).forEach(det => {
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

const dominantCategory = computed(() => categoryStats.value[0]?.label || '暂无')
const selectedDetections = computed(() => selectedRecord.value?.detections || [])

const getDetectionColor = (classId: number) => CLASS_COLOR_MAP[classId] || DEFAULT_COLOR

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const clearHistoryCanvas = () => {
  if (!historyCanvasRef.value) return
  const context = historyCanvasRef.value.getContext('2d')
  context?.clearRect(0, 0, historyCanvasRef.value.width, historyCanvasRef.value.height)
}

const drawHistoryCanvas = () => {
  const canvas = historyCanvasRef.value
  const img = historyImageObj.value

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
  const originX = (canvas.width - drawWidth) / 2
  const originY = (canvas.height - drawHeight) / 2

  context.drawImage(img, originX, originY, drawWidth, drawHeight)

  selectedDetections.value.forEach((det, index) => {
    const [rawX1 = 0, rawY1 = 0, rawX2 = 0, rawY2 = 0] = det.bbox
    const x1 = originX + rawX1 * baseScale
    const y1 = originY + rawY1 * baseScale
    const x2 = originX + rawX2 * baseScale
    const y2 = originY + rawY2 * baseScale
    const boxW = x2 - x1
    const boxH = y2 - y1
    const color = index === activeDetectionIndex.value ? HIGHLIGHT_COLOR : getDetectionColor(det.class_id)
    const labelText = `${det.label} ${(det.confidence * 100).toFixed(1)}%`

    context.strokeStyle = color
    context.lineWidth = index === activeDetectionIndex.value ? 3 : 2
    context.strokeRect(x1, y1, boxW, boxH)

    context.font = '14px sans-serif'
    context.textBaseline = 'top'

    const textWidth = context.measureText(labelText).width
    context.fillStyle = color
    context.fillRect(x1, Math.max(0, y1 - 24), textWidth + 10, 22)

    context.fillStyle = '#fff'
    context.fillText(labelText, x1 + 5, Math.max(2, y1 - 21))
  })
}

const selectRecord = async (item: Pick<HistoryItem, 'id'>) => {
  const detail = await historyStore.fetchRecordDetail(item.id)
  selectedRecord.value = detail
  selectedRecordId.value = item.id
  activeDetectionIndex.value = null

  if (!detail.image) {
    historyImageObj.value = null
    clearHistoryCanvas()
    return
  }

  try {
    const img = await loadImage(`http://${window.location.hostname}:8000${detail.image}`)
    historyImageObj.value = img
    drawHistoryCanvas()
  } catch (error) {
    console.error('加载历史图像失败', error)
  }
}

const handleSelectDetection = (index: number) => {
  activeDetectionIndex.value = index
  drawHistoryCanvas()
}

const deleteRecord = async (item: HistoryItem) => {
  if (!window.confirm(`确认删除历史记录 #${item.id} 吗？`)) return

  await historyStore.removeRecord(item.id)

  if (selectedRecordId.value === item.id) {
    selectedRecord.value = null
    selectedRecordId.value = null
    activeDetectionIndex.value = null
    historyImageObj.value = null
    clearHistoryCanvas()

    const firstRecord = historyList.value[0]
    if (firstRecord) {
      await selectRecord(firstRecord)
    }
  }
}

const clearAll = async () => {
  if (!window.confirm('确认清空全部历史记录吗？该操作不可恢复。')) return

  await historyStore.clearAll()
  selectedRecord.value = null
  selectedRecordId.value = null
  activeDetectionIndex.value = null
  historyImageObj.value = null
  clearHistoryCanvas()
}

onMounted(async () => {
  await historyStore.fetchHistoryList()

  const firstRecord = historyList.value[0]
  if (firstRecord) {
    await selectRecord(firstRecord)
  }

  window.addEventListener('resize', drawHistoryCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawHistoryCanvas)
})
</script>

<template>
  <div class="page">
    <section class="hero hero-history">
      <div class="hero-copy">
        <p class="eyebrow">历史记录</p>
        <h1>识别记录与结果回放</h1>
        <p class="hero-text">选中任意一条记录后，可以直接查看对应图像上的检测框与分类结果。</p>
      </div>
    </section>

    <section class="summary-grid">
      <StatCard
        label="历史记录"
        :value="historyList.length"
        accent="#0f766e"
        description="当前账号下已经保存的识别记录数量。"
      />
      <StatCard
        label="当前记录目标"
        :value="selectedDetections.length"
        accent="#1d4ed8"
        description="当前选中记录中包含的检测目标数量。"
      />
      <StatCard
        label="主要分类"
        :value="dominantCategory"
        accent="#b45309"
        description="当前记录中出现最多的动物大类。"
      />
      <StatCard
        label="最近识别时间"
        :value="historyList[0]?.time || '暂无记录'"
        accent="#7c3aed"
        description="最近一条识别记录保存到系统的时间。"
      />
    </section>

    <section class="history-layout">
      <aside class="panel list-panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">记录列表</p>
            <h2>历史识别记录</h2>
          </div>
          <button v-if="historyList.length > 0" type="button" class="ghost-button" @click="clearAll">
            清空全部
          </button>
        </div>

        <label class="search-box">
          <span>按记录编号或时间搜索</span>
          <input v-model.trim="searchKeyword" type="text" placeholder="例如 2026-04-25" />
        </label>

        <div v-if="filteredRecords.length > 0" class="record-list">
          <article
            v-for="item in filteredRecords"
            :key="item.id"
            class="record-item"
            :class="{ active: selectedRecordId === item.id }"
            @click="selectRecord(item)"
          >
            <div class="record-copy">
              <strong>记录 #{{ item.id }}</strong>
              <span>{{ item.time }}</span>
              <span>{{ item.count ?? 0 }} 个检测目标</span>
            </div>
            <span class="record-actions" @click.stop>
              <span class="record-badge">{{ item.count ?? 0 }}</span>
              <button type="button" class="delete-button" title="删除记录" @click="deleteRecord(item)">
                x
              </button>
            </span>
          </article>
        </div>
        <p v-else class="empty-state">没有符合条件的历史记录。</p>
      </aside>

      <section class="detail-column">
        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">结果回放</p>
              <h2>{{ selectedRecordId ? `历史记录 #${selectedRecordId}` : '请选择一条记录' }}</h2>
            </div>
            <span class="detail-note">{{ selectedRecord?.time || '尚未选择记录' }}</span>
          </div>

          <div class="replay-stage">
            <canvas ref="historyCanvasRef"></canvas>
            <div v-if="!selectedRecord" class="canvas-placeholder">
              <p>请选择一条历史记录查看检测框回放。</p>
            </div>
          </div>

          <div v-if="selectedRecord" class="detail-meta">
            <div class="meta-card">
              <span class="meta-label">检测数量</span>
              <strong>{{ selectedDetections.length }}</strong>
            </div>
            <div class="meta-card">
              <span class="meta-label">主要大类</span>
              <strong>{{ dominantCategory }}</strong>
            </div>
          </div>
        </article>

        <article class="panel compact-panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">分类统计</p>
              <h2>动物大类分布</h2>
            </div>
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
          <p v-else class="empty-state">当前记录暂无可展示的分类信息。</p>
        </article>

        <DetectionList
          :detections="selectedDetections"
          :stats="categoryStats"
          :active-index="activeDetectionIndex"
          @select="handleSelectDetection"
        />
      </section>
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

.hero-history {
  background: linear-gradient(135deg, #172554 0%, #1d4ed8 45%, #60a5fa 100%);
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

.history-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.detail-column {
  display: grid;
  gap: 18px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.compact-panel {
  min-height: auto;
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

.ghost-button {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  color: #475569;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.search-box {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.search-box input {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 14px;
  color: #0f172a;
}

.record-list {
  display: grid;
  gap: 10px;
  max-height: 840px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 14px;
  cursor: pointer;
}

.record-item.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(56, 189, 248, 0.1));
  box-shadow: 0 14px 26px rgba(15, 118, 110, 0.08);
}

.record-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.record-copy strong {
  color: #0f172a;
}

.record-copy span {
  color: #64748b;
  font-size: 12px;
}

.record-actions {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.record-badge {
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
}

.delete-button {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #94a3b8;
  width: 28px;
  height: 28px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.detail-note {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.replay-stage {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.06), transparent 22%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.replay-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}

.detail-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-card {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  background: #f8fafc;
  padding: 16px;
}

.meta-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.meta-card strong {
  color: #0f172a;
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

.category-copy p,
.empty-state {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .history-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero {
    padding: 22px 18px;
  }

  .summary-grid,
  .detail-meta {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }

  .panel-header,
  .category-head {
    flex-direction: column;
    align-items: start;
  }

  .record-item {
    flex-direction: column;
    align-items: start;
  }

  .record-actions {
    grid-auto-flow: column;
  }
}
</style>
