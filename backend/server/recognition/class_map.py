# backend/recognition/class_map.py
from __future__ import annotations

YOLO_CLASS_MAP = {
    0: "person",
    5: "bus",
    11: "stop sign",
}

LABEL_TO_CLASS_ID = {v: k for k, v in YOLO_CLASS_MAP.items()}


def get_label(class_id: int) -> str:
    return YOLO_CLASS_MAP.get(class_id, "unknown")


def get_class_id(label: str) -> int | None:
    return LABEL_TO_CLASS_ID.get(label)
