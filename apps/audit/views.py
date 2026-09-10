from rest_framework.views import APIView

from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.core.permissions import IsSuperAdmin
from apps.core.responses import success_response


class AuditLogListView(APIView):
	permission_classes = [IsSuperAdmin]

	def get(self, request):
		qs = AuditLog.objects.all().select_related('actor', 'actor__profile')
		if request.query_params.get('action'):
			qs = qs.filter(action=request.query_params['action'])
		if request.query_params.get('entity_type'):
			qs = qs.filter(entity_type=request.query_params['entity_type'])
		if request.query_params.get('actor_id'):
			qs = qs.filter(actor_id=request.query_params['actor_id'])
		# Optional date-range filters (B3/B4): performed_at__date bounds.
		if request.query_params.get('date_from'):
			qs = qs.filter(performed_at__date__gte=request.query_params['date_from'])
		if request.query_params.get('date_to'):
			qs = qs.filter(performed_at__date__lte=request.query_params['date_to'])
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 50))
		total = qs.count()
		logs = qs[(page - 1) * page_size: page * page_size]
		return success_response({
			'results': AuditLogSerializer(logs, many=True).data,
			'count': total,
			'page': page,
			'page_size': page_size,
		})


class EntityHistoryView(APIView):
	permission_classes = [IsSuperAdmin]

	def get(self, request, entity_type, entity_id):
		logs = AuditLog.objects.filter(entity_type=entity_type, entity_id=entity_id).order_by('performed_at')
		return success_response(AuditLogSerializer(logs, many=True).data)


class UserAuditView(APIView):
	permission_classes = [IsSuperAdmin]

	def get(self, request, user_id):
		logs = AuditLog.objects.filter(actor_id=user_id).order_by('-performed_at')[:100]
		return success_response(AuditLogSerializer(logs, many=True).data)
