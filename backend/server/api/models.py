# backend/api/models.py
from django.db import models

# Create your models here.
from django.db import models

class Record(models.Model):
    image = models.ImageField(upload_to='records/')
    created_at = models.DateTimeField(auto_now_add=True)

    image_width = models.IntegerField()
    image_height = models.IntegerField()

    def __str__(self):
        return f"Record {self.id} @ {self.created_at}"

class Detection(models.Model):
    record = models.ForeignKey(
        Record,
        related_name='detections',
        on_delete=models.CASCADE
    )

    # class_id = models.IntegerField()
    label = models.CharField(max_length=50)
    confidence = models.FloatField()

    x1 = models.FloatField()
    y1 = models.FloatField()
    x2 = models.FloatField()
    y2 = models.FloatField()

    def __str__(self):
        return f"{self.label} ({self.confidence:.2f})"
