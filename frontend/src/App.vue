<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const detections = ref<any[]>([])
const loading = ref(false)
const imageUrl = ref<string | null>(null)

// 类别映射（后面你会换成动物）
const classMap: Record<number, string> = {
  0: 'person',
  5: 'bus',
  11: 'stop sign'
}

// 颜色映射
const colorMap: Record<number, string> = {
  0: 'red',
  5: 'blue',
  11: 'green'
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]

  // 释放旧 blob
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }

  imageUrl.value = URL.createObjectURL(file)

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

    const img = new Image()
    img.src = imageUrl.value

    img.onload = () => {
      const canvas = canvasRef.value!
      const ctx = canvas.getContext('2d')!

      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      ctx.lineWidth = 3
      ctx.font = '18px Arial'

      detections.value.forEach(det => {
        const [x1, y1, x2, y2] = det.bbox
        const w = x2 - x1
        const h = y2 - y1

        const color = colorMap[det.class_id] || 'yellow'
        ctx.strokeStyle = color
        ctx.fillStyle = color

        ctx.strokeRect(x1, y1, w, h)

        const label = `${classMap[det.class_id] || det.class_id} ${det.confidence.toFixed(2)}`
        ctx.fillText(label, x1, Math.max(y1 - 5, 20))
      })
    }
  } catch (err) {
    console.error('识别失败：', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding: 40px">
    <h2>DeepAnimalVision - 动物识别</h2>

    <input type="file" accept="image/*" @change="onFileChange" />

    <p v-if="loading" style="color: #409eff; margin-top: 10px;">
      🔍 正在识别中，请稍等...
    </p>

    <div style="margin-top: 20px">
      <canvas
        ref="canvasRef"
        style="border: 1px solid #ccc; max-width: 100%;"
      ></canvas>
    </div>

    <!-- 结果列表 -->
    <div v-if="detections.length" style="margin-top: 20px">
      <h3>检测结果列表</h3>
      <ul>
        <li
          v-for="(item, index) in detections"
          :key="index"
          style="margin-bottom: 6px"
        >
          类别：
          <strong>{{ classMap[item.class_id] || item.class_id }}</strong>
          ，置信度：
          <strong>{{ item.confidence.toFixed(2) }}</strong>
        </li>
      </ul>
    </div>
  </div>
</template>
