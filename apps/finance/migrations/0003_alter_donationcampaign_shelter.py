import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0002_alter_donation_payment_reference'),
    ]

    operations = [
        migrations.AlterField(
            model_name='donationcampaign',
            name='shelter',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='shelters.shelter',
            ),
        ),
    ]
