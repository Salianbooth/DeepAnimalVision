<script setup lang="ts">
/**
 * DeepAnimalVision - AI 目标检测控制台
 * 核心逻辑说明：
 * 1. 状态管理：管理画布引用、识别数据、缩放平移参数、历史记录。
 * 2. 归一化 (normalizeDetections)：统一后端不同接口返回的数据格式。
 * 3. 渲染引擎 (drawCanvas)：处理 Canvas 缩放、平移以及 Bounding Box 的坐标映射。
 * 4. 交互：实现类似 Photoshop 的拖拽与滚轮缩放逻辑。
 */
import { ref, onMounted, computed, reactive } from 'vue'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { useHistoryStore } from '@/store/history'
import type { Detection } from '@/store/history'
import { CLASS_TEXT_MAP, CLASS_COLOR_MAP } from '@/constants/classMap'

/* ========================================================================
   核心状态 (Reactive State)
   ======================================================================== */
const canvasRef = ref<HTMLCanvasElement | null>(null) // Canvas 元素引用
const detections = ref<Detection[]>([])                    // 当前图片的检测结果列表
const loading = ref(false)                           // 识别请求状态
const imageUrl = ref<string | null>(null)            // 图片的 Blob 或 URL
const activeIndex = ref<number | null>(null)         // 侧边栏选中目标的索引
const imageObj = ref<HTMLImageElement | null>(null)  // 缓存的 HTML Image 对象，用于重绘
const detections_count = computed(() => detections.value.length)


/* ===== 历史记录（Pinia）===== */
const historyStore = useHistoryStore()
const { historyList, current, loading: historyLoading } = storeToRefs(historyStore)

/* ===== 画布变换状态 (平移/缩放) ===== */
const transform = reactive({
  scale: 1,         // 缩放倍数
  offsetX: 0,       // X轴偏移
  offsetY: 0,       // Y轴偏移
  isDragging: false, // 是否正在拖拽
  startX: 0,        // 拖拽起点坐标
  startY: 0
})

/* ========================================================================
   映射配置 (Mapping & Configuration)
   ======================================================================== */
// const classMap: Record<number, string> = {
//   0: '人',
//   5: '公交车',
//   11: '停车标志'
// }



// const colorMap: Record<number, string> = {
//   0: '#F43F5E', // 红色系
//   5: '#3B82F6', // 蓝色系
//   11: '#10B981' // 绿色系
// }

/* ========================================================================
   数据处理逻辑 (Data Processing)
   ======================================================================== */

/**
 * 统一归一化后端数据
 * 解决后端 'detect' 接口与 'records' 接口字段名不一致的问题
 */
const normalizeDetections = (raw: any[]) => {
  return raw.map(det => {
    const classId = det.class_id ?? -1

    return {
      class_id: classId,
      label: CLASS_TEXT_MAP[classId] || '未知',
      confidence: det.confidence,
      bbox: det.bbox
    }
  })
}


/**
 * 分类统计 (Computed)
 * 实时计算右侧面板中的分类药丸标签 (Stats Pill)
 */
const stats = computed(() => {
  const map: Record<number, number> = {}
  detections.value.forEach(det => {
    if (det.class_id >= 0) {
      map[det.class_id] = (map[det.class_id] || 0) + 1
    }
  })
  return Object.keys(map).map(id => {
  const cid = Number(id)
  return {
    label: CLASS_TEXT_MAP[cid] || `类别 ${cid}`,
    count: map[cid],
    color: CLASS_COLOR_MAP[cid] || '#8B5CF6'
  }
})

})

/* ========================================================================
   API 调用 (Backend API)
   ======================================================================== */

// 获取所有检测历史


const loadRecords = async () => {
  await historyStore.fetchHistoryList()
}



//加载详细历史记录
const loadHistory = async (item: { id: number }) => {
  console.group(`📄 加载历史记录详情 - ID: ${item.id}`)

  try {
    const record = await historyStore.fetchRecordDetail(item.id)
    console.log('【Pinia current record】', record)

    // detections
    detections.value = normalizeDetections(record.detections || [])

    // image
    const imgUrl = `http://127.0.0.1:8000${record.image}`
    const img = new Image()
    img.crossOrigin = 'anonymous'   // ✅ crossOrigin 必须在 src 之前
    img.src = imgUrl

    img.onload = () => {
      imageObj.value = img
      imageUrl.value = imgUrl
      resetTransform()
      drawCanvas()
    }

    img.onerror = (err) => {
      console.error('❌ 图片加载失败', err)
    }

  } catch (err) {
    console.error('❌ 加载历史记录失败', err)
  } finally {
    console.groupEnd()
  }
}




