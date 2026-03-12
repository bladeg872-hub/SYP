from django.contrib.auth.models import User
from decimal import Decimal
from rest_framework import serializers
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
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    institution_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "institution_name", "role"]

    def get_institution_name(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.institution_name
        return ""

    def get_role(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.role
        return "accountant"


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
