<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import axios from 'axios'

// 只保留核心功能，删掉冗余注释，保证代码简洁
const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<any[]>([])
const loading = ref(false)
const imageUrl = ref<string | null>(null)
const activeIndex = ref<number | null>(null)
const imageObj = ref<HTMLImageElement | null>(null)
const historyList = ref<any[]>([])

const transform = reactive({ scale: 1, offsetX: 0, offsetY: 0, isDragging: false, startX: 0, startY: 0 })
const classMap = { 0: '人', 5: '公交车', 11: '停车标志' }
const colorMap = { 0: '#F43F5E', 5: '#3B82F6', 11: '#10B981' }

const stats = computed(() => {
  const map: any = {}
  detections.value.forEach(det => map[det.class_id] = (map[det.class_id] || 0) + 1)
  return Object.keys(map).map(id => ({
    label: classMap[id] || `类别 ${id}`, count: map[id], color: colorMap[id] || '#8B5CF6'
  }))
})

const handleZoom = (delta: number) => {
  const newScale = transform.scale + delta
  if (newScale >= 0.2 && newScale <= 10) { transform.scale = newScale; drawCanvas() }
}
const resetTransform = () => { transform.scale = 1; transform.offsetX = 0; transform.offsetY = 0; drawCanvas() }
const startDrag = (e: MouseEvent) => {
  if (imageUrl.value) { transform.isDragging = true; transform.startX = e.clientX - transform.offsetX; transform.startY = e.clientY - transform.offsetY }
}
const onDrag = (e: MouseEvent) => {
  if (transform.isDragging) { transform.offsetX = e.clientX - transform.startX; transform.offsetY = e.clientY - transform.startY; drawCanvas() }
}
const stopDrag = () => { transform.isDragging = false }

