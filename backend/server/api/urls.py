# # backend/api/urls.py
from django.urls import path
from .views import (
    detect,
    record_list,
    record_detail,
    record_delete,
    record_clear
)
from . import views
urlpatterns = [
    path("detect/", detect),
    path("records/", record_list),
    path("records/<int:record_id>/", record_detail),
    path("records/<int:record_id>/delete/", record_delete),
    path("records/clear/", record_clear),
    path("register/", views.register),
    path("login/", views.login_view),
]
