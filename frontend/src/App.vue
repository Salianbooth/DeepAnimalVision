<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

/* ===== 核心状态 ===== */
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

/* ===== 配置映射 ===== */
const classMap: Record<number, string> = { 0: '人', 5: '公交车', 11: '停车标志' }
const colorMap: Record<number, string> = { 0: '#F43F5E', 5: '#3B82F6', 11: '#10B981' }

/* ===== 分类统计计算 ===== */
const stats = computed(() => {
  const map: Record<number, number> = {}
  detections.value.forEach(det => {
    map[det.class_id] = (map[det.class_id] || 0) + 1
  })
  return Object.keys(map).map(id => {
    const classId = Number(id)
    return {
      label: classMap[classId] || `类别 ${classId}`,
      count: map[classId],
      color: colorMap[classId] || '#8B5CF6'
    }
  })
})

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

/* ===== 核心绘制：解决“图片过窄”问题 ===== */
const drawCanvas = () => {
  if (!canvasRef.value || !imageUrl.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = imageUrl.value
  
  img.onload = () => {
    const wrapper = canvas.parentElement
    if (!wrapper) return
    
    // 获取容器可用空间
    const padding = 40 // 留出一点边距
    const maxWidth = wrapper.clientWidth - padding
    const maxHeight = wrapper.clientHeight - padding

    // 计算缩放比例 (Contain 模式)
    const scaleW = maxWidth / img.width
    const scaleH = maxHeight / img.height
    const scale = Math.min(scaleW, scaleH)

    // 设置 Canvas 尺寸为图片缩放后的实际大小
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 绘制识别框
    detections.value.forEach((det, index) => {
      const [x1, y1, x2, y2] = det.bbox.map((v: number) => v * scale)
      const isActive = index === activeIndex.value
      const color = isActive ? '#F59E0B' : (colorMap[det.class_id] || '#8B5CF6')

      ctx.save()
      ctx.shadowBlur = 6
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.strokeStyle = color
      ctx.lineWidth = isActive ? 5 : 3
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      
      // 标签绘制
      const label = `${classMap[det.class_id] || '物体'} ${(det.confidence * 100).toFixed(0)}%`
      ctx.font = 'bold 12px sans-serif'
      const txtWidth = ctx.measureText(label).width
      
      ctx.fillStyle = color
      ctx.fillRect(x1, (y1 > 22 ? y1 - 22 : y1), txtWidth + 10, 22)
      
      ctx.fillStyle = '#fff'
      ctx.shadowBlur = 0
      ctx.fillText(label, x1 + 5, (y1 > 22 ? y1 - 7 : y1 + 15))
      ctx.restore()
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
    
    const record = { 
      imageUrl: imageUrl.value, 
      detections: res.data.detections, 
      time: new Date().toLocaleTimeString() 
    }
    historyList.value.unshift(record)
    localStorage.setItem('history', JSON.stringify(historyList.value))
  } catch (e) {
    alert('识别失败，请检查后端')
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
          <p>AI 实时分析平台</p>
        </div>
      </div>
      <button v-if="historyList.length" @click="clearHistory" class="btn-ghost-red">清空所有历史</button>
    </header>

    <main class="app-content">
      <section class="viewport-section">
        <div class="canvas-container" :class="{ 'is-loading': loading }">
          <div v-if="loading" class="loading-overlay">
            <div class="scanner-line"></div>
            <div class="loading-card">
              <div class="spinner"></div>
              <p>正在进行 AI 神经元扫描...</p>
            </div>
          </div>

          <canvas v-show="imageUrl && !loading" ref="canvasRef"></canvas>
          
          <div v-if="!imageUrl && !loading" class="canvas-placeholder">
            <div class="guide-box">
              <div class="guide-icon">📤</div>
              <h3>暂无待处理图像</h3>
              <p>请点击下方按钮上传需要识别的图片</p>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <label class="btn-main" :class="{ 'disabled': loading }">
            <span>{{ loading ? '识别处理中...' : '选择并上传图片' }}</span>
            <input type="file" accept="image/*" @change="onFileChange" :disabled="loading" />
          </label>
          <button v-if="detections.length" @click="exportResult" class="btn-outline">
            📥 下载分析报告
          </button>
        </div>
      </section>

      <aside class="data-section">
        <div class="panel">
          <div class="panel-header"><h3>⏳ 历史回顾</h3></div>
          <div class="panel-body">
            <div v-if="historyList.length" class="history-grid">
              <div v-for="(item, index) in historyList" :key="index" class="history-card" @click="loadHistory(item)">
                <div class="h-info">
                  <span class="h-time">{{ item.time }}</span>
                  <span class="h-tag">{{ item.detections.length }} 个目标</span>
                </div>
                <button @click.stop="deleteHistory(index)" class="h-del">✕</button>
              </div>
            </div>
            <div v-else class="empty-state">尚无记录</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>🎯 识别列表</h3>
            <span class="badge" v-if="detections.length">{{ detections.length }}</span>
          </div>
          <div class="panel-body">
            <template v-if="detections.length">
              <div class="stats-row">
                <div v-for="s in stats" :key="s.label" class="stat-tag" :style="{ background: s.color + '15', color: s.color }">
                  {{ s.label }} ({{ s.count }})
                </div>
              </div>
              <div class="det-list">
                <div 
                  v-for="(det, index) in detections" :key="index"
                  class="det-row" :class="{ 'active': activeIndex === index }"
                  @click="activeIndex = index; drawCanvas()"
                >
                  <div class="det-indicator" :style="{ background: colorMap[det.class_id] || '#8b5cf6' }"></div>
                  <span class="det-name">{{ classMap[det.class_id] || '未知' }}</span>
                  <span class="det-score">{{ (det.confidence * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">等待任务</div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  --primary: #4F46E5;
  --bg-app: #F8FAFC;
  --bg-panel: #FFFFFF;
  --bg-canvas: #FFFFFF; /* 改为纯白，更亮 */
  --border: #E2E8F0;
  --text-main: #0F172A;
  --text-sub: #64748B;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  color: var(--text-main);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* Header */
.app-header {
  height: 64px;
  padding: 0 24px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { font-size: 24px; background: #EEF2FF; padding: 6px; border-radius: 8px; }
.title-group h1 { margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); }
.title-group p { margin: 0; font-size: 12px; color: var(--text-sub); }

/* Layout */
.app-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  padding: 24px;
  min-height: 0;
}

/* Viewport Section */
.viewport-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.canvas-container {
  flex: 1; /* 占据剩余所有空间 */
  background: var(--bg-canvas);
  border-radius: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
  overflow: hidden;
  /* 确保即使没图片也有体量感 */
  min-height: 400px;
}

/* 扫描动画遮罩 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--primary), transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0%; }
  100% { top: 100%; }
}

.loading-card { text-align: center; }
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

canvas {
  /* 关键：Canvas 大小由 JS 动态计算，此处确保不溢出 */
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.canvas-placeholder {
  text-align: center;
  color: var(--text-sub);
}
.guide-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }

/* Action Bar */
.action-bar { display: flex; gap: 16px; flex-shrink: 0; }
.btn-main {
  flex: 1;
  background: var(--primary);
  color: white;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.btn-main:hover:not(.disabled) { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(79, 70, 229, 0.4); }
.btn-main.disabled { opacity: 0.6; cursor: not-allowed; }
.btn-main input { display: none; }

.btn-outline {
  padding: 0 24px;
  border: 1px solid var(--border);
  background: white;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Sidebar & Panels */
.data-section { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
.panel {
  background: white;
  border-radius: 20px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.panel:first-child { flex: 0.4; }
.panel:last-child { flex: 0.6; }

.panel-header { padding: 16px 20px; border-bottom: 1px solid var(--bg-app); flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
.panel-header h3 { margin: 0; font-size: 14px; font-weight: 800; }

.panel-body { flex: 1; overflow-y: auto; padding: 12px; }

/* History & Detection List */
.history-card {
  padding: 12px;
  background: var(--bg-app);
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.h-time { display: block; font-size: 12px; font-weight: 700; }
.h-tag { font-size: 11px; color: var(--text-sub); }
.h-del { background: none; border: none; color: #CBD5E1; cursor: pointer; }
.h-del:hover { color: #EF4444; }

.stats-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.stat-tag { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

.det-row {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  background: var(--bg-app);
}
.det-row.active { border-color: var(--primary); background: #EEF2FF; }
.det-indicator { width: 4px; height: 16px; border-radius: 2px; margin-right: 12px; }
.det-name { flex: 1; font-weight: 700; font-size: 13px; }
.det-score { font-size: 12px; color: var(--text-sub); font-weight: 600; }

.badge { background: var(--primary); color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; }
.empty-state { height: 100%; display: flex; align-items: center; justify-content: center; color: #CBD5E1; font-size: 13px; }
.btn-ghost-red { background: none; border: none; color: #EF4444; font-size: 12px; font-weight: 600; cursor: pointer; }

/* 滚动条 */
.panel-body::-webkit-scrollbar { width: 5px; }
.panel-body::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
</style>