from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "admin"
        )


class IsAccountant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "accountant"
        )


class IsAuditor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "auditor"
        )


class IsAdminOrAccountant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role in ("admin", "manager", "accountant")
        )


class IsAdminOrAuditor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role in ("admin", "auditor")
        )


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role in ("admin", "manager")
        )


class IsOwnerOrManagerCanEdit(BasePermission):
    """
    Allow users to edit their own entries.
    Also allow managers to edit entries of their team members.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not hasattr(request.user, "profile"):
            return False
        
        # User can edit their own entries
        if obj.user == request.user:
            return True
        
        # Manager can edit team member's entries if in same institution
        if request.user.profile.role == "manager":
            if hasattr(obj.user, "profile"):
                return obj.user.profile.institution_name == request.user.profile.institution_name
        
        return False


class IsAdminOrCanUpdateProfile(BasePermission):
    """
    Allow admins to update any user profile.
    Allow users to update their own profile.
    Allow managers to update team member profiles.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not hasattr(request.user, "profile"):
            return False
        
        # Admin can update any profile
        if request.user.profile.role == "admin":
            return True
        
        # User can update own profile
        if obj.user == request.user:
            return True
        
        # Manager can update team member profiles
        if request.user.profile.role == "manager":
            if hasattr(obj.user, "profile"):
                return obj.user.profile.institution_name == request.user.profile.institution_name
        
        return False
