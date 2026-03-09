# DeepAnimalVision

基于 `Vue 3 + Django + YOLOv8` 的动物图像识别系统。

项目目前以目标检测完整业务链路为主，已经实现了用户登录、图片上传、检测结果可视化、历史记录保存与按用户隔离查看。当前使用的是 YOLOv8 官方预训练模型，尚未接入自训练动物模型；管理员端页面也还处于预留阶段。

## 项目亮点

- 前后端分离：`Vue 3 + Vite + TypeScript` 与 `Django`
- 基于 YOLOv8 的图片检测流程
- Canvas 检测框绘制，支持缩放、拖拽、结果高亮
- 检测历史记录保存到数据库
- 用户系统已接入，每个用户只能查看自己的历史记录
- 支持单条删除、全部清空、导出 JSON

## 当前状态

- 已完成：登录、检测、历史记录、用户隔离
- 使用中：YOLOv8 官方预训练模型
- 未完成：管理员端、自训练模型接入、完整后台管理能力

## 技术栈

前端：
- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios
- HTML Canvas

后端：
- Django 4
- SQLite
- PyTorch
- Ultralytics YOLOv8
- OpenCV

## 项目结构

```text
DeepAnimalVision/
├─ backend/
│  └─ server/
│     ├─ api/            # 登录、检测、历史记录接口
│     ├─ users/          # 自定义用户模型
│     ├─ recognition/    # YOLO 推理相关代码
│     ├─ media/          # 上传图片与历史记录文件
│     ├─ db.sqlite3
│     └─ manage.py
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ router/
│  │  ├─ store/
│  │  ├─ views/
│  │  └─ components/
│  └─ package.json
├─ requirements.txt
└─ README.md
```

## 核心流程

1. 用户在前端登录。
2. Django 创建会话并返回用户信息。
3. 用户上传图片到后端检测接口。
4. YOLOv8 进行推理并返回检测框。
5. 后端保存 `Record` 与 `Detection` 数据。
6. 前端使用 Canvas 展示检测结果，并可查看历史记录。

## 本地运行

### 1. 启动后端

在项目根目录准备 Python 环境并安装依赖：

```bash
pip install -r requirements.txt
```

进入 Django 项目目录后启动服务：

```bash
cd backend/server
python manage.py runserver
```

默认地址：

```text
http://127.0.0.1:8000/
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认地址：

```text
http://localhost:5173/
```

## 使用说明

- 登录后进入用户首页
- 上传图片后会触发后端检测
- 检测结果会在画布中绘制边界框
- 页面右侧可以查看统计结果和历史记录
- 历史记录仅显示当前登录用户自己的数据

## 开发说明

### 关于模型

当前项目直接使用 YOLOv8 官方预训练模型进行推理，用来先打通识别系统的完整业务流程。后续可以将 `recognition/` 中的模型替换为自训练动物识别模型。

### 关于用户系统

项目已经从“单机演示识别”演进到“带用户归属的识别系统”：

- 增加了自定义 `User` 模型
- 检测记录通过外键绑定用户
- 每个用户只能读取自己的历史记录

### 关于管理员端

管理员页面路由已经预留，但功能尚未开始实现，当前重点仍然是普通用户识别流程。

## 注意事项

- 前端和后端开发时请保持主机名一致。
- 推荐统一使用 `localhost` 或统一使用 `127.0.0.1`，不要混用。
- 否则浏览器中的登录会话可能不会正确携带。

## 后续计划

- 接入自训练动物数据集与模型
- 完善管理员端
- 增加注册、退出登录、权限管理体验
- 支持更多统计分析与筛选能力
- 视情况增加视频流检测能力

## License

本项目仅用于学习、课程设计与研究用途，不直接面向商业使用。
