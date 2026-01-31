# backend/api/views.py
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Record, Detection
from recognition.detector import detect_image
from recognition.class_map import get_label
from django.core.files.base import ContentFile

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from users.models import User
import json


@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"error": "用户名和密码不能为空"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "用户名已存在"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        role="user"
    )

    print(f"[register] 新用户注册: {user.username}")

    return JsonResponse({
        "msg": "注册成功",
        "user_id": user.id,
        "username": user.username
    })
from django.contrib.auth import authenticate, login


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"error": "用户名或密码不能为空"}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse({"error": "用户名或密码错误"}, status=401)

    login(request, user)

    print(f"[login] 用户登录成功: {user.username}")

    return JsonResponse({
        "msg": "登录成功",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    })


@csrf_exempt
def detect(request):
    print("====== [detect] 请求进入 ======")

    if request.method != "POST":
        print("[detect] 非 POST 请求")
        return JsonResponse({"error": "POST only"}, status=405)

    image = request.FILES.get("image")
    if not image:
        print("[detect] 未上传图片")
        return JsonResponse({"error": "No image uploaded"}, status=400)

    print(f"[detect] 接收到图片: {image.name}, size={image.size}")

    # 1️⃣ 保存 Record
    record = Record.objects.create(
        image=image,
        image_width=image.image.width if hasattr(image, "image") else 0,
        image_height=image.image.height if hasattr(image, "image") else 0
    )

    print(f"[detect] Record 已创建: id={record.id}")

    # 2️⃣ YOLO 推理
    image_path = record.image.path
    print(f"[detect] 开始 YOLO 推理, path={image_path}")

    results = detect_image(image_path)
    print(f"[detect] YOLO 推理完成, 检测到 {len(results)} 个目标")

    detections_response = []

    # 3️⃣ 保存 Detection
    for i, det in enumerate(results):
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

        print(
            f"[detect] Detection #{i+1}: "
            f"class_id={class_id}, label={label}, conf={det['confidence']:.2f}"
        )

        detections_response.append({
            "class_id": detection.class_id,
            "label": detection.label,
            "confidence": detection.confidence,
            "bbox": [detection.x1, detection.y1, detection.x2, detection.y2]
        })

    print(f"[detect] 请求完成, record_id={record.id}")
    print("====== [detect] 结束 ======\n")

    return JsonResponse({
        "record_id": record.id,
        "detections": detections_response
    })


def record_list(request):
    print("====== [record_list] 请求进入 ======")

    if request.method != "GET":
        print("[record_list] 非 GET 请求")
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    records = Record.objects.order_by("-created_at")
    print(f"[record_list] 查询到 {records.count()} 条记录")

    data = []

    for r in records:
        print(
            f"[record_list] Record id={r.id}, "
            f"time={r.created_at}, detections={r.detections.count()}"
        )

        data.append({
            "id": r.id,
            "image": r.image.url if r.image else "",
            "time": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "count": r.detections.count()
        })

    print("====== [record_list] 结束 ======\n")

    return JsonResponse({"records": data})


def record_detail(request, record_id):
    print(f"====== [record_detail] 请求进入 record_id={record_id} ======")

    if request.method != "GET":
        print("[record_detail] 非 GET 请求")
        return JsonResponse({"error": "仅支持 GET 请求"}, status=405)

    try:
        record = Record.objects.get(id=record_id)
    except Record.DoesNotExist:
        print(f"[record_detail] Record {record_id} 不存在")
        return JsonResponse({"error": "找不到该记录"}, status=404)

    print(
        f"[record_detail] Record 找到: "
        f"id={record.id}, detections={record.detections.count()}"
    )

    detections = []
    for d in record.detections.all():
        print(
            f"[record_detail] Detection: "
            f"label={d.label}, conf={d.confidence:.2f}"
        )

        detections.append({
            "class_id": d.class_id,
            "label": d.label,
            "confidence": d.confidence,
            "bbox": [d.x1, d.y1, d.x2, d.y2]
        })

    print("====== [record_detail] 结束 ======\n")

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