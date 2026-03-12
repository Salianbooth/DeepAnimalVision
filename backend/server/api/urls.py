# # backend/api/urls.py
from django.urls import path
from .views import (
    admin_create_user,
    admin_delete_user,
    admin_overview,
    admin_reset_user_password,
    admin_update_user_role,
    admin_user_list,
    detect,
    record_list,
    record_detail,
    record_delete,
    record_clear
)
from . import views
urlpatterns = [
    path("admin/overview/", admin_overview),
    path("admin/users/", admin_user_list),
    path("admin/users/create/", admin_create_user),
    path("admin/users/<int:user_id>/password/", admin_reset_user_password),
    path("admin/users/<int:user_id>/role/", admin_update_user_role),
    path("admin/users/<int:user_id>/delete/", admin_delete_user),
    path("detect/", detect),
    path("records/", record_list),
    path("records/<int:record_id>/", record_detail),
    path("records/<int:record_id>/delete/", record_delete),
    path("records/clear/", record_clear),
    path("register/", views.register),
    path("login/", views.login_view),
]
