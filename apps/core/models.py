import uuid
from django.db import models


class SystemConfig(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    config_key   = models.CharField(max_length=200, unique=True)
    config_value = models.TextField()
    description  = models.TextField(blank=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_configs'

    def __str__(self):
        return self.config_key


class LookupCategory(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lookup_categories'

    def __str__(self):
        return self.name


class LookupValue(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category      = models.ForeignKey(LookupCategory, on_delete=models.CASCADE,
                                      related_name='values')
    value         = models.CharField(max_length=100)
    display_label = models.CharField(max_length=200)
    sort_order    = models.IntegerField(default=0)
    is_active     = models.BooleanField(default=True)
    metadata      = models.JSONField(default=dict, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lookup_values'
        unique_together = ('category', 'value')
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.category.name} — {self.display_label}"
