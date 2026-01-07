from ultralytics import YOLO
from pathlib import Path

# ---------------------------
# 模型加载（只加载一次）
# ---------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "yolov8n.pt"

_model = YOLO(str(MODEL_PATH))


def detect_animals(
    image_path: str,
    conf: float = 0.25,
    imgsz: int = 640
):
    """
    对输入图片进行动物目标检测

    :param image_path: 图片路径
    :param conf: 置信度阈值
    :param imgsz: 输入尺寸
    :return: 检测结果列表
    """
    results = _model.predict(
        source=image_path,
        conf=conf,
        imgsz=imgsz,
        save=False
    )

    detections = []

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "class_id": cls_id,
                "confidence": round(confidence, 4),
                "bbox": [round(x1, 2), round(y1, 2),
                         round(x2, 2), round(y2, 2)]
            })

    return detections
