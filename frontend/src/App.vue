<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

/* ===== 逻辑部分保持不变，仅修改 activeIndex 逻辑配合 UI ===== */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<any[]>([])
const loading = ref(false)
const imageUrl = ref<string | null>(null)
const activeIndex = ref<number | null>(null)

type HistoryItem = {
  imageUrl: string
  detections: any[]
  time: string
}
const historyList = ref<HistoryItem[]>([])

const classMap: Record<number, string> = { 0: '人', 5: '公交车', 11: '停车标志' }
const colorMap: Record<number, string> = { 0: '#ef4444', 5: '#3b82f6', 11: '#10b981' }

const exportResult = () => {
  if (!detections.value.length) return
  const data = { time: new Date().toLocaleString(), detections: detections.value }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `detect_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const deleteHistory = (index: number) => {
  historyList.value.splice(index, 1)
  localStorage.setItem('history', JSON.stringify(historyList.value))
}

const clearHistory = () => {
  if (!confirm('确定要清空所有历史记录吗？')) return
  historyList.value = []
  localStorage.removeItem('history')
}

const drawCanvas = () => {
  if (!canvasRef.value || !imageUrl.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = imageUrl.value
  img.onload = () => {
    // 容器宽度适配
    const containerWidth = canvas.parentElement?.clientWidth || 800
    const scale = containerWidth / img.width
    canvas.width = containerWidth
    canvas.height = img.height * scale

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    detections.value.forEach((det, index) => {
      const [x1, y1, x2, y2] = det.bbox.map((v: number) => v * scale)
      const isActive = index === activeIndex.value
      const color = isActive ? '#f59e0b' : (colorMap[det.class_id] || '#8b5cf6')

      ctx.strokeStyle = color
      ctx.lineWidth = isActive ? 4 : 2
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

      ctx.fillStyle = color
      ctx.font = 'bold 14px Inter, system-ui'
      const label = `${classMap[det.class_id] || '物体'} ${(det.confidence * 100).toFixed(0)}%`
      ctx.fillText(label, x1, y1 > 20 ? y1 - 8 : y1 + 20)
    })
  }
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = URL.createObjectURL(file)
  
  const formData = new FormData()
  formData.append('image', file)
  loading.value = true
  detections.value = []

  try {
    const res = await axios.post('http://127.0.0.1:8000/api/detect/', formData)
    detections.value = res.data.detections
    activeIndex.value = null
    drawCanvas()
    const record = { imageUrl: imageUrl.value, detections: res.data.detections, time: new Date().toLocaleTimeString() }
    historyList.value.unshift(record)
    localStorage.setItem('history', JSON.stringify(historyList.value))
  } catch (e) {
    alert('识别失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

const loadHistory = (item: HistoryItem) => {
  imageUrl.value = item.imageUrl
  detections.value = item.detections
  activeIndex.value = null
  setTimeout(drawCanvas, 50)
}

onMounted(() => {
  const saved = localStorage.getItem('history')
  if (saved) historyList.value = JSON.parse(saved)
})
</script>

<template>
  <div class="app-container">
    <header class="header">
      <div class="logo">🐾 DeepAnimalVision</div>
      <div class="subtitle">AI 智能动物检测系统</div>
    </header>

    <main class="main-layout">
      <section class="canvas-section">
        <div class="upload-card">
          <label class="file-input-label">
            <span v-if="!loading">📸 上传并识别图片</span>
            <span v-else>⚙️ 正在分析图像...</span>
            <input type="file" accept="image/*" @change="onFileChange" :disabled="loading" />
          </label>
          <button v-if="detections.length" @click="exportResult" class="btn-export">
            📥 导出 JSON
          </button>
        </div>

        <div class="canvas-wrapper">
          <canvas ref="canvasRef"></canvas>
          <div v-if="!imageUrl" class="placeholder">
            <p>请上传图片开始识别</p>
          </div>
        </div>
      </section>

      <aside class="sidebar">
        <div class="card result-card">
          <h3>🎯 识别结果 <span class="badge" v-if="detections.length">{{ detections.length }}</span></h3>
          <div v-if="detections.length" class="list-container">
            <div 
              v-for="(item, index) in detections" 
              :key="index"
              class="list-item"
              :class="{ active: activeIndex === index }"
              @click="activeIndex = index; drawCanvas()"
            >
              <span class="dot" :style="{ backgroundColor: colorMap[item.class_id] || '#8b5cf6' }"></span>
              <span class="label">{{ classMap[item.class_id] || '未知' }}</span>
              <span class="conf">{{ (item.confidence * 100).toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="empty-text">等待识别...</p>
        </div>

        <div class="card history-card">
          <div class="card-header">
            <h3>⏳ 最近记录</h3>
            <button v-if="historyList.length" @click="clearHistory" class="btn-text">清空</button>
          </div>
          <div v-if="historyList.length" class="list-container">
            <div 
              v-for="(item, index) in historyList" 
              :key="index"
              class="history-item"
            >
              <div class="history-info" @click="loadHistory(item)">
                <span class="time">{{ item.time }}</span>
                <span class="count">{{ item.detections.length }} 个目标</span>
              </div>
              <button @click="deleteHistory(index)" class="btn-del">✕</button>
            </div>
          </div>
          <p v-else class="empty-text">暂无历史记录</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
/* 现代配色与字体 */
:global(body) {
  margin: 0;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', -apple-system, sans-serif;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.header {
  margin-bottom: 2rem;
  text-align: center;
}
.logo {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

/* Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 968px) {
  .main-layout { grid-template-columns: 1fr; }
}

/* Canvas Area */
.canvas-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-card {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.file-input-label {
  flex: 1;
  display: block;
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.file-input-label:hover { background: #4f46e5; transform: translateY(-1px); }
.file-input-label input { display: none; }

.btn-export {
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-export:hover { background: #f1f5f9; }

.canvas-wrapper {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px dashed #e2e8f0;
}
canvas {
  width: 100%;
  height: auto;
  display: block;
}
.placeholder { color: #94a3b8; }

/* Sidebar & Cards */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}
.card h3 {
  margin-top: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: #6366f1;
}

/* List Items */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.list-item:hover { background: #f1f5f9; }
.list-item.active {
  border-color: #f59e0b;
  background: #fffbeb;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
}
.label { flex: 1; font-weight: 500; }
.conf { color: #64748b; font-size: 0.9rem; }

/* History */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.btn-text {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.85rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
}
.history-info { flex: 1; cursor: pointer; }
.time { display: block; font-weight: 500; }
.count { font-size: 0.75rem; color: #94a3b8; }
.btn-del {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
}
.btn-del:hover { color: #ef4444; }

.empty-text {
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  padding: 1rem 0;
}
</style>