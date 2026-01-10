# api/urls.py
from django.urls import path
from .views import (
    detect,
    record_list,
    record_detail,
    record_delete,
    record_clear
)

urlpatterns = [
    path("detect/", detect),
    path("records/", record_list),
    path("records/<int:record_id>/", record_detail),
    path("records/<int:record_id>/delete/", record_delete),
    path("records/clear/", record_clear),
]
