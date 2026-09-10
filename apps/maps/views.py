import math
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.core.responses import success_response


class MapMarkersView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		sw_lat = float(request.query_params.get('swLat', 30))
		sw_lng = float(request.query_params.get('swLng', 70))
		ne_lat = float(request.query_params.get('neLat', 36))
		ne_lng = float(request.query_params.get('neLng', 75))
		types = request.query_params.get('types', 'rescue,lost,shelter').split(',')
		markers = []

		if 'rescue' in types:
			from apps.rescue.models import RescueReport

			for report in RescueReport.objects.filter(
				status__in=['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
				is_deleted=False,
				latitude__range=(sw_lat, ne_lat),
				longitude__range=(sw_lng, ne_lng),
			):
				markers.append(
					{
						'type': 'RESCUE',
						'id': str(report.id),
						'lat': report.latitude,
						'lng': report.longitude,
						'title': f"Rescue: {report.urgency_level}",
						'urgency_level': report.urgency_level,
						'status': report.status,
					}
				)

		if 'lost' in types:
			from apps.lost_found.models import LostCatAlert

			for alert in LostCatAlert.objects.filter(
				status='ACTIVE',
				is_deleted=False,
				last_seen_latitude__range=(sw_lat, ne_lat),
				last_seen_longitude__range=(sw_lng, ne_lng),
			):
				markers.append(
					{
						'type': 'LOST_CAT',
						'id': str(alert.id),
						'lat': alert.last_seen_latitude,
						'lng': alert.last_seen_longitude,
						'title': alert.title,
						'status': alert.status,
					}
				)

		if 'shelter' in types:
			from apps.shelters.models import Shelter

			for shelter in Shelter.objects.filter(
				is_active=True,
				is_deleted=False,
				latitude__range=(sw_lat, ne_lat),
				longitude__range=(sw_lng, ne_lng),
			):
				markers.append(
					{
						'type': 'SHELTER',
						'id': str(shelter.id),
						'lat': shelter.latitude,
						'lng': shelter.longitude,
						'title': shelter.name,
					}
				)

		return success_response(markers)


class ShelterLocationsView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		from apps.shelters.models import Shelter

		shelters = Shelter.objects.filter(is_active=True, is_deleted=False, latitude__isnull=False)
		return success_response(
			[
				{
					'id': str(s.id),
					'name': s.name,
					'city': s.city,
					'lat': s.latitude,
					'lng': s.longitude,
				}
				for s in shelters
			]
		)


class RescueMapView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		from apps.rescue.models import RescueReport

		qs = RescueReport.objects.filter(status__in=['PENDING', 'ASSIGNED', 'IN_PROGRESS'], is_deleted=False)
		lat = request.query_params.get('lat')
		lng = request.query_params.get('lng')
		radius = float(request.query_params.get('radiusKm', 20))

		if lat and lng:
			lat = float(lat)
			lng = float(lng)

			def in_radius(report):
				dlat = math.radians(report.latitude - lat)
				dlng = math.radians(report.longitude - lng)
				a = (
					math.sin(dlat / 2) ** 2
					+ math.cos(math.radians(lat))
					* math.cos(math.radians(report.latitude))
					* math.sin(dlng / 2) ** 2
				)
				return 6371 * 2 * math.asin(math.sqrt(a)) <= radius

			qs = [r for r in qs if r.latitude and r.longitude and in_radius(r)]

		return success_response(
			[
				{
					'id': str(r.id),
					'lat': r.latitude,
					'lng': r.longitude,
					'urgency_level': r.urgency_level,
					'status': r.status,
				}
				for r in qs
			]
		)


class LostCatsMapView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		from apps.lost_found.models import LostCatAlert

		qs = LostCatAlert.objects.filter(status='ACTIVE', is_deleted=False)
		return success_response(
			[
				{
					'id': str(a.id),
					'lat': a.last_seen_latitude,
					'lng': a.last_seen_longitude,
					'title': a.title,
					'status': a.status,
				}
				for a in qs
			]
		)


class RescueHeatmapView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		from apps.rescue.models import RescueReport

		qs = RescueReport.objects.filter(is_deleted=False, latitude__isnull=False)
		weights = {'CRITICAL': 1.0, 'HIGH': 0.75, 'MEDIUM': 0.5, 'LOW': 0.25}
		return success_response(
			[{'lat': r.latitude, 'lng': r.longitude, 'weight': weights.get(r.urgency_level, 0.5)} for r in qs]
		)


class AbandonmentHeatmapView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		from apps.shelters.models import IntakeRecord

		qs = IntakeRecord.objects.filter(intake_source='STRAY_FOUND').select_related('shelter')
		return success_response(
			[
				{'lat': r.shelter.latitude, 'lng': r.shelter.longitude, 'weight': 1.0}
				for r in qs
				if r.shelter.latitude
			]
		)
