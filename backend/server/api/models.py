# backend/api/models.py
from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class Record(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # 指向自定义 User
        related_name='records',  # user.records.all() 可以拿到这个用户的所有记录
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='records/')
    created_at = models.DateTimeField(auto_now_add=True)

    image_width = models.IntegerField()
    image_height = models.IntegerField()

    def __str__(self):
        return f"Record {self.id} by {self.user.username} @ {self.created_at}"

class Detection(models.Model):
    record = models.ForeignKey(
        Record,
        related_name='detections',
        on_delete=models.CASCADE
    )

    class_id = models.IntegerField()          # ✅ 模型原始输出
    label = models.CharField(max_length=50)   # ✅ 语义标签（英文）

    confidence = models.FloatField()

    x1 = models.FloatField()
    y1 = models.FloatField()
    x2 = models.FloatField()
    y2 = models.FloatField()

    def __str__(self):
        return f"[{self.class_id}] {self.label} ({self.confidence:.2f})"

