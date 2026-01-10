<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import axios from 'axios'

/* ===== 核心状态 ===== */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<any[]>([])
const loading = ref(false)
const imageUrl = ref<string | null>(null)
const activeIndex = ref<number | null>(null)
const imageObj = ref<HTMLImageElement | null>(null)

// 变换状态：缩放和平移
const transform = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  startX: 0,
  startY: 0
})

type HistoryItem = {
  imageUrl: string
  detections: any[]
  time: string
}
const historyList = ref<HistoryItem[]>([])

/* ===== 配置映射 ===== */
const classMap: Record<number, string> = { 0: '人', 5: '公交车', 11: '停车标志' }
const colorMap: Record<number, string> = { 0: '#F43F5E', 5: '#3B82F6', 11: '#10B981' }

/* ===== 分类统计 ===== */
const stats = computed(() => {
  const map: Record<number, number> = {}
  detections.value.forEach(det => {
    map[det.class_id] = (map[det.class_id] || 0) + 1
  })
  return Object.keys(map).map(id => ({
    label: classMap[Number(id)] || `类别 ${id}`,
    count: map[Number(id)],
    color: colorMap[Number(id)] || '#8B5CF6'
  }))
})

/* ===== 缩放与平移逻辑 ===== */
const handleZoom = (delta: number) => {
  const newScale = transform.scale + delta
  if (newScale >= 0.2 && newScale <= 10) {
    transform.scale = newScale
    drawCanvas()
  }
}

const resetTransform = () => {
  transform.scale = 1
  transform.offsetX = 0
  transform.offsetY = 0
  drawCanvas()
}

const startDrag = (e: MouseEvent) => {
  if (!imageUrl.value) return
  transform.isDragging = true
  transform.startX = e.clientX - transform.offsetX
  transform.startY = e.clientY - transform.offsetY
}

const onDrag = (e: MouseEvent) => {
  if (!transform.isDragging) return
  transform.offsetX = e.clientX - transform.startX
  transform.offsetY = e.clientY - transform.startY
  drawCanvas()
}

const stopDrag = () => {
  transform.isDragging = false
}

/* ===== 功能函数 ===== */
const saveAsImage = () => {
  if (!canvasRef.value) return
  const link = document.createElement('a')
  link.download = `Result_${Date.now()}.jpg`
  link.href = canvasRef.value.toDataURL('image/jpeg', 0.9)
  link.click()
}

const exportResult = () => {
  const data = { time: new Date().toLocaleString(), detections: detections.value }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `data_${Date.now()}.json`
  a.click()
}

/* ===== 核心绘制逻辑 ===== */
const drawCanvas = () => {
  if (!canvasRef.value || !imageObj.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const img = imageObj.value
  const wrapper = canvas.parentElement!

  canvas.width = wrapper.clientWidth
  canvas.height = wrapper.clientHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 计算基础缩放比例 (Contain 模式)
  const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9

  ctx.save()
  // 应用变换：移至中心 -> 应用平移偏移 -> 应用缩放
  ctx.translate(canvas.width / 2 + transform.offsetX, canvas.height / 2 + transform.offsetY)
  ctx.scale(transform.scale, transform.scale)

  const drawW = img.width * baseScale
  const drawH = img.height * baseScale
  const x = -drawW / 2
  const y = -drawH / 2

  ctx.drawImage(img, x, y, drawW, drawH)

  // 绘制识别框
  detections.value.forEach((det, index) => {
    const [x1, y1, x2, y2] = det.bbox.map((v: number) => v * baseScale)
    const isActive = index === activeIndex.value
    const color = isActive ? '#F59E0B' : (colorMap[det.class_id] || '#8B5CF6')

    ctx.strokeStyle = color
    ctx.lineWidth = (isActive ? 4 : 2) / transform.scale // 线宽不随缩放变模糊
    ctx.strokeRect(x + x1, y + y1, x2 - x1, y2 - y1)

    // 绘制标签
    ctx.fillStyle = color
    const label = `${classMap[det.class_id] || '物体'} ${(det.confidence * 100).toFixed(0)}%`
    const fontSize = Math.max(10 / transform.scale, 8)
    ctx.font = `bold ${fontSize}px sans-serif`
    const txtWidth = ctx.measureText(label).width
    
    const tagH = 18 / transform.scale
    ctx.fillRect(x + x1, y + y1 - tagH, txtWidth + 4 / transform.scale, tagH)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, x + x1 + 2 / transform.scale, y + y1 - 4 / transform.scale)
  })
  ctx.restore()
}

/* ===== 交互处理 ===== */
const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  
  imageUrl.value = URL.createObjectURL(file)
  const img = new Image()
  img.src = imageUrl.value
  img.onload = async () => {
    imageObj.value = img
    resetTransform()
    
    const formData = new FormData()
    formData.append('image', file)
    loading.value = true
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/detect/', formData)
      detections.value = res.data.detections
      drawCanvas()
      historyList.value.unshift({ imageUrl: imageUrl.value!, detections: res.data.detections, time: new Date().toLocaleTimeString() })
    } catch (e) { alert('后端连接失败') }
    finally { loading.value = false }
  }
}

const loadHistory = (item: HistoryItem) => {
  const img = new Image()
  img.src = item.imageUrl
  img.onload = () => {
    imageObj.value = img
    detections.value = item.detections
    resetTransform()
  }
}

