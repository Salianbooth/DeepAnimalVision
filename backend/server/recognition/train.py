from __future__ import annotations

import argparse
import hashlib
import os
import random
import re
import shutil
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

RECOGNITION_DIR = Path(__file__).resolve().parent
DATA_DIR = RECOGNITION_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
DEFAULT_DATASET_HANDLE = "antoreepjana/animals-detection-images-dataset"
DEFAULT_KAGGLE_DATASET_ROOT = Path(
    "/kaggle/input/datasets/antoreepjana/animals-detection-images-dataset"
)
DEFAULT_LOCAL_DATASET_ROOT = RAW_DATA_DIR / "animals-detection-images-dataset"
DEFAULT_LOCAL_WORK_DIR = DATA_DIR / "animals_yolo"
CANONICAL_DATASET_YAML = DATA_DIR / "animals.yaml"
DEFAULT_LOCAL_RUNS_DIR = RECOGNITION_DIR / "runs"
SKIP_DIR_NAMES = {"label", "labels"}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass(frozen=True)
class Sample:
    class_name: str
    image_path: Path
    label_path: Path
    output_stem: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Prepare the animals dataset for YOLO training and optionally run "
            "training/validation."
        )
    )
    parser.add_argument(
        "--dataset-path",
        help=(
            "Path to the source dataset. If omitted, the script tries the Kaggle "
            "dataset path first, then falls back to KaggleHub download."
        ),
    )
    parser.add_argument(
        "--dataset-handle",
        default=DEFAULT_DATASET_HANDLE,
        help="KaggleHub dataset handle used when --dataset-path is not provided.",
    )
    parser.add_argument(
        "--work-dir",
        help=(
            "Output directory for the converted YOLO dataset. Defaults to "
            "/kaggle/working/animals_yolo on Kaggle, otherwise recognition/data/animals_yolo."
        ),
    )
    parser.add_argument(
        "--project",
        help=(
            "Directory used by Ultralytics to store training and validation runs. "
            "Defaults to /kaggle/working/runs on Kaggle, otherwise recognition/runs."
        ),
    )
    parser.add_argument(
        "--model",
        default="yolov8n.pt",
        help="YOLO model weights or model name used for training.",
    )
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs.")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size.")
    parser.add_argument("--batch", type=int, default=16, help="Batch size.")
    parser.add_argument(
        "--workers",
        type=int,
        default=max(1, os.cpu_count() or 1),
        help="Workers used for data preparation and YOLO dataloaders.",
    )
    parser.add_argument(
        "--optimizer",
        default="AdamW",
        help="Optimizer passed to Ultralytics training.",
    )
    parser.add_argument(
        "--lr0",
        type=float,
        default=1e-3,
        help="Initial learning rate passed to Ultralytics training.",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=10,
        help="Early stopping patience used by Ultralytics.",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.2,
        help="Fraction carved out from the source train split for validation.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed used during train/val splitting.",
    )
    parser.add_argument(
        "--name",
        default="animals_v8n",
        help="Run name under the project directory.",
    )
    parser.add_argument(
        "--device",
        default="",
        help="Optional training device, for example 0 or cpu.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete the existing converted work directory before rebuilding it.",
    )
    parser.add_argument(
        "--prepare-only",
        action="store_true",
        help="Only build the YOLO dataset and dataset.yaml without starting training.",
    )
    parser.add_argument(
        "--skip-test-val",
        action="store_true",
        help="Skip the final validation run on the prepared test split.",
    )
    return parser.parse_args()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def running_on_kaggle() -> bool:
    return Path("/kaggle/working").exists()


def default_work_dir() -> Path:
    return Path("/kaggle/working/animals_yolo") if running_on_kaggle() else DEFAULT_LOCAL_WORK_DIR


def default_project_dir() -> Path:
    return Path("/kaggle/working/runs") if running_on_kaggle() else DEFAULT_LOCAL_RUNS_DIR


def import_kagglehub():
    try:
        import kagglehub
    except ImportError as exc:
        raise RuntimeError(
            "kagglehub is not installed. Install it first, then rerun this script."
        ) from exc
    return kagglehub


def import_yaml():
    try:
        import yaml
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is not installed. Install project dependencies first, then rerun this script."
        ) from exc
    return yaml


def import_pil_image():
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "Pillow is not installed. Install project dependencies first, then rerun this script."
        ) from exc
    return Image


def import_yolo():
    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise RuntimeError(
            "ultralytics is not installed. Install project dependencies first, then rerun training."
        ) from exc
    return YOLO


