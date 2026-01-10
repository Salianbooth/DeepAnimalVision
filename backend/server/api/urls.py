# api/urls.py
from django.urls import path
from .views import (
    detect,
    history_list,
    history_detail,
    history_delete,
    history_clear,
)

urlpatterns = [
    # 🔍 图片识别
    path("detect/", detect, name="detect"),

    # 🕘 历史记录
    path("history/", history_list, name="history_list"),           # GET
    path("history/<int:record_id>/", history_detail, name="history_detail"),  # GET
    path("history/<int:record_id>/delete/", history_delete, name="history_delete"),  # DELETE
    path("history/clear/", history_clear, name="history_clear"),   # DELETE
]
