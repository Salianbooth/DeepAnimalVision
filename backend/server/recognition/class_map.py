from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml

RECOGNITION_DIR = Path(__file__).resolve().parent
DATASET_YAML_PATH = RECOGNITION_DIR / "data" / "animals.yaml"


@lru_cache(maxsize=1)
def load_class_names() -> list[str]:
    if not DATASET_YAML_PATH.exists():
        return []

    data = yaml.safe_load(DATASET_YAML_PATH.read_text(encoding="utf-8")) or {}
    names = data.get("names", [])

    if isinstance(names, dict):
        ordered_items = sorted(names.items(), key=lambda item: int(item[0]))
        return [str(name) for _, name in ordered_items]

    if isinstance(names, list):
        return [str(name) for name in names]

    return []


@lru_cache(maxsize=1)
def get_class_map() -> dict[int, str]:
    return {index: name for index, name in enumerate(load_class_names())}


@lru_cache(maxsize=1)
def get_reverse_class_map() -> dict[str, int]:
    return {name: index for index, name in get_class_map().items()}


def get_label(class_id: int) -> str:
    return get_class_map().get(class_id, f"class_{class_id}")


def get_class_id(label: str) -> int | None:
    return get_reverse_class_map().get(label)