// 删除单条历史记录
// const deleteHistory = async (item: HistoryItem) => {
//   const ok = window.confirm('确认删除该历史记录吗？')
//   if (!ok) return

//   await axios.delete(`http://127.0.0.1:8000/api/records/${item.id}/delete/`)

//   // 1. 前端移除该条记录
//   historyList.value = historyList.value.filter(h => h.id !== item.id)

//   // 2. 如果当前画布正在显示的是被删记录 → 清空画布
//   if (imageUrl.value && imageUrl.value.includes(item.image)) {
//     clearCanvasState()
//   }
// }

const deleteHistory = async (item: { id: number }) => {
  const ok = window.confirm('确认删除该历史记录吗？')
  if (!ok) return

  await historyStore.removeRecord(item.id)

  if (current.value?.id === item.id) {
    clearCanvasState()
  }
}
const clearAllHistory = async () => {
  const ok = window.confirm('确认清空所有历史记录吗？该操作不可恢复')
  if (!ok) return

  await historyStore.clearAll()

  // 如果当前画布有内容，顺便清空
  clearCanvasState()
}


const clearCanvasState = () => {
  detections.value = []
  imageUrl.value = null
  imageObj.value = null
  activeIndex.value = null
  resetTransform()

  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}


/* ========================================================================
   交互逻辑 (Interaction: Zoom & Drag)
   ======================================================================== */

// 缩放处理
const handleZoom = (delta: number) => {
  const next = transform.scale + delta
  if (next >= 0.2 && next <= 10) {
    transform.scale = next
    drawCanvas()
  }
}

// 重置视图
const resetTransform = () => {
  transform.scale = 1
  transform.offsetX = 0
  transform.offsetY = 0
  drawCanvas()
}

// 鼠标按下：开始拖拽
const startDrag = (e: MouseEvent) => {
  if (!imageUrl.value) return
  transform.isDragging = true
  transform.startX = e.clientX - transform.offsetX
  transform.startY = e.clientY - transform.offsetY
}

// 鼠标移动：更新偏移量并重绘
const onDrag = (e: MouseEvent) => {
  if (!transform.isDragging) return
  transform.offsetX = e.clientX - transform.startX
  transform.offsetY = e.clientY - transform.startY
  drawCanvas()
}

// 停止拖拽
const stopDrag = () => {
  transform.isDragging = false
}

/* ========================================================================
   绘制引擎 (Canvas Rendering)
   ======================================================================== */

const drawCanvas = () => {
  if (!canvasRef.value || !imageObj.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const img = imageObj.value
  const wrapper = canvas.parentElement!

  // 1. 同步容器尺寸，防止像素拉伸
  canvas.width = wrapper.clientWidth
  canvas.height = wrapper.clientHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 2. 计算基础适配比例 (保持宽高比并填满 95% 容器)
  const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95

  ctx.save()
  // 3. 应用平移与缩放 (以画布中心为锚点)
  ctx.translate(canvas.width / 2 + transform.offsetX, canvas.height / 2 + transform.offsetY)
  ctx.scale(transform.scale, transform.scale)

  const drawW = img.width * baseScale
  const drawH = img.height * baseScale
  const x = -drawW / 2
  const y = -drawH / 2

  // 4. 绘制原始图像
  ctx.drawImage(img, x, y, drawW, drawH)

  // 5. 绘制所有检测框 (BBoxes)
  detections.value.forEach((det, i) => {
  const [x1, y1, x2, y2] = det.bbox.map((v: number) => v * baseScale)

  const boxX = x + x1
  const boxY = y + y1
  const boxW = x2 - x1
  const boxH = y2 - y1

  const color = i === activeIndex.value
    ? '#F59E0B'
    : (CLASS_COLOR_MAP[det.class_id] || '#8B5CF6')

  // ===== 1. 画检测框 =====
  ctx.strokeStyle = color
  ctx.lineWidth = 2 / transform.scale
  ctx.strokeRect(boxX, boxY, boxW, boxH)

  // ===== 2. 画标签文字 =====
  const labelText = `${det.label} ${(det.confidence * 100).toFixed(1)}%`

  ctx.font = `${14 / transform.scale}px sans-serif`
  ctx.textBaseline = 'top'

  const textWidth = ctx.measureText(labelText).width
  const textHeight = 16 / transform.scale
  const padding = 4 / transform.scale

  // 标签背景
  ctx.fillStyle = color
  ctx.fillRect(
    boxX,
    boxY - textHeight - padding * 2,
    textWidth + padding * 2,
    textHeight + padding * 2
  )

  // 标签文字
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    labelText,
    boxX + padding,
    boxY - textHeight - padding
  )
})


  ctx.restore()
}
/**
 * 保存当前 Canvas 渲染结果为图片
 */
