<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

/* ===== 状态 ===== */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<any[]>([])
const loading = ref(false)
const imageUrl = ref<string | null>(null)
const activeIndex = ref<number | null>(null)


/* ===== 导出数据 ===== */
const exportResult = () => {
  if (!detections.value.length) {
    alert('当前没有可导出的识别结果')
    return
  }

  const data = {
    time: new Date().toLocaleString(),
    detections: detections.value
  }

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  )

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'detect_result.json'
  a.click()
  URL.revokeObjectURL(url)
}

/* 历史记录 */
type HistoryItem = {
  imageUrl: string
  detections: any[]
  time: string
}

const historyList = ref<HistoryItem[]>([])

const deleteHistory = (index: number) => {
  historyList.value.splice(index, 1)
  localStorage.setItem('history', JSON.stringify(historyList.value))
}

const clearHistory = () => {
  if (!confirm('确定要清空所有历史记录吗？')) return
  historyList.value = []
  localStorage.removeItem('history')
}

/* ===== 映射 ===== */
const classMap: Record<number, string> = {
  0: '人',
  5: '公交车',
  11: '停车标志'
}

const colorMap: Record<number, string> = {
  0: 'red',
  5: 'blue',
  11: 'green'
}

/* ===== Canvas 绘制 ===== */
const drawCanvas = () => {
  if (!canvasRef.value || !imageUrl.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!

  const img = new Image()
  img.src = imageUrl.value

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    detections.value.forEach((det, index) => {
      const [x1, y1, x2, y2] = det.bbox
      const w = x2 - x1
      const h = y2 - y1

      const isActive = index === activeIndex.value
      const color = isActive ? 'orange' : (colorMap[det.class_id] || 'yellow')

      ctx.strokeStyle = color
      ctx.lineWidth = isActive ? 5 : 2
      ctx.font = '16px Arial'
      ctx.fillStyle = color

      ctx.strokeRect(x1, y1, w, h)

      const label = `${classMap[det.class_id] || det.class_id} ${det.confidence.toFixed(2)}`
      ctx.fillText(label, x1, Math.max(y1 - 5, 20))
    })
  }
}

/* ===== 上传识别 ===== */
const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]

  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }

  const url = URL.createObjectURL(file)
  imageUrl.value = url

  const formData = new FormData()
  formData.append('image', file)

  loading.value = true
  detections.value = []

  try {
    const res = await axios.post(
      'http://127.0.0.1:8000/api/detect/',
      formData
    )

    detections.value = res.data.detections
    activeIndex.value = null
    drawCanvas()

    /* 保存历史 */
    const record: HistoryItem = {
      imageUrl: url,
      detections: res.data.detections,
      time: new Date().toLocaleString()
    }

    historyList.value.unshift(record)
    localStorage.setItem('history', JSON.stringify(historyList.value))

  } finally {
    loading.value = false
  }
}




/* ===== 点击历史 ===== */
const loadHistory = (item: HistoryItem) => {
  imageUrl.value = item.imageUrl
  detections.value = item.detections
  activeIndex.value = null
  drawCanvas()
}

/* ===== 初始化 ===== */
onMounted(() => {
  const saved = localStorage.getItem('history')
  if (saved) {
    historyList.value = JSON.parse(saved)
  }
})
</script>

<template>
  <div style="padding: 40px">
    <h2>DeepAnimalVision - 动物识别系统</h2>

    <input type="file" accept="image/*" @change="onFileChange" />

    <p v-if="loading" style="color: #409eff">🔍 正在识别中...</p>

    <canvas ref="canvasRef" style="border: 1px solid #ccc; margin-top: 20px;"></canvas>

    <!-- 结果列表 -->
    <div v-if="detections.length" style="margin-top: 20px">
      <h3>检测结果（点击高亮）</h3>
      <ul>
        <li
          v-for="(item, index) in detections"
          :key="index"
          @click="activeIndex = index; drawCanvas()"
          style="cursor: pointer"
        >
          {{ classMap[item.class_id] }} - {{ item.confidence.toFixed(2) }}
        </li>
      </ul>
    </div>

    <!-- 历史记录 -->
    <div v-if="historyList.length" style="margin-top: 40px">
      <h3>
        历史记录
        <button
          style="margin-left: 10px"
          @click="clearHistory"
        >
          清空
        </button>
      </h3>

      <ul>
        <li
          v-for="(item, index) in historyList"
          :key="index"
          style="margin-bottom: 8px"
        >
          <span
            @click="loadHistory(item)"
            style="cursor: pointer; margin-right: 10px"
          >
            {{ item.time }}（{{ item.detections.length }} 个目标）
          </span>

          <button @click="deleteHistory(index)">🗑</button>
        </li>
      </ul>
    </div>


   <!-- 历史记录 -->
    <div v-if="detections.length" style="margin-top: 10px">
      <button @click="exportResult">
        导出识别结果（JSON）
      </button>
    </div>

  </div>
</template>
