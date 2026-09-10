import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.accounts.models import User, UserProfile
from apps.shelters.models import Shelter
from apps.cats.models import Cat
from apps.core.models import LookupCategory, LookupValue
from apps.volunteers.models import VolunteerProfile

def seed_db():
    print("Clearing existing basic data (except Lookups)...")
    Cat.objects.all().delete()
    Shelter.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()

    print("Creating Lookups...")
    breed_category, _ = LookupCategory.objects.get_or_create(name='BREED')
    persian, _ = LookupValue.objects.get_or_create(category=breed_category, value='PERSIAN', defaults={'display_label': 'Persian'})
    siamese, _ = LookupValue.objects.get_or_create(category=breed_category, value='SIAMESE', defaults={'display_label': 'Siamese'})
    shorthair, _ = LookupValue.objects.get_or_create(category=breed_category, value='DSH', defaults={'display_label': 'Domestic Shorthair'})

    print("Creating Users...")
    # Superuser
    if not User.objects.filter(email='admin@pawtrack.com').exists():
        admin = User.objects.create_superuser('admin@pawtrack.com', 'admin123')
        UserProfile.objects.create(user=admin, first_name='Super', last_name='Admin')
    else:
        admin = User.objects.get(email='admin@pawtrack.com')

    # Shelter Admin
    shelter_admin = User.objects.create_user('shelter@pawtrack.com', 'admin123', role='SHELTER_ADMIN')
    UserProfile.objects.create(user=shelter_admin, first_name='Shelter', last_name='Admin')

    # Vet
    vet = User.objects.create_user('vet@pawtrack.com', 'admin123', role='VET')
    UserProfile.objects.create(user=vet, first_name='Dr. Cat', last_name='Vet')

    # Volunteer
    volunteer = User.objects.create_user('volunteer@pawtrack.com', 'admin123', role='VOLUNTEER')
    UserProfile.objects.create(user=volunteer, first_name='Happy', last_name='Volunteer')
    VolunteerProfile.objects.create(user=volunteer, bio='Avid cat lover ready to help rescutes!')

    print("Creating Shelter...")
    shelter = Shelter.objects.create(
        name='Happy Paws Shelter',
        registration_number='REG-12345',
        city='Lahore',
        capacity_total=50,
        admin=shelter_admin,
        description='A lovely shelter for street cats.'
    )

    print("Creating Cats...")
    cats_data = [
        {'name': 'Luna', 'breed': persian, 'gender': 'FEMALE', 'age_years': 2, 'color': 'White', 'status': 'IN_SHELTER'},
        {'name': 'Oliver', 'breed': siamese, 'gender': 'MALE', 'age_years': 1, 'color': 'Brown/Black', 'status': 'IN_SHELTER'},
        {'name': 'Milo', 'breed': shorthair, 'gender': 'MALE', 'age_years': 0, 'age_months': 6, 'color': 'Orange Tabby', 'status': 'FOSTERED'},
        {'name': 'Bella', 'breed': shorthair, 'gender': 'FEMALE', 'age_years': 3, 'color': 'Calico', 'status': 'ADOPTED'},
    ]

    for data in cats_data:
        Cat.objects.create(
            name=data['name'],
            breed=data['breed'],
            gender=data['gender'],
            age_years=data['age_years'],
            age_months=data.get('age_months', 0),
            color=data['color'],
            current_status=data['status'],
            shelter=shelter if data['status'] == 'IN_SHELTER' else None
        )
    
    print("Seeding Complete!")
    print("Credentials to test with:")
    print("- admin@pawtrack.com / admin123 (SUPER_ADMIN)")
    print("- shelter@pawtrack.com / admin123 (SHELTER_ADMIN)")
    print("- vet@pawtrack.com / admin123 (VET)")
    print("- volunteer@pawtrack.com / admin123 (VOLUNTEER)")

if __name__ == '__main__':
    seed_db()
