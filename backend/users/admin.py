from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "pan", "role", "institution_name", "created_at")
    list_filter = ("role",)
    search_fields = ("user__username", "full_name", "pan", "institution_name")