const saveAsImage = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const dataURL = canvas.toDataURL('image/png')

  const a = document.createElement('a')
  a.href = dataURL
  a.download = `DeepAnimalVision_${Date.now()}.png`
  a.click()
}
/**
 * 导出当前检测结果为 JSON 文件
 */
const exportResult = () => {
  if (!detections.value.length) return

  const data = {
    image: imageUrl.value,
    detections: detections.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DeepAnimalVision_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* ========================================================================
   文件上传与导出 (Upload & Export)
   ======================================================================== */

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return

  const file = input.files[0]
  imageUrl.value = URL.createObjectURL(file) // 生成本地预览图

  const img = new Image()
  img.src = imageUrl.value
  img.onload = async () => {
    imageObj.value = img
    resetTransform()

    // 封装 FormData 发送给后端
    const formData = new FormData()
    formData.append('image', file)

    loading.value = true
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/detect/', formData)
      detections.value = normalizeDetections(res.data.detections)
      drawCanvas()
      await loadRecords() // 刷新历史列表
    } finally {
      loading.value = false
    }
  }
}

// 初始化加载
onMounted(async () => {
  await historyStore.fetchHistoryList()
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
      <!-- 左侧图片区：彻底占满无空白 -->
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
          <button
            v-if="detections_count > 0"
            @click="exportResult"
            class="btn-secondary"
          >
            📥 导出 JSON
          </button>

        </div>
      </section>

      <!-- 右侧侧边栏：卡片撑满显示右边框 -->
      <aside class="sidebar-section">
        <div class="card history-card">
          <div class="card-header"> <span>历史记录</span>

            <button
              class="btn-clear-all"
              v-if="historyList.length > 0"
              @click="clearAllHistory"
              title="清空所有历史记录"
            >
              清空
            </button></div>

          <div class="card-body">
            <div
              v-for="item in historyList"
              :key="item.id"
              class="item"
              @click="loadHistory(item)"
            >
              <div class="item-info">
                <span class="time">{{ item.time }}</span>
                <span> {{ item.count }} 个目标</span>
              </div>

              <!-- 删除按钮：关键点在 @click.stop -->
              <button
                class="btn-delete"
                @click.stop="deleteHistory(item)"
                title="删除该记录"
              >
                ✖
              </button>
            </div>

            <div v-if="!historyList || historyList.length === 0" class="empty">
              无记录
            </div>

          </div>
        </div>


        <div class="card result-card">
          <div class="card-header">
            检测结果
            <span class="badge" v-if="detections_count > 0">
  {{ detections_count }}
</span>

          </div>
          <div class="card-body">
            <div class="stats">
              <div v-for="s in stats" :key="s.label" class="stat-pill" :style="{ background: s.color + '20', color: s.color }">
                {{ s.label }} ({{ s.count }})
              </div>
            </div>
            <div class="det-list">
              <!-- 唯一修正：把错误的 <<i ...></</i> 改为标准的 <i ...></i> -->
              <div v-for="(det, i) in detections" :key="i" class="det-item" :class="{ active: activeIndex === i }" @click="activeIndex = i; drawCanvas()">
                <i :style="{ background: CLASS_COLOR_MAP[det.class_id] || '#8b5cf6' }"></i>
                <span class="name">{{ CLASS_TEXT_MAP[det.class_id] || '未知' }}</span>
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
/* 全局重置：彻底去掉所有默认边距，消除空白 */
:global(html), :global(body) {
  margin: 0 !important;
  padding: 0 !important;
  background-color: #ffffff !important;
  height: 100% !important;
  overflow: hidden !important;
}

/* 外层容器：顶满屏幕，无左侧空白 */
.app-shell {
  --primary: #4f46e5;
  --bg: #f8fafc;
  --text: #1e293b;
  --border: #d1d5db; /* 调整为更浅的边框色，匹配目标布局 */
  height: 100vh;
  width: 100vw;
  background: white;
  color: var(--text);
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  padding: 0 !important;
  margin: 0 !important;
}

/* 顶部标题栏：更紧凑的边距 */
.app-header {
  background: white;
  padding: 0 12px !important; /* 缩小右侧边距，更紧凑 */
  height: 56px; /* 略微降低高度 */
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  width: 100% !important;
}

/* 内容区：更紧凑的分栏，缩小间距 */
.app-content {
  flex: 1;
  display: grid;
  grid-template-columns: 7fr 3fr; /* 保持7:3比例 */
  gap: 4px; /* 缩小左右区间距 */
  padding: 4px !important; /* 缩小整体内边距 */
  min-height: 0;
  width: 100% !important;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 左侧图片区：100%占满，统一圆角 */
.viewport-section {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 缩小图片区与按钮区的间距 */
  min-height: 0;
  width: 100% !important;
}

.canvas-container {
  flex: 1;
  background: #ffffff;
  border-radius: 8px; /* 统一圆角为8px，匹配右侧卡片 */
  border: 1px solid var(--border) !important;
  position: relative;
  overflow: hidden;
  cursor: grab;
  width: 100% !important;
  height: 100% !important;
}

/* 右侧侧边栏：更紧凑的卡片布局 */
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 缩小两个卡片的间距 */
  min-height: 0;
  width: 100% !important;
  padding: 0 !important;
}

/* 右侧卡片：统一圆角+边框 */
.card {
  background: white;
  border-radius: 8px; /* 与左侧容器统一圆角 */
  border: 1px solid var(--border) !important;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  width: 100% !important;
  margin: 0 !important;
}

/* 其他样式优化（保留原有风格） */
.brand { display: flex; align-items: center; gap: 10px; } /* 缩小logo与标题的间距 */
.logo-box { background: #eef2ff; padding: 5px; border-radius: 6px; font-size: 18px; }
.title-group h1 { font-size: 15px; margin: 0; font-weight: 800; color: var(--primary); }
.title-group p { font-size: 10px; margin: 0; color: #64748b; }

.floating-toolbar {
  position: absolute;
  top: 8px;
  right: 8px; /* 缩小工具栏的边距 */
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  padding: 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 10;
}
.floating-toolbar button {
  border: none; background: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
}
.floating-toolbar button:hover { background: #f1f5f9; }
.v-line { width: 1px; height: 14px; background: var(--border); margin: 0 3px; }
.btn-save { color: var(--primary); }

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.loading-spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }

.action-bar { 
  display: flex; 
  gap: 6px; /* 缩小按钮间距 */
  flex-shrink: 0;
  width: 100% !important;
}
.btn-primary { flex: 1; background: var(--primary); color: white; padding: 10px; border-radius: 8px; text-align: center; font-weight: 700; cursor: pointer; }
.btn-primary.is-loading { opacity: 0.7; }
.btn-primary input { display: none; }
.btn-secondary { background: white; border: 1px solid var(--border); padding: 0 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }

.card-header { 
  padding: 12px 14px; /* 缩小卡片头部边距 */
  font-size: 12px; 
  font-weight: 800; 
  border-bottom: 1px solid var(--border);
  display: flex; 
  justify-content: space-between;
  flex-shrink: 0;
}
.card-body { 
  flex: 1; 
  overflow-y: auto; 
  padding: 10px; /* 缩小卡片内容边距 */
  font-size: 12px;
}
.card {
  margin: 0 0 16px 0;
  box-sizing: border-box;
}


.item { padding: 8px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; cursor: pointer; font-size: 11px; }
.stats { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.stat-pill { padding: 3px 8px; border-radius: 18px; font-size: 10px; font-weight: 700; }
.det-item { display: flex; align-items: center; padding: 8px; background: #f8fafc; border-radius: 6px; margin-bottom: 4px; cursor: pointer; border: 1px solid transparent; }
.det-item.active { border-color: var(--primary); background: #eef2ff; }
.det-item i { width: 4px; height: 12px; border-radius: 2px; margin-right: 6px; }
.name { flex: 1; font-weight: 700; font-size: 12px; }
.conf { font-size: 11px; color: #94a3b8; }
.badge { background: var(--primary); color: white; padding: 1px 6px; border-radius: 8px; font-size: 9px; }
.empty { text-align: center; color: #94a3b8; padding: 16px; font-size: 11px; }

.canvas-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: #94a3b8; }
.icon { font-size: 36px; margin-bottom: 8px; display: block; opacity: 0.5; }
.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  padding: 16px;     /* 👈 内缩，而不是外溢 */
  box-sizing: border-box;
}
* {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}

</style>