def sanitize_name(value: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-")
    return sanitized or "item"


def download_dataset_to_local(dataset_handle: str) -> Path:
    kagglehub = import_kagglehub()
    cache_dir = Path(kagglehub.dataset_download(dataset_handle)).resolve()
    target_dir = RAW_DATA_DIR / sanitize_name(dataset_handle.rsplit("/", maxsplit=1)[-1])

    ensure_dir(RAW_DATA_DIR)
    if target_dir.exists():
        print(f"[dataset] using existing local dataset copy: {target_dir}")
        return target_dir

    shutil.copytree(cache_dir, target_dir)
    print(f"[dataset] downloaded via KaggleHub to: {target_dir}")
    return target_dir


def resolve_dataset_root(args: argparse.Namespace) -> Path:
    if args.dataset_path:
        dataset_root = Path(args.dataset_path).expanduser().resolve()
        if not dataset_root.exists():
            raise FileNotFoundError(f"Dataset path not found: {dataset_root}")
        print(f"[dataset] using explicit dataset path: {dataset_root}")
        return dataset_root

    if DEFAULT_KAGGLE_DATASET_ROOT.exists():
        print(f"[dataset] using Kaggle input dataset: {DEFAULT_KAGGLE_DATASET_ROOT}")
        return DEFAULT_KAGGLE_DATASET_ROOT

    if DEFAULT_LOCAL_DATASET_ROOT.exists():
        print(f"[dataset] using local cached dataset: {DEFAULT_LOCAL_DATASET_ROOT}")
        return DEFAULT_LOCAL_DATASET_ROOT.resolve()

    return download_dataset_to_local(args.dataset_handle)


def resolve_work_dir(args: argparse.Namespace) -> Path:
    if args.work_dir:
        return Path(args.work_dir).expanduser().resolve()
    return default_work_dir().resolve()


def resolve_project_dir(args: argparse.Namespace) -> Path:
    if args.project:
        return Path(args.project).expanduser().resolve()
    return default_project_dir().resolve()


def prepare_output_root(work_dir: Path, force: bool) -> None:
    if work_dir.exists():
        if force:
            shutil.rmtree(work_dir)
        elif any(work_dir.iterdir()):
            raise FileExistsError(
                f"Work directory already exists and is not empty: {work_dir}. "
                "Use --force to rebuild it."
            )

    for split in ("train", "val", "test"):
        ensure_dir(work_dir / split / "images")
        ensure_dir(work_dir / split / "labels")


def sorted_class_names(classes: Iterable[str]) -> list[str]:
    return sorted(set(classes), key=lambda item: item.casefold())


def discover_classes(dataset_root: Path) -> list[str]:
    classes: set[str] = set()
    for split_name in ("train", "test"):
        split_dir = dataset_root / split_name
        if not split_dir.exists():
            continue
        for entry in split_dir.iterdir():
            if entry.is_dir() and entry.name.lower() not in SKIP_DIR_NAMES:
                classes.add(entry.name)

    if not classes:
        raise RuntimeError(
            f"No class directories were found under {dataset_root / 'train'} or {dataset_root / 'test'}."
        )

    return sorted_class_names(classes)


def iter_image_files(class_dir: Path) -> list[Path]:
    return sorted(
        [
            path
            for path in class_dir.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
        ],
        key=lambda item: item.name.casefold(),
    )


def find_label(stem: str, class_dir: Path, split_dir: Path) -> Path | None:
    for folder_name in ("Label", "Labels"):
        for base_dir in (class_dir, split_dir):
            label_path = base_dir / folder_name / f"{stem}.txt"
            if label_path.exists():
                return label_path
    return None


def build_output_stem(dataset_root: Path, class_name: str, image_path: Path) -> str:
    relative_path = image_path.relative_to(dataset_root).as_posix()
    digest = hashlib.sha1(relative_path.encode("utf-8")).hexdigest()[:10]
    return f"{sanitize_name(class_name)}__{image_path.stem}__{digest}"


def collect_samples(dataset_root: Path, split_name: str) -> list[Sample]:
    split_dir = dataset_root / split_name
    if not split_dir.exists():
        return []

    samples: list[Sample] = []
    for class_dir in sorted(split_dir.iterdir(), key=lambda item: item.name.casefold()):
        if not class_dir.is_dir() or class_dir.name.lower() in SKIP_DIR_NAMES:
            continue

        for image_path in iter_image_files(class_dir):
            label_path = find_label(image_path.stem, class_dir, split_dir)
            if not label_path:
                continue
            samples.append(
                Sample(
                    class_name=class_dir.name,
                    image_path=image_path,
                    label_path=label_path,
                    output_stem=build_output_stem(dataset_root, class_dir.name, image_path),
                )
            )
    return samples


def split_train_val(
    samples: list[Sample],
    val_ratio: float,
    seed: int,
) -> tuple[list[Sample], list[Sample]]:
    if not 0 <= val_ratio < 1:
        raise ValueError("--val-ratio must be in the range [0, 1).")

    grouped: dict[str, list[Sample]] = defaultdict(list)
    for sample in samples:
        grouped[sample.class_name].append(sample)

    rng = random.Random(seed)
    train_samples: list[Sample] = []
    val_samples: list[Sample] = []

    for class_name in sorted_class_names(grouped):
        class_samples = list(grouped[class_name])
        rng.shuffle(class_samples)

        val_count = int(len(class_samples) * val_ratio)
        if val_ratio > 0 and len(class_samples) > 1 and val_count == 0:
            val_count = 1
        if val_count >= len(class_samples):
            val_count = max(0, len(class_samples) - 1)

        val_samples.extend(class_samples[:val_count])
        train_samples.extend(class_samples[val_count:])

    rng.shuffle(train_samples)
    rng.shuffle(val_samples)
    return train_samples, val_samples


def parse_label_line(line: str, ordered_classes: list[str]) -> tuple[str, float, float, float, float] | None:
    text = line.strip()
    if not text:
        return None

    for class_name in ordered_classes:
        if not text.startswith(class_name):
            continue
        remainder = text[len(class_name) :].strip()
        parts = remainder.split()
        if len(parts) < 4:
            continue
        try:
            x1, y1, x2, y2 = map(float, parts[:4])
        except ValueError:
            continue
        return class_name, x1, y1, x2, y2

    return None


def convert_label(
    raw_label_path: Path,
    image_path: Path,
    output_label_path: Path,
    class2id: dict[str, int],
    ordered_classes: list[str],
) -> int:
    Image = import_pil_image()

    try:
        with Image.open(image_path) as image:
            img_w, img_h = image.size
    except Exception as exc:
        print(f"[warn] cannot open image {image_path}: {exc}")
        output_label_path.write_text("", encoding="utf-8")
        return 0

    rows: list[str] = []
    for line in raw_label_path.read_text(encoding="utf-8").splitlines():
        parsed = parse_label_line(line, ordered_classes)
        if parsed is None:
            print(f'[warn] cannot parse line in {raw_label_path}: "{line}"')
            continue

        class_name, x1, y1, x2, y2 = parsed
        if x2 <= x1 or y2 <= y1:
            print(f'[warn] invalid box in {raw_label_path}: "{line}"')
            continue

        cx = ((x1 + x2) / 2.0) / img_w
        cy = ((y1 + y2) / 2.0) / img_h
        bw = (x2 - x1) / img_w
        bh = (y2 - y1) / img_h
        cx, cy, bw, bh = [min(max(value, 0.0), 1.0) for value in (cx, cy, bw, bh)]

        if bw <= 0 or bh <= 0:
            print(f'[warn] zero-sized box after normalization in {raw_label_path}: "{line}"')
            continue

        rows.append(f"{class2id[class_name]} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

    output_label_path.write_text("\n".join(rows), encoding="utf-8")
    return len(rows)


def copy_and_convert_sample(
    sample: Sample,
    destination_split: str,
    work_dir: Path,
    class2id: dict[str, int],
    ordered_classes: list[str],
) -> bool:
    output_image_path = work_dir / destination_split / "images" / f"{sample.output_stem}{sample.image_path.suffix.lower()}"
    output_label_path = work_dir / destination_split / "labels" / f"{sample.output_stem}.txt"
    shutil.copy2(sample.image_path, output_image_path)
    return convert_label(sample.label_path, sample.image_path, output_label_path, class2id, ordered_classes) > 0


def populate_split(
    samples: list[Sample],
    destination_split: str,
    work_dir: Path,
    class2id: dict[str, int],
    ordered_classes: list[str],
    workers: int,
) -> None:
    if not samples:
        print(f"[dataset] {destination_split}: no samples")
        return

    converted_count = 0
    max_workers = max(1, workers)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(
                copy_and_convert_sample,
                sample,
                destination_split,
                work_dir,
                class2id,
                ordered_classes,
            )
            for sample in samples
        ]
        for future in as_completed(futures):
            if future.result():
                converted_count += 1

    print(
        f"[dataset] {destination_split}: {converted_count}/{len(samples)} images "
        f"with at least one box converted"
    )


def write_dataset_yaml(work_dir: Path, classes: list[str]) -> Path:
    yaml = import_yaml()
    dataset_yaml = {
        "path": str(work_dir),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(classes),
        "names": classes,
    }
    yaml_path = work_dir / "dataset.yaml"
    yaml_text = yaml.safe_dump(dataset_yaml, allow_unicode=True, sort_keys=False)
    yaml_path.write_text(yaml_text, encoding="utf-8")
    CANONICAL_DATASET_YAML.write_text(yaml_text, encoding="utf-8")
    print(f"[dataset] yaml written to: {yaml_path}")
    print(f"[dataset] yaml synced to: {CANONICAL_DATASET_YAML}")
    return yaml_path


def prepare_dataset(args: argparse.Namespace) -> tuple[Path, Path, list[str]]:
    dataset_root = resolve_dataset_root(args)
    work_dir = resolve_work_dir(args)
    prepare_output_root(work_dir, args.force)

    classes = discover_classes(dataset_root)
    class2id = {class_name: index for index, class_name in enumerate(classes)}
    ordered_classes = sorted(classes, key=len, reverse=True)

    train_samples = collect_samples(dataset_root, "train")
    test_samples = collect_samples(dataset_root, "test")
    if not train_samples:
        raise RuntimeError(f"No train samples were found under {dataset_root / 'train'}.")
    if not test_samples:
        raise RuntimeError(f"No test samples were found under {dataset_root / 'test'}.")

    train_set, val_set = split_train_val(train_samples, args.val_ratio, args.seed)

    print(f"[dataset] source root: {dataset_root}")
    print(f"[dataset] classes ({len(classes)}): {classes}")
    print(f"[dataset] train source pairs: {len(train_samples)}")
    print(f"[dataset] split train -> train: {len(train_set)}, val: {len(val_set)}")
    print(f"[dataset] test source pairs: {len(test_samples)}")
    print(f"[dataset] output root: {work_dir}")
    print(f"[dataset] workers: {max(1, args.workers)}")

    populate_split(train_set, "train", work_dir, class2id, ordered_classes, args.workers)
    populate_split(val_set, "val", work_dir, class2id, ordered_classes, args.workers)
    populate_split(test_samples, "test", work_dir, class2id, ordered_classes, args.workers)

    yaml_path = write_dataset_yaml(work_dir, classes)
    return dataset_root, yaml_path, classes


def train_model(args: argparse.Namespace, yaml_path: Path, project_dir: Path) -> Path:
    YOLO = import_yolo()
    ensure_dir(project_dir)

    model = YOLO(args.model)
    train_kwargs: dict[str, Any] = {
        "data": str(yaml_path),
        "epochs": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "workers": max(1, args.workers),
        "optimizer": args.optimizer,
        "lr0": args.lr0,
        "patience": args.patience,
        "augment": True,
        "plots": True,
        "project": str(project_dir),
        "name": args.name,
        "exist_ok": True,
    }
    if args.device:
        train_kwargs["device"] = args.device

    print(f"[train] model: {args.model}")
    print(f"[train] project: {project_dir}")
    results = model.train(**train_kwargs)

    save_dir = Path(results.save_dir)
    best_weights = save_dir / "weights" / "best.pt"
    print(f"[train] best weights: {best_weights}")
    return best_weights


def validate_on_test_split(
    weights_path: Path,
    yaml_path: Path,
    args: argparse.Namespace,
    project_dir: Path,
) -> None:
    if not weights_path.exists():
        print(f"[val] best weights not found, skipping test validation: {weights_path}")
        return

    YOLO = import_yolo()
    model = YOLO(str(weights_path))
    print(f"[val] running validation on test split with weights: {weights_path}")
    model.val(
        data=str(yaml_path),
        split="test",
        imgsz=args.imgsz,
        batch=args.batch,
        workers=max(1, args.workers),
        project=str(project_dir),
        name=f"{args.name}-test",
        exist_ok=True,
    )


def main() -> None:
    args = parse_args()
    _, yaml_path, _ = prepare_dataset(args)

    if args.prepare_only:
        print("[train] prepare-only mode enabled, training skipped.")
        return

    project_dir = resolve_project_dir(args)
    best_weights = train_model(args, yaml_path, project_dir)
    if not args.skip_test_val:
        validate_on_test_split(best_weights, yaml_path, args, project_dir)


if __name__ == "__main__":
    main()
