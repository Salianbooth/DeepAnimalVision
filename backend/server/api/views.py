import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from PIL import Image

from recognition.detector import detect_image
from .models import Record, Detection


@csrf_exempt
def detect(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    image_file = request.FILES.get("image")
    if not image_file:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    # =========================
    # 1. 保存临时图片
    # =========================
    temp_path = "temp.jpg"
    with open(temp_path, "wb+") as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    # 读取图片尺寸
    img = Image.open(temp_path)
    width, height = img.size

    # =========================
    # 2. 调用 YOLO 识别
    # =========================
    results = detect_image(temp_path)
    """
    results 示例：
    [
      {
        "class_id": 0,
        "label": "cat",
        "confidence": 0.87,
        "bbox": [x1, y1, x2, y2]
      }
    ]
    """

    # =========================
    # 3. 创建 Record
    # =========================
    record = Record.objects.create(
        image_width=width,
        image_height=height
    )

    # 保存图片到 ImageField
    record.image.save(
        image_file.name,
        ContentFile(image_file.read()),
        save=True
    )

    # =========================
    # 4. 批量创建 Detection
    # =========================
    detections_response = []

    for det in results:
        x1, y1, x2, y2 = det["bbox"]

        detection = Detection.objects.create(
            record=record,
            label=det.get("label", "unknown"),
            confidence=det["confidence"],
            x1=x1,
            y1=y1,
            x2=x2,
            y2=y2
        )

        detections_response.append({
            "label": detection.label,
            "confidence": detection.confidence,
            "bbox": [x1, y1, x2, y2]
        })

    return JsonResponse({
        "record_id": record.id,
        "image": record.image.url,
        "image_width": width,
        "image_height": height,
        "detections": detections_response
    })
