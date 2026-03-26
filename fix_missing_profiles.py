#!/usr/bin/env python
import os
import sys
import django

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

# Find all users without profiles
users_without_profile = User.objects.filter(profile__isnull=True)

print(f"Found {users_without_profile.count()} users without profiles")

for user in users_without_profile:
    role = "admin" if user.is_superuser else "accountant"
    profile = UserProfile.objects.create(
        user=user,
        pan="0000000000",
        role=role,
        is_verified=user.is_superuser,
    )
    print(f"Created profile for {user.username} with role: {role}")

print("Done!")
