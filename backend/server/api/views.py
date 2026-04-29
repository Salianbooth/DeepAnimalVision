import json

from django.db.models import Count
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


def get_admin_user(request):
    user = get_authenticated_user(request)
    if user is None or user.role != "admin":
        return None
    return user


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


def admin_overview(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    total_users = User.objects.filter(role="user").count()
    total_admins = User.objects.filter(role="admin").count()
    total_records = Record.objects.count()
    total_detections = Detection.objects.count()

    recent_users = [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "joined_at": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for user in User.objects.order_by("-date_joined")[:6]
    ]

    recent_records = [
        {
            "id": record.id,
            "username": record.user.username,
            "image": record.image.url if record.image else "",
            "created_at": record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "detection_count": record.detections.count(),
        }
        for record in Record.objects.select_related("user").order_by("-created_at")[:8]
    ]

    top_labels = [
        {
            "label": item["label"],
            "count": item["count"],
        }
        for item in Detection.objects.values("label").annotate(count=Count("id")).order_by("-count", "label")[:6]
    ]

    return JsonResponse(
        {
            "summary": {
                "total_users": total_users,
                "total_admins": total_admins,
                "total_records": total_records,
                "total_detections": total_detections,
            },
            "recent_users": recent_users,
            "recent_records": recent_records,
            "top_labels": top_labels,
        }
    )


def admin_user_list(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    users = [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "joined_at": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
            "record_count": user.records.count(),
        }
        for user in User.objects.order_by("-date_joined")
    ]

    return JsonResponse({"users": users})


@csrf_exempt
def admin_create_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    role = data.get("role") or "user"

    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    if role not in {"user", "admin"}:
        return JsonResponse({"error": "Invalid role"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        role=role,
        is_staff=role == "admin",
        is_superuser=role == "admin",
    )

    return JsonResponse(
        {
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "is_active": user.is_active,
                "joined_at": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
                "record_count": 0,
            }
        },
        status=201,
    )


@csrf_exempt
def admin_update_user_role(request, user_id):
    if request.method not in {"PATCH", "POST"}:
        return JsonResponse({"error": "PATCH or POST only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    role = data.get("role")
    if role not in {"user", "admin"}:
        return JsonResponse({"error": "Invalid role"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if user.id == admin_user.id and role != "admin":
        return JsonResponse({"error": "You cannot remove your own admin role"}, status=400)

    user.role = role
    user.is_staff = role == "admin"
    user.is_superuser = role == "admin"
    user.save(update_fields=["role", "is_staff", "is_superuser"])

    return JsonResponse(
        {
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "is_active": user.is_active,
                "joined_at": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
                "record_count": user.records.count(),
            }
        }
    )


@csrf_exempt
def admin_delete_user(request, user_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if user.id == admin_user.id:
        return JsonResponse({"error": "You cannot delete your own account"}, status=400)

    user.delete()
    return JsonResponse({"success": True})


@csrf_exempt
def admin_reset_user_password(request, user_id):
    if request.method not in {"PATCH", "POST"}:
        return JsonResponse({"error": "PATCH or POST only"}, status=405)

    admin_user = get_admin_user(request)
    if admin_user is None:
        return JsonResponse({"error": "Forbidden"}, status=403)

    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    password = data.get("password") or ""
    if not password:
        return JsonResponse({"error": "Password is required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    user.set_password(password)
    user.save(update_fields=["password"])

    return JsonResponse({"success": True})


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
        label = det.get("label") or get_label(det["class_id"])
        detection = Detection.objects.create(
            record=record,
            class_id=det["class_id"],
            label=label,
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


def record_stats(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    label_counts = (
        Detection.objects.filter(record__user=user)
        .values("label")
        .annotate(count=Count("id"))
        .order_by("-count", "label")
    )

    return JsonResponse({"stats": [{"label": item["label"], "count": item["count"]} for item in label_counts]})
