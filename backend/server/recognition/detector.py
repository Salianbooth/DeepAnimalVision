from __future__ import annotations

from pathlib import Path

from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best (1).pt"

model = YOLO(str(MODEL_PATH))


def get_model_label(class_id: int) -> str:
    names = getattr(model, "names", {}) or {}

    if isinstance(names, dict):
        return str(names.get(class_id, f"class_{class_id}"))

    if isinstance(names, list) and 0 <= class_id < len(names):
        return str(names[class_id])

    return f"class_{class_id}"


def detect_image(image_path):
    results = model(image_path)

    detections = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            detections.append(
                {
                    "class_id": class_id,
                    "label": get_model_label(class_id),
                    "confidence": float(box.conf[0]),
                    "bbox": [float(x) for x in box.xyxy[0]],
                }
            )

    return detections
