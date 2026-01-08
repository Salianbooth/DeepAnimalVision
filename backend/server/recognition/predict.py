from ultralytics import YOLO

# 模型只加载一次（非常重要）
model = YOLO("yolov8n.pt")  # 先用官方模型，后面换你的动物模型

def detect_image(image_path):
    results = model(image_path)

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class_id": int(box.cls[0]),
                "confidence": float(box.conf[0]),
                "bbox": [float(x) for x in box.xyxy[0]]
            })

    return detections