const saveAsImage = () => {
  if (canvasRef.value) {
    const link = document.createElement('a')
    link.download = `Result_${Date.now()}.jpg`
    link.href = canvasRef.value.toDataURL('image/jpeg', 0.9)
    link.click()
  }
}
const exportResult = () => {
  const blob = new Blob([JSON.stringify({ time: new Date().toLocaleString(), detections: detections.value }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `data_${Date.now()}.json`
  a.click()
}

const drawCanvas = () => {
  if (!canvasRef.value || !imageObj.value) return
  const canvas = canvasRef.value; const ctx = canvas.getContext('2d')!; const img = imageObj.value
  canvas.width = canvas.parentElement!.clientWidth; canvas.height = canvas.parentElement!.clientHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95
  ctx.save()
  ctx.translate(canvas.width / 2 + transform.offsetX, canvas.height / 2 + transform.offsetY)
  ctx.scale(transform.scale, transform.scale)
  
  const drawW = img.width * baseScale; const drawH = img.height * baseScale
  ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH)
  
  detections.value.forEach((det, index) => {
    const [x1, y1, x2, y2] = det.bbox.map((v: number) => v * baseScale)
    const isActive = index === activeIndex.value
    const color = isActive ? '#F59E0B' : (colorMap[det.class_id] || '#8B5CF6')
    
    ctx.strokeStyle = color; ctx.lineWidth = (isActive ? 4 : 2) / transform.scale
    ctx.strokeRect(-drawW/2 + x1, -drawH/2 + y1, x2 - x1, y2 - y1)
    
    const label = `${classMap[det.class_id] || '物体'} ${(det.confidence * 100).toFixed(0)}%`
    const fontSize = Math.max(10 / transform.scale, 8)
    ctx.font = `bold ${fontSize}px sans-serif`
    const txtWidth = ctx.measureText(label).width
    const tagH = 18 / transform.scale
    
    ctx.fillStyle = color; ctx.fillRect(-drawW/2 + x1, -drawH/2 + y1 - tagH, txtWidth + 4/transform.scale, tagH)
    ctx.fillStyle = '#fff'; ctx.fillText(label, -drawW/2 + x1 + 2/transform.scale, -drawH/2 + y1 - 4/transform.scale)
  })
  ctx.restore()
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  imageUrl.value = URL.createObjectURL(file)
  
  const img = new Image()
  img.src = imageUrl.value
  img.onload = async () => {
    imageObj.value = img; resetTransform()
    const formData = new FormData(); formData.append('image', file)
    loading.value = true
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/detect/', formData)
      detections.value = res.data.detections; drawCanvas()
      historyList.value.unshift({ imageUrl: imageUrl.value!, detections: res.data.detections, time: new Date().toLocaleTimeString() })
    } catch (e) { alert('后端连接失败') }
    finally { loading.value = false }
  }
}

const loadHistory = (item: any) => {
  const img = new Image(); img.src = item.imageUrl
  img.onload = () => { imageObj.value = img; detections.value = item.detections; resetTransform() }
}

onMounted(() => { window.addEventListener('resize', drawCanvas) })
</script>

<template>
  <!-- 外层容器：无任何边距，贴紧最左 -->
  <div class="app-shell">
    <!-- 标题栏：左侧无内边距，贴紧 -->
    <header class="app-header">
      <div class="brand">
        <div class="logo-box">🐾</div>
        <div class="title-group">
          <h1>DeepAnimalVision</h1>
          <p>AI 识别与细节分析控制台</p>
        </div>
      </div>
    </header>

    <!-- 内容区：flex布局，无任何内边距，贴紧左侧 -->
    <main class="app-content">
      <!-- 左侧图片区：宽度占70%，无内边距 -->
      <section class="viewport-section">
        <div class="canvas-container" 
             @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag"
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

      <!-- 右侧结果区：宽度占30%，无内边距，卡片贴紧 -->
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
              <!-- 语法绝对正确，无多余符号 -->
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
/* 核心1：全局清零所有默认边距，强制贴左 */
:global(*), :global(html), :global(body) {
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}
:global(body) {
  background: #fff !important;
  height: 100vh !important;
  overflow: hidden !important;
}

/* 核心2：外层容器占满屏幕，无任何内边距 */
.app-shell {
  width: 100vw !important;  /* 占满屏幕宽度 */
  height: 100vh !important; /* 占满屏幕高度 */
  display: flex;
  flex-direction: column;
  background: #fff;
  /* 彻底去掉所有可能的边距 */
  margin: 0 !important;
  padding: 0 !important;
}

/* 核心3：标题栏左侧无内边距，贴紧最左 */
.app-header {
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #94a3b8;
  /* 只保留右侧16px内边距，左侧0 */
  padding: 0 16px 0 0 !important;
  width: 100% !important;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 标题内容贴紧左侧 */
  margin-left: 16px !important;
}
.logo-box { background: #eef2ff; padding: 6px; border-radius: 8px; font-size: 20px; }
.title-group h1 { font-size: 16px; margin: 0; font-weight: 800; color: #4f46e5; }
.title-group p { font-size: 11px; margin: 0; color: #64748b; }

/* 核心4：内容区flex布局，无内边距，无间隙 */
.app-content {
  flex: 1;
  display: flex;  /* 不用grid，避免gap导致的空白 */
  width: 100% !important;
  /* 彻底去掉内边距，贴紧左侧 */
  padding: 8px 8px 8px 0 !important;
  gap: 8px; /* 左右区之间的小间隙，可删 */
}

/* 左侧图片区：占70%宽度，无内边距 */
.viewport-section {
  width: 70% !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 !important;
  margin: 0 !important;
}
.canvas-container {
  flex: 1;
  background: #fff;
  border: 1px solid #94a3b8;
  border-radius: 12px;
  position: relative;
  cursor: grab;
  margin-left: 8px !important; /* 仅留8px呼吸空间，要贴死就删 */
}
.canvas-container.dragging { cursor: grabbing; }

/* 右侧结果区：占30%宽度，无内边距 */
.sidebar-section {
  width: 30% !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 !important;
  margin: 0 !important;
}
.card {
  background: #fff;
  border: 1px solid #94a3b8;
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.history-card { flex: 0.35; }
.result-card { flex: 0.65; }

/* 其他样式仅保留必要，不影响贴左 */
.floating-toolbar {
  position: absolute; top: 12px; right: 12px;
  background: rgba(255,255,255,0.9); border: 1px solid #94a3b8;
  padding: 6px !important; border-radius: 10px; display: flex; align-items: center; gap: 4px;
}
.floating-toolbar button { border: none; background: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.v-line { width: 1px; height: 16px; background: #94a3b8; margin: 0 4px; }
.btn-save { color: #4f46e5; }

canvas { width: 100%; height: 100%; display: block; }
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loading-spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.action-bar { display: flex; gap: 8px; margin-left: 8px !important; }
.btn-primary { flex: 1; background: #4f46e5; color: #fff; padding: 12px; border-radius: 10px; text-align: center; cursor: pointer; }
.btn-primary.is-loading { opacity: 0.7; }
.btn-primary input { display: none; }
.btn-secondary { background: #fff; border: 1px solid #94a3b8; padding: 0 20px; border-radius: 10px; cursor: pointer; }

.card-header { padding: 14px 16px; font-size: 13px; font-weight: 800; border-bottom: 1px solid #94a3b8; display: flex; justify-content: space-between; }
.card-body { flex: 1; overflow-y: auto; padding: 12px !important; font-size: 13px; }

.item { padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; cursor: pointer; font-size: 12px; }
.stats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.stat-pill { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.det-item { display: flex; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 6px; cursor: pointer; border: 1px solid transparent; }
.det-item.active { border-color: #4f46e5; background: #eef2ff; }
.det-item i { width: 4px; height: 14px; border-radius: 2px; margin-right: 8px; }
.name { flex: 1; font-weight: 700; font-size: 13px; }
.conf { font-size: 12px; color: #94a3b8; }
.badge { background: #4f46e5; color: #fff; padding: 1px 8px; border-radius: 10px; font-size: 10px; }
.empty { text-align: center; color: #94a3b8; padding: 20px; font-size: 12px; }

.canvas-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: #94a3b8; }
.icon { font-size: 40px; margin-bottom: 10px; display: block; opacity: 0.5; }
</style>