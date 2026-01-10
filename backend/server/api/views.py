import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Record, Detection
from recognition.detector import detect_image
from django.core.files.base import ContentFile


@csrf_exempt
def detect(request):
    """
    上传图片进行 YOLO 识别，并存储结果到数据库
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    # 临时保存图片
    save_path = os.path.join("temp.jpg")
    with open(save_path, "wb+") as f:
        for chunk in image.chunks():
            f.write(chunk)

    # 调 YOLO 识别
    results = detect_image(save_path)

    # 保存 Record 到数据库
    record = Record(
        image=ContentFile(image.read(), name=image.name),
        image_width=image.image.width if hasattr(image, "image") else 0,
        image_height=image.image.height if hasattr(image, "image") else 0
    )
    record.save()

    # 保存每个 Detection
    for det in results:
        Detection.objects.create(
            record=record,
            label=det.get("label", "未知"),
            confidence=det.get("confidence", 0),
            x1=det["bbox"][0],
            y1=det["bbox"][1],
            x2=det["bbox"][2],
            y2=det["bbox"][3]
        )

    return JsonResponse({"detections": results, "record_id": record.id})


def record_list(request):
    """
    获取历史记录列表
    """
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

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
    """
    获取某条记录的详细信息（包含每个检测框）
    """
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)

    detections = []
    for d in record.detections.all():
        detections.append({
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
    删除单条历史记录
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)

    record.delete()
    return JsonResponse({"success": True})


@csrf_exempt
def record_clear(request):
    """
    删除所有历史记录
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    Record.objects.all().delete()
    return JsonResponse({"success": True})
