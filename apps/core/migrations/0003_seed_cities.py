from django.db import migrations


# E1: controlled list of cities for the create-shelter form. Stored under
# LookupCategory 'CITIES'. display_label is what the shelter.city stores.
CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur',
    'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura', 'Abbottabad', 'Mardan',
    'Mingora', 'Gujrat', 'Sahiwal', 'Wah Cantonment', 'Dera Ghazi Khan',
    'Nawabshah', 'Mirpur Khas', 'Other',
]


def seed_cities(apps, schema_editor):
    LookupCategory = apps.get_model('core', 'LookupCategory')
    LookupValue = apps.get_model('core', 'LookupValue')
    category, _ = LookupCategory.objects.get_or_create(
        name='CITIES',
        defaults={'description': 'Cities', 'is_active': True},
    )
    for index, label in enumerate(CITIES):
        LookupValue.objects.get_or_create(
            category=category,
            value=label.upper().replace(' ', '_'),
            defaults={'display_label': label, 'sort_order': index, 'is_active': True},
        )


def unseed_cities(apps, schema_editor):
    LookupCategory = apps.get_model('core', 'LookupCategory')
    LookupValue = apps.get_model('core', 'LookupValue')
    LookupValue.objects.filter(category__name='CITIES').delete()
    LookupCategory.objects.filter(name='CITIES').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_seed_cat_breeds'),
    ]

    operations = [
        migrations.RunPython(seed_cities, unseed_cities),
    ]
