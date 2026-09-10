from django.db import migrations


# C2: Seed the cat_breeds lookup so the "Register Cat" breed dropdown is populated.
# Stored under LookupCategory name 'BREED' (matches the frontend `/lookup/BREED/`
# call and the cats app's clean_request_data breed handling).
BREEDS = [
    'Domestic Shorthair',
    'Domestic Longhair',
    'Persian',
    'Siamese',
    'Maine Coon',
    'Bengal',
    'Ragdoll',
    'British Shorthair',
    'Sphynx',
    'Scottish Fold',
    'Abyssinian',
    'Russian Blue',
    'American Shorthair',
    'Norwegian Forest Cat',
    'Turkish Angora',
    'Birman',
    'Oriental Shorthair',
    'Devon Rex',
    'Burmese',
    'Tabby',
    'Unknown / Mixed',
]


def seed_breeds(apps, schema_editor):
    LookupCategory = apps.get_model('core', 'LookupCategory')
    LookupValue = apps.get_model('core', 'LookupValue')

    category, _ = LookupCategory.objects.get_or_create(
        name='BREED',
        defaults={'description': 'Cat breeds', 'is_active': True},
    )

    for index, label in enumerate(BREEDS):
        value = label.upper().replace(' / ', '_').replace(' ', '_').replace('-', '_')
        LookupValue.objects.get_or_create(
            category=category,
            value=value,
            defaults={
                'display_label': label,
                'sort_order': index,
                'is_active': True,
            },
        )


def unseed_breeds(apps, schema_editor):
    LookupCategory = apps.get_model('core', 'LookupCategory')
    LookupValue = apps.get_model('core', 'LookupValue')
    LookupValue.objects.filter(category__name='BREED').delete()
    LookupCategory.objects.filter(name='BREED').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_breeds, unseed_breeds),
    ]
