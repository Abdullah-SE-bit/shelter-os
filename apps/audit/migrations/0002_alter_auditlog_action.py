from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                choices=[
                    ('LOGIN', 'Login'),
                    ('LOGOUT', 'Logout'),
                    ('CREATE', 'Create'),
                    ('UPDATE', 'Update'),
                    ('DELETE', 'Delete'),
                    ('VIEW_SENSITIVE', 'View Sensitive'),
                    ('EXPORT', 'Export'),
                    ('ROLE_CHANGE', 'Role Change'),
                    ('USER_DEACTIVATED', 'User Deactivated'),
                    ('USER_ACTIVATED', 'User Activated'),
                    ('CAMPAIGN_COMPLETED', 'Campaign Complete'),
                    ('CAMPAIGN_INCOMPLETE', 'Campaign Not Complete'),
                    ('FAILED', 'Failed'),
                ],
                max_length=30,
            ),
        ),
    ]
