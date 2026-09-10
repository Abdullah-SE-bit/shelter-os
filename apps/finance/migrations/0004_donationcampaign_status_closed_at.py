from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0003_alter_donationcampaign_shelter'),
    ]

    operations = [
        migrations.AddField(
            model_name='donationcampaign',
            name='status',
            field=models.CharField(
                choices=[('ACTIVE', 'Active'), ('COMPLETED', 'Completed'), ('INCOMPLETE', 'Incomplete')],
                default='ACTIVE',
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name='donationcampaign',
            name='closed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
