#!/usr/bin/env python
import os
import sys
import django

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

users = User.objects.all()
for u in users:
    role = u.profile.role if hasattr(u, 'profile') else 'NO PROFILE'
    print(f'User: {u.username}, Role: {role}')

