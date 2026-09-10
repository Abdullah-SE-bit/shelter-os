from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import SystemConfig, LookupCategory, LookupValue
from .serializers import SystemConfigSerializer, LookupValueSerializer
from .permissions import IsSuperAdmin
from .responses import success_response, error_response


class SystemConfigListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        configs = SystemConfig.objects.all()
        return success_response(SystemConfigSerializer(configs, many=True).data)


class SystemConfigUpdateView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, key):
        try:
            config = SystemConfig.objects.get(config_key=key)
        except SystemConfig.DoesNotExist:
            return error_response("NOT_FOUND", f"Config key '{key}' not found", 404)
        config.config_value = request.data.get('value', config.config_value)
        config.save()
        return success_response(SystemConfigSerializer(config).data)


class LookupValuesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, category):
        values = LookupValue.objects.filter(
            category__name=category, is_active=True
        ).order_by('sort_order')
        return success_response(LookupValueSerializer(values, many=True).data)

    def post(self, request, category):
        if request.user.role != 'SUPER_ADMIN':
            return error_response("ACCESS_DENIED", "Only SUPER_ADMIN can add lookup values", 403)
        try:
            cat = LookupCategory.objects.get(name=category)
        except LookupCategory.DoesNotExist:
            return error_response("NOT_FOUND", f"Category '{category}' not found", 404)
        value = request.data.get('value')
        if LookupValue.objects.filter(category=cat, value=value).exists():
            return error_response("DUPLICATE", f"Value '{value}' already exists in '{category}'", 409)
        lv = LookupValue.objects.create(
            category=cat,
            value=value,
            display_label=request.data.get('display_label', value),
            sort_order=request.data.get('sort_order', 0),
        )
        return success_response(LookupValueSerializer(lv).data, status_code=201)
