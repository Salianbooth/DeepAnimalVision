# backend/api/views.py
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Record, Detection
from recognition.detector import detect_image
from django.core.files.base import ContentFile

YOLO_CLASS_MAP = {
    0: "person",
    5: "bus",
    11: "stop sign",
}

@csrf_exempt
def detect(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    # 1️⃣ 把上传文件直接存成 Record（Django 自动写磁盘）
    record = Record.objects.create(
        image=image,
        image_width=image.image.width if hasattr(image, "image") else 0,
        image_height=image.image.height if hasattr(image, "image") else 0
    )

    # 2️⃣ 用“已经保存到磁盘的图片路径”做 YOLO 推理
    image_path = record.image.path
    results = detect_image(image_path)

    # 3️⃣ 保存 Detection
    for det in results:
        class_id = det["class_id"]

        Detection.objects.create(
            record=record,
            # class_id=class_id,
            label=YOLO_CLASS_MAP.get(class_id, "未知"),
            confidence=det["confidence"],
            x1=det["bbox"][0],
            y1=det["bbox"][1],
            x2=det["bbox"][2],
            y2=det["bbox"][3]
        )

    return JsonResponse({
        "record_id": record.id,
        "detections": results
    })


def record_list(request):
    """
    接口：获取所有历史识别记录列表
    """
    if request.method != "GET":
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    # --- 控制台打印：开始获取列表 ---
    print(f"\n[INFO] 正在获取识别记录列表...")

    records = Record.objects.order_by("-created_at")
    data = []
    for r in records:
        detection_count = r.detections.count()
        data.append({
            "id": r.id,
            "image": r.image.url if r.image else "",
            "time": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "count": detection_count
        })

    # --- 控制台打印：结果统计 ---
    print(f">>> 成功检索到 {len(data)} 条记录")

    return JsonResponse({"records": data})


def record_detail(request, record_id):
    """
    接口：根据 ID 获取某条记录的详细信息
    """
    if request.method != "GET":
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    # --- 控制台打印：请求详情 ---
    print(f"\n[INFO] 正在查询记录详情 - ID: {record_id}")

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        # --- 控制台打印：错误警告 ---
        print(f">>> [ERROR] 未找到 ID 为 {record_id} 的记录！")
        return JsonResponse({"error": "找不到该记录"}, status=404)

    detections = []
    for d in record.detections.all():
        detections.append({
            # "class_id": d.class_id,
            "label": d.label,
            "confidence": d.confidence,
            "bbox": [d.x1, d.y1, d.x2, d.y2]
        })

    # --- 控制台打印：详细信息结果 ---
    print(f">>> 查询成功：图片尺寸 {record.image_width}x{record.image_height}，检测到 {len(detections)} 个目标")
    for det in detections:
        print(f"    - 标签: {det['label']}, 置信度: {det['confidence']:.2f}")

    return JsonResponse({
        "id": record.id,
        "image": record.image.url if record.image else "",
        "image_width": record.image_width,
        "image_height": record.image_height,
        "detections": detections,
        "time": record.created_at.strftime("%Y-%m-%d %H:%M:%S")
    })

@csrf_exempt
def record_delete(request, record_id):
    """
    接口：根据 ID 删除特定的历史记录（及其关联的检测详情）
    请求方法：DELETE
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "仅支持 DELETE 请求"}, status=405)

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        return JsonResponse({"error": "记录已不存在"}, status=404)

    # 删除记录（Django 默认会级联删除关联的 Detection）
    record.delete()
    return JsonResponse({"success": True})


@csrf_exempt
def record_clear(request):
    """
    接口：清空数据库中所有的历史识别记录
    请求方法：DELETE
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "仅支持 DELETE 请求"}, status=405)

    # 删除所有记录
    Record.objects.all().delete()
    return JsonResponse({"success": True})