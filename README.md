# DeepAnimalVision 🐾
基于深度学习的动物图像检测与识别系统（前后端分离）

DeepAnimalVision 是一个基于深度学习的动物图像检测与识别系统，采用 前后端分离架构，支持图片上传、目标检测、结果可视化、检测结果高亮联动以及历史记录管理。
项目完整覆盖了从模型推理到前端交互展示的全过程，适合作为 课程设计 / 毕业设计 / AI 应用实践项目。

## ✨ 功能特性
- 📤 图片上传并发送至后端进行识别
- 🧠 深度学习模型进行目标检测（YOLO 系列）
- 🖼 Canvas 绘制检测框（类别 + 置信度）
- 📋 检测结果列表展示
- 🔶 点击列表高亮对应检测框
- 🕘 历史识别记录管理（进行中）
- 📦 检测结果导出（规划中）

## 🏗 项目整体架构
```
Frontend (Vue 3 + Vite + TS)
        ↓ HTTP / Axios
Backend (FastAPI)
        ↓
YOLO 模型推理
        ↓
JSON 检测结果
        ↓
Canvas 可视化 + 交互列表
```

## 🧰 技术栈
### 前端（Frontend）
- Vue 3
- Vite
- TypeScript
- Axios
- HTML Canvas

### 后端（Backend）
- FastAPI
- PyTorch
- YOLO 系列目标检测模型
- OpenCV

## 📂 项目结构（简化）
```
DeepAnimalVision/
├── frontend/
│   ├── src/
│   │   ├── App.vue
│   │   └── main.ts
│   └── package.json
│
├── backend/
│   ├── app.py
│   └── detect.py
│
├── README.md
└── requirements.txt
```

## 🚀 项目搭建与开发过程记录
### 1️⃣ 前端工程初始化
使用 Vite + Vue 3 + TypeScript 初始化前端项目
安装基础依赖（axios、pinia）

```bash
npm create vite@latest frontend
cd frontend
npm install
npm install axios pinia
```

#### 📌 常见问题记录
| 问题 | 原因 | 解决方法 |
|------|------|----------|
| ❌ Failed to resolve import "pinia" | 依赖未安装 | ✅ npm install pinia |

### 2️⃣ 图片上传与后端接口联通
- 使用 `<input type="file">` 上传图片
- 通过 FormData 发送至 FastAPI 后端
- 接收后端返回的检测结果（JSON）

```javascript
axios.post('http://127.0.0.1:8000/api/detect/', formData)
```

### 3️⃣ Canvas 绘制检测结果
- 使用 `<canvas>` 显示上传图片
- 根据后端返回的 bbox 绘制检测框
- 显示类别名称与置信度
- 不同类别使用不同颜色区分

### 4️⃣ 检测结果列表与高亮联动
- 在 Canvas 下方显示检测结果列表
- 点击列表项：
  - 高亮对应检测框
  - 加粗边框、改变颜色
  - Canvas 与列表状态保持同步

该功能显著提升了系统的交互体验，是项目的重要亮点之一。

### 5️⃣ 历史记录功能（进行中）
- 保存每次识别的图片与结果
- 展示历史记录列表
- 支持单条删除 / 全部清空
- 点击历史记录可重新查看识别结果

## ✅ 当前功能完成度
| 功能 | 状态 |
|------|------|
| 图片上传 | ✅ |
| 后端模型推理 | ✅ |
| Canvas 检测框绘制 | ✅ |
| 类别 & 置信度显示 | ✅ |
| 结果列表展示 | ✅ |
| 点击高亮联动 | ✅ |
| 历史记录 | 🔄 |
| 结果导出 | ⏳ |

## 🛣 后续开发路线
### 短期
- 历史记录删除 / 清空
- 检测结果导出（JSON / CSV）

### 中期
- 替换为真实动物数据集
- 支持结果筛选与统计分析

### 长期
- 视频流目标检测
- 用户系统（登录 / 记录归属）
- Docker 化部署

## 📌 Git 提交规范
### 提交格式：
```
[类型] 描述（不超过50字）
```

### 示例：
```
[feat] 新增检测结果列表高亮交互
[fix] 修复 canvas 重绘异常问题
[docs] 更新 README 项目说明
```

## 🧑‍💻 作者
- 开发者：Salianbooth
- 项目用途：课程设计 / 毕业设计 / 学习研究

## 📄 License
本项目仅用于学习与研究目的，禁止直接用于商业用途。

---

