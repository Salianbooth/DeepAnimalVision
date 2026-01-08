import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from recognition.detector import detect_image


@csrf_exempt
def detect(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"})

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"})

    # 临时保存图片
    save_path = os.path.join("temp.jpg")
    with open(save_path, "wb+") as f:
        for chunk in image.chunks():
            f.write(chunk)

    # 调 YOLO
    results = detect_image(save_path)

    return JsonResponse({
        "detections": results
    })
