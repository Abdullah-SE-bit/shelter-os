from django.db import migrations


# Approximate city-centre coordinates for the controlled CITIES list. Stored in
# each LookupValue.metadata so the Create-Shelter map can centre on the chosen
# city and so the backend can enforce that a picked location falls within it.
CITY_COORDS = {
    'Karachi':          (24.8607, 67.0011),
    'Lahore':           (31.5204, 74.3587),
    'Islamabad':        (33.6844, 73.0479),
    'Rawalpindi':       (33.5651, 73.0169),
    'Faisalabad':       (31.4504, 73.1350),
    'Multan':           (30.1575, 71.5249),
    'Peshawar':         (34.0151, 71.5249),
    'Quetta':           (30.1798, 66.9750),
    'Hyderabad':        (25.3960, 68.3578),
    'Gujranwala':       (32.1877, 74.1945),
    'Sialkot':          (32.4945, 74.5229),
    'Bahawalpur':       (29.3956, 71.6836),
    'Sargodha':         (32.0836, 72.6711),
    'Sukkur':           (27.7052, 68.8574),
    'Larkana':          (27.5590, 68.2123),
    'Sheikhupura':      (31.7131, 73.9783),
    'Abbottabad':       (34.1688, 73.2215),
    'Mardan':           (34.1979, 72.0451),
    'Mingora':          (34.7795, 72.3620),
    'Gujrat':           (32.5731, 74.0789),
    'Sahiwal':          (30.6682, 73.1114),
    'Wah Cantonment':   (33.7973, 72.7411),
    'Dera Ghazi Khan':  (30.0561, 70.6344),
    'Nawabshah':        (26.2442, 68.4100),
    'Mirpur Khas':      (25.5276, 69.0111),
}

# Generous radius so a city's metro area / suburbs are accepted.
DEFAULT_RADIUS_KM = 45


def seed_coords(apps, schema_editor):
    LookupValue = apps.get_model('core', 'LookupValue')
    for lv in LookupValue.objects.filter(category__name='CITIES'):
        coords = CITY_COORDS.get(lv.display_label)
        if not coords:
            continue  # e.g. "Other" has no fixed centre
        meta = dict(lv.metadata or {})
        meta.update({'lat': coords[0], 'lng': coords[1], 'radius_km': DEFAULT_RADIUS_KM})
        lv.metadata = meta
        lv.save(update_fields=['metadata'])


def unseed_coords(apps, schema_editor):
    LookupValue = apps.get_model('core', 'LookupValue')
    for lv in LookupValue.objects.filter(category__name='CITIES'):
        meta = dict(lv.metadata or {})
        for key in ('lat', 'lng', 'radius_km'):
            meta.pop(key, None)
        lv.metadata = meta
        lv.save(update_fields=['metadata'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_seed_cities'),
    ]

    operations = [
        migrations.RunPython(seed_coords, unseed_coords),
    ]
