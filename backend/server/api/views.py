# backend/api/views.py
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Record, Detection
from recognition.detector import detect_image
from recognition.class_map import get_label
from django.core.files.base import ContentFile



@csrf_exempt
def detect(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    # 1️⃣ 保存 Record
    record = Record.objects.create(
        image=image,
        image_width=image.image.width if hasattr(image, "image") else 0,
        image_height=image.image.height if hasattr(image, "image") else 0
    )

    # 2️⃣ YOLO 推理
    image_path = record.image.path
    results = detect_image(image_path)

    detections_response = []

    # 3️⃣ 保存 Detection
    for det in results:
        class_id = det["class_id"]
        label = get_label(class_id)

        detection = Detection.objects.create(
            record=record,
            class_id=class_id,
            label=label,
            confidence=det["confidence"],
            x1=det["bbox"][0],
            y1=det["bbox"][1],
            x2=det["bbox"][2],
            y2=det["bbox"][3]
        )

        detections_response.append({
            "class_id": detection.class_id,
            "label": detection.label,
            "confidence": detection.confidence,
            "bbox": [detection.x1, detection.y1, detection.x2, detection.y2]
        })

    return JsonResponse({
        "record_id": record.id,
        "detections": detections_response
    })


def record_list(request):
    if request.method != "GET":
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    records = Record.objects.order_by("-created_at")
    data = []

    for r in records:
        data.append({
            "id": r.id,
            "image": r.image.url if r.image else "",
            "time": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "count": r.detections.count()
        })

    return JsonResponse({"records": data})


def record_detail(request, record_id):
    if request.method != "GET":
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        return JsonResponse({"error": "找不到该记录"}, status=404)

    detections = []
    for d in record.detections.all():
        detections.append({
            "class_id": d.class_id,
            "label": d.label,
            "confidence": d.confidence,
            "bbox": [d.x1, d.y1, d.x2, d.y2]
        })

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