onMounted(() => {
  window.addEventListener('resize', drawCanvas)
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <div class="logo-box">🐾</div>
        <div class="title-group">
          <h1>DeepAnimalVision</h1>
          <p>AI 识别与细节分析控制台</p>
        </div>
      </div>
    </header>

    <main class="app-content">
      <section class="viewport-section">
        <div class="canvas-container" 
             @mousedown="startDrag" 
             @mousemove="onDrag" 
             @mouseup="stopDrag" 
             @mouseleave="stopDrag"
             :class="{ 'dragging': transform.isDragging }">
          
          <div class="floating-toolbar" v-if="imageUrl && !loading">
            <button @click="handleZoom(0.2)">🔍+</button>
            <button @click="handleZoom(-0.2)">🔍-</button>
            <button @click="resetTransform">🔄</button>
            <div class="v-line"></div>
            <button @click="saveAsImage" class="btn-save">💾 保存结果图</button>
          </div>

          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>正在分析高精图像...</p>
          </div>

          <canvas ref="canvasRef"></canvas>
          
          <div v-if="!imageUrl && !loading" class="canvas-placeholder">
            <div class="placeholder-content">
              <span class="icon">🖼️</span>
              <h3>准备就绪</h3>
              <p>请上传图像以激活 AI 检测</p>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <label class="btn-primary" :class="{ 'is-loading': loading }">
            <span>{{ loading ? '识别中...' : '📂 选择本地图像' }}</span>
            <input type="file" accept="image/*" @change="onFileChange" :disabled="loading" />
          </label>
          <button v-if="detections.length" @click="exportResult" class="btn-secondary">📥 导出 JSON</button>
        </div>
      </section>

      <aside class="sidebar-section">
        <div class="card history-card">
          <div class="card-header">历史记录</div>
          <div class="card-body">
            <div v-for="(item, idx) in historyList" :key="idx" class="item" @click="loadHistory(item)">
              <div class="item-info">
                <span class="time">{{ item.time }}</span>
                <span class="count">{{ item.detections.length }} 个目标</span>
              </div>
            </div>
            <div v-if="!historyList.length" class="empty">无记录</div>
          </div>
        </div>

        <div class="card result-card">
          <div class="card-header">
            检测结果
            <span class="badge" v-if="detections.length">{{ detections.length }}</span>
          </div>
          <div class="card-body">
            <div class="stats">
              <div v-for="s in stats" :key="s.label" class="stat-pill" :style="{ background: s.color + '20', color: s.color }">
                {{ s.label }} ({{ s.count }})
              </div>
            </div>
            <div class="det-list">
              <div v-for="(det, i) in detections" :key="i" class="det-item" :class="{ active: activeIndex === i }" @click="activeIndex = i; drawCanvas()">
                <i :style="{ background: colorMap[det.class_id] || '#8b5cf6' }"></i>
                <span class="name">{{ classMap[det.class_id] || '未知' }}</span>
                <span class="conf">{{ (det.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  --primary: #4f46e5;
  --bg: #f8fafc;
  --text: #1e293b;
  --border: #e2e8f0;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}

.app-header {
  background: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { background: #eef2ff; padding: 6px; border-radius: 8px; font-size: 20px; }
.title-group h1 { font-size: 16px; margin: 0; font-weight: 800; color: var(--primary); }
.title-group p { font-size: 11px; margin: 0; color: #64748b; }

.app-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  padding: 20px;
  min-height: 0;
}

.viewport-section { display: flex; flex-direction: column; gap: 16px; min-height: 0; }

.canvas-container {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  cursor: grab;
}
.canvas-container.dragging { cursor: grabbing; }

.floating-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  padding: 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}
.floating-toolbar button {
  border: none; background: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
}
.floating-toolbar button:hover { background: #f1f5f9; }
.v-line { width: 1px; height: 16px; background: var(--border); margin: 0 4px; }
.btn-save { color: var(--primary); }

canvas { width: 100%; height: 100%; display: block; }

.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.loading-spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.action-bar { display: flex; gap: 12px; }
.btn-primary { flex: 1; background: var(--primary); color: white; padding: 12px; border-radius: 10px; text-align: center; font-weight: 700; cursor: pointer; }
.btn-primary.is-loading { opacity: 0.7; }
.btn-primary input { display: none; }
.btn-secondary { background: white; border: 1px solid var(--border); padding: 0 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }

.sidebar-section { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
.card { background: white; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; min-height: 0; }
.history-card { flex: 0.35; }
.result-card { flex: 0.65; }
.card-header { padding: 14px 16px; font-size: 13px; font-weight: 800; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between; }
.card-body { flex: 1; overflow-y: auto; padding: 12px; }

.item { padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; cursor: pointer; font-size: 12px; }
.stats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.stat-pill { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.det-item { display: flex; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 6px; cursor: pointer; border: 1px solid transparent; }
.det-item.active { border-color: var(--primary); background: #eef2ff; }
.det-item i { width: 4px; height: 14px; border-radius: 2px; margin-right: 10px; }
.name { flex: 1; font-weight: 700; font-size: 13px; }
.conf { font-size: 12px; color: #64748b; }
.badge { background: var(--primary); color: white; padding: 1px 8px; border-radius: 10px; font-size: 10px; }
.empty { text-align: center; color: #94a3b8; padding: 20px; font-size: 12px; }

.canvas-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: #94a3b8; }
.icon { font-size: 40px; margin-bottom: 10px; display: block; opacity: 0.5; }
</style>