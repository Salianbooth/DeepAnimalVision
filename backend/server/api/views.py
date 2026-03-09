import json

from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from recognition.class_map import get_label
from recognition.detector import detect_image
from users.models import User

from .models import Detection, Record


def get_authenticated_user(request):
    if request.user.is_authenticated:
        return request.user
    return None


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
        return JsonResponse({"error": "Username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        role="user",
    )

    print(f"[register] user created: {user.username}")

    return JsonResponse(
        {
            "msg": "Register success",
            "user_id": user.id,
            "username": user.username,
        }
    )


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
        return JsonResponse({"error": "Username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid username or password"}, status=401)

    login(request, user)

    print(f"[login] success: {user.username}")

    return JsonResponse(
        {
            "msg": "Login success",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
            },
        }
    )


@csrf_exempt
def detect(request):
    print("====== [detect] request ======")

    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    record = Record.objects.create(
        user=user,
        image=image,
        image_width=image.image.width if hasattr(image, "image") else 0,
        image_height=image.image.height if hasattr(image, "image") else 0,
    )

    results = detect_image(record.image.path)
    detections_response = []

    for det in results:
        detection = Detection.objects.create(
            record=record,
            class_id=det["class_id"],
            label=get_label(det["class_id"]),
            confidence=det["confidence"],
            x1=det["bbox"][0],
            y1=det["bbox"][1],
            x2=det["bbox"][2],
            y2=det["bbox"][3],
        )

        detections_response.append(
            {
                "class_id": detection.class_id,
                "label": detection.label,
                "confidence": detection.confidence,
                "bbox": [detection.x1, detection.y1, detection.x2, detection.y2],
            }
        )

    return JsonResponse({"record_id": record.id, "detections": detections_response})


def record_list(request):
    print("====== [record_list] request ======")

    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    records = Record.objects.filter(user=user).order_by("-created_at")
    data = []

    for record in records:
        data.append(
            {
                "id": record.id,
                "image": record.image.url if record.image else "",
                "time": record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "count": record.detections.count(),
            }
        )

    return JsonResponse({"records": data})


def record_detail(request, record_id):
    print(f"====== [record_detail] request record_id={record_id} ======")

    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    try:
        record = Record.objects.get(id=record_id, user=user)
    except Record.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)

    detections = []
    for detection in record.detections.all():
        detections.append(
            {
                "class_id": detection.class_id,
                "label": detection.label,
                "confidence": detection.confidence,
                "bbox": [detection.x1, detection.y1, detection.x2, detection.y2],
            }
        )

    return JsonResponse(
        {
            "id": record.id,
            "image": record.image.url if record.image else "",
            "image_width": record.image_width,
            "image_height": record.image_height,
            "detections": detections,
            "time": record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )


@csrf_exempt
def record_delete(request, record_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    try:
        record = Record.objects.get(id=record_id, user=user)
    except Record.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)

    record.delete()
    return JsonResponse({"success": True})


@csrf_exempt
def record_clear(request):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    Record.objects.filter(user=user).delete()
    return JsonResponse({"success": True})
