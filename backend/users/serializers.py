from django.contrib.auth.models import User
from decimal import Decimal
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ExpenseEntry, PurchaseEntry, SalesEntry, UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    pan = serializers.RegexField(regex=r"^\d{9,10}$", required=True)
    institution_name = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default="accountant")

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "pan", "institution_name", "full_name", "role"]

    def validate_pan(self, value):
        if UserProfile.objects.filter(pan=value).exists():
            raise serializers.ValidationError("An account with this PAN already exists.")
        return value

    def validate_role(self, value):
        # Public signup cannot self-assign admin privileges.
        if value == "admin":
            raise serializers.ValidationError("Admin accounts can only be created by an existing admin.")
        return value

    def create(self, validated_data):
        pan = validated_data.pop("pan")
        institution_name = validated_data.pop("institution_name", "")
        full_name = validated_data.pop("full_name", "")
        role = validated_data.pop("role", "accountant")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        if full_name:
            user.first_name = full_name
            user.save(update_fields=["first_name"])

        UserProfile.objects.create(
            user=user,
            pan=pan,
            institution_name=institution_name,
            full_name=full_name,
            role=role,
            is_verified=False,
        )

        return user


class AdminCreateUserSerializer(RegisterSerializer):
    def validate_role(self, value):
        return value

    def validate_pan(self, value):
        # For admin-created users, allow duplicate PANs within same institution
        # Check if this PAN exists for a different institution
        existing = UserProfile.objects.filter(pan=value).first()
        if existing:
            # If same PAN exists, it's okay (team members can share business PAN)
            # Just validate format
            pass
        return value

    def create(self, validated_data):
        user = super().create(validated_data)
        if hasattr(user, "profile"):
            user.profile.is_verified = True
            user.profile.save(update_fields=["is_verified"])
        return user


class ManagerCreateUserSerializer(RegisterSerializer):
    def validate_role(self, value):
        if value not in ("accountant", "auditor"):
            raise serializers.ValidationError("Business owners can only create accountant or auditor accounts.")
        return value

    def validate_pan(self, value):
        # For manager-created users, allow duplicate PANs (team members share business PAN)
        return value

    def create(self, validated_data):
        # Get the manager's profile to auto-fill institution_name and pan
        from rest_framework.exceptions import ValidationError as DRFValidationError
        
        manager = self.context.get('request').user
        if not hasattr(manager, 'profile'):
            raise DRFValidationError("Manager profile not found.")
        
        # Force institution_name and pan from manager's profile
        validated_data['institution_name'] = manager.profile.institution_name
        validated_data['pan'] = manager.profile.pan
        
        user = super().create(validated_data)
        if hasattr(user, "profile"):
            user.profile.is_verified = True
            user.profile.save(update_fields=["is_verified"])
        return user


class AccountInfoSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    full_name = serializers.CharField(allow_blank=True)
    institution_name = serializers.CharField(allow_blank=True)
    pan = serializers.CharField()
    role = serializers.CharField()
    is_verified = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class UserSerializer(serializers.ModelSerializer):
    institution_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    pan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "institution_name", "role", "is_verified", "pan"]

    def get_institution_name(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.institution_name
        return ""

    def get_role(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.role
        return "accountant"

    def get_is_verified(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.is_verified
        return False

    def get_pan(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.pan
        return ""


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow login with username, email, or PAN."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed role in JWT claims
        if hasattr(user, "profile"):
            token["role"] = user.profile.role
        else:
            token["role"] = "accountant"
        return token

    def validate(self, attrs):
        identifier = attrs.get("username") or attrs.get("email")

        if identifier:
            user = User.objects.filter(email__iexact=identifier).first()

            if not user and identifier.isdigit():
                profile = UserProfile.objects.filter(pan=identifier).select_related("user").first()
                if profile:
                    user = profile.user

            if user:
                attrs["username"] = user.username

                if hasattr(user, "profile") and user.profile.role != "admin" and not user.profile.is_verified:
                    raise ValidationError({"detail": "Your account is pending admin verification."})

        return super().validate(attrs)


class SalesEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesEntry
        fields = [
            "id",
            "amount",
            "buyer_pan_vat",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "vat_amount",
            "total_amount",
            "bill_file_name",
            "created_at",
        ]
        read_only_fields = ["id", "vat_amount", "total_amount", "created_at"]

    def validate_buyer_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Buyer PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re

        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def create(self, validated_data):
        amount = validated_data["amount"]
        vat_amount = amount * Decimal("0.13")
        total_amount = amount + vat_amount
        return SalesEntry.objects.create(
            user=self.context["request"].user,
            vat_amount=vat_amount,
            total_amount=total_amount,
            **validated_data,
        )


class PurchaseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseEntry
        fields = [
            "id",
            "amount",
            "supplier_pan_vat",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "vat_amount",
            "total_amount",
            "bill_file_name",
            "created_at",
        ]
        read_only_fields = ["id", "vat_amount", "total_amount", "created_at"]

    def validate_supplier_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Supplier PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re

        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def create(self, validated_data):
        amount = validated_data["amount"]
        vat_amount = amount * Decimal("0.13")
        total_amount = amount + vat_amount
        return PurchaseEntry.objects.create(
            user=self.context["request"].user,
            vat_amount=vat_amount,
            total_amount=total_amount,
            **validated_data,
        )


class ExpenseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseEntry
        fields = [
            "id",
            "amount",
            "expense_type",
            "vendor_pan_vat",
            "tds_rate",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "vat_amount",
            "tds_amount",
            "total_amount",
            "bill_file_name",
            "created_at",
        ]
        read_only_fields = ["id", "vat_amount", "tds_amount", "total_amount", "created_at"]

    def validate_vendor_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Vendor PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re

        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def create(self, validated_data):
        amount = validated_data["amount"]
        tds_rate = validated_data.get("tds_rate", Decimal("0"))
        expense_type = validated_data.get("expense_type", "")

        vat_amount = amount * Decimal("0.13")

        if expense_type in ("salary", "other"):
            tds_amount = amount * (tds_rate / Decimal("100"))
        else:
            tds_amount = Decimal("0")

        total_amount = amount + vat_amount - tds_amount
        return ExpenseEntry.objects.create(
            user=self.context["request"].user,
            vat_amount=vat_amount,
            tds_amount=tds_amount,
            total_amount=total_amount,
            **validated_data,
        )


# Update Serializers for editing existing entries (recalculates VAT, TDS)

class UpdateSalesEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesEntry
        fields = [
            "id",
            "amount",
            "buyer_pan_vat",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "bill_file_name",
        ]
        read_only_fields = ["id"]

    def validate_buyer_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Buyer PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def update(self, instance, validated_data):
        # Update basic fields
        instance.amount = validated_data.get("amount", instance.amount)
        instance.buyer_pan_vat = validated_data.get("buyer_pan_vat", instance.buyer_pan_vat)
        instance.nepali_date = validated_data.get("nepali_date", instance.nepali_date)
        instance.fiscal_year = validated_data.get("fiscal_year", instance.fiscal_year)
        instance.period_bucket = validated_data.get("period_bucket", instance.period_bucket)
        instance.bill_file_name = validated_data.get("bill_file_name", instance.bill_file_name)
        
        # Recalculate VAT
        amount = instance.amount
        instance.vat_amount = amount * Decimal("0.13")
        instance.total_amount = amount + instance.vat_amount
        
        instance.save()
        return instance


class UpdatePurchaseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseEntry
        fields = [
            "id",
            "amount",
            "supplier_pan_vat",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "bill_file_name",
        ]
        read_only_fields = ["id"]

    def validate_supplier_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Supplier PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def update(self, instance, validated_data):
        # Update basic fields
        instance.amount = validated_data.get("amount", instance.amount)
        instance.supplier_pan_vat = validated_data.get("supplier_pan_vat", instance.supplier_pan_vat)
        instance.nepali_date = validated_data.get("nepali_date", instance.nepali_date)
        instance.fiscal_year = validated_data.get("fiscal_year", instance.fiscal_year)
        instance.period_bucket = validated_data.get("period_bucket", instance.period_bucket)
        instance.bill_file_name = validated_data.get("bill_file_name", instance.bill_file_name)
        
        # Recalculate VAT
        amount = instance.amount
        instance.vat_amount = amount * Decimal("0.13")
        instance.total_amount = amount + instance.vat_amount
        
        instance.save()
        return instance


class UpdateExpenseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseEntry
        fields = [
            "id",
            "amount",
            "expense_type",
            "vendor_pan_vat",
            "tds_rate",
            "nepali_date",
            "fiscal_year",
            "period_bucket",
            "bill_file_name",
        ]
        read_only_fields = ["id"]

    def validate_vendor_pan_vat(self, value):
        if not value.isdigit() or len(value) not in (9, 10):
            raise serializers.ValidationError("Vendor PAN/VAT must be 9 to 10 digits.")
        return value

    def validate_nepali_date(self, value):
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
            raise serializers.ValidationError("Date must be in Nepali BS format YYYY-MM-DD.")
        return value

    def update(self, instance, validated_data):
        # Update basic fields
        instance.amount = validated_data.get("amount", instance.amount)
        instance.expense_type = validated_data.get("expense_type", instance.expense_type)
        instance.vendor_pan_vat = validated_data.get("vendor_pan_vat", instance.vendor_pan_vat)
        instance.tds_rate = validated_data.get("tds_rate", instance.tds_rate)
        instance.nepali_date = validated_data.get("nepali_date", instance.nepali_date)
        instance.fiscal_year = validated_data.get("fiscal_year", instance.fiscal_year)
        instance.period_bucket = validated_data.get("period_bucket", instance.period_bucket)
        instance.bill_file_name = validated_data.get("bill_file_name", instance.bill_file_name)
        
        # Recalculate VAT and TDS
        amount = instance.amount
        expense_type = instance.expense_type
        tds_rate = instance.tds_rate
        
        instance.vat_amount = amount * Decimal("0.13")
        
        if expense_type in ("salary", "other"):
            instance.tds_amount = amount * (tds_rate / Decimal("100"))
        else:
            instance.tds_amount = Decimal("0")
        
        instance.total_amount = amount + instance.vat_amount - instance.tds_amount
        
        instance.save()
        return instance


class UpdateUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information."""
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email"]

    def update(self, instance, validated_data):
        if "first_name" in validated_data:
            instance.first_name = validated_data["first_name"]
        if "last_name" in validated_data:
            instance.last_name = validated_data["last_name"]
        if "email" in validated_data:
            instance.email = validated_data["email"]
        instance.save()
        return instance


class UpdateUserFullProfileSerializer(serializers.Serializer):
    """Serializer for updating both User and UserProfile information."""
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False, allow_blank=True)
    institution_name = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        user = instance
        profile = user.profile if hasattr(user, "profile") else None
        
        # Update User fields
        if "first_name" in validated_data:
            user.first_name = validated_data["first_name"]
        if "last_name" in validated_data:
            user.last_name = validated_data["last_name"]
        if "email" in validated_data:
            user.email = validated_data["email"]
        user.save()
        
        # Update UserProfile fields
        if profile:
            if "full_name" in validated_data:
                profile.full_name = validated_data["full_name"]
            if "institution_name" in validated_data and user.profile.role == "admin":
                # Admins can update institution name
                profile.institution_name = validated_data["institution_name"]
            profile.save()
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password with old password verification."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise ValidationError({"new_password_confirm": "Passwords do not match."})
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise ValidationError("Old password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
