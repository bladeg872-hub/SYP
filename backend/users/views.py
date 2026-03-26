from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ExpenseEntry, PurchaseEntry, SalesEntry
from .permissions import IsAdmin, IsAdminOrAccountant, IsAdminOrManager
from .serializers import (
    AccountInfoSerializer,
    AdminCreateUserSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
    ExpenseEntrySerializer,
    ManagerCreateUserSerializer,
    PurchaseEntrySerializer,
    RegisterSerializer,
    SalesEntrySerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class AdminCreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminOrManager]

    def get_serializer_class(self):
        if hasattr(self.request.user, "profile") and self.request.user.profile.role == "manager":
            return ManagerCreateUserSerializer
        return AdminCreateUserSerializer

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class VerifyUserView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request):
        user_id = request.data.get("user_id")
        new_role = request.data.get("role")

        if not user_id:
            return Response({"detail": "user_id is required."}, status=400)

        user = User.objects.filter(id=user_id).first()
        if not user or not hasattr(user, "profile"):
            return Response({"detail": "User not found."}, status=404)

        if new_role:
            allowed_roles = {choice[0] for choice in user.profile.ROLE_CHOICES if choice[0] != "admin"}
            if new_role not in allowed_roles:
                return Response({"detail": "Invalid role."}, status=400)
            user.profile.role = new_role

        user.profile.is_verified = True
        user.profile.save(update_fields=["role", "is_verified"] if new_role else ["is_verified"])

        return Response({"detail": "User verified successfully."})


class PendingUsersView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        pending_profiles = (
            User.objects.select_related("profile")
            .filter(profile__is_verified=False)
            .exclude(profile__role="admin")
            .order_by("-profile__created_at")
        )

        rows = [
            {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.profile.full_name,
                "institution_name": user.profile.institution_name,
                "pan": user.profile.pan,
                "role": user.profile.role,
                "is_verified": user.profile.is_verified,
                "created_at": user.profile.created_at,
            }
            for user in pending_profiles
        ]

        serializer = AccountInfoSerializer(rows, many=True)
        return Response({"results": serializer.data})


class AdminAccountsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = (
            User.objects.select_related("profile")
            .exclude(profile__role="admin")
            .order_by("-profile__created_at")
        )

        rows = [
            {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.profile.full_name,
                "institution_name": user.profile.institution_name,
                "pan": user.profile.pan,
                "role": user.profile.role,
                "is_verified": user.profile.is_verified,
                "created_at": user.profile.created_at,
            }
            for user in users
        ]

        serializer = AccountInfoSerializer(rows, many=True)
        return Response({"results": serializer.data})


class ManagerTeamMembersView(APIView):
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        """Get team members for the current manager (filtered by institution)."""
        if not hasattr(request.user, "profile"):
            return Response({"detail": "User profile not found."}, status=404)

        # Filter by institution_name for managers
        if request.user.profile.role == "manager":
            users = (
                User.objects.select_related("profile")
                .filter(profile__institution_name=request.user.profile.institution_name)
                .exclude(profile__role="admin")
                .exclude(id=request.user.id)  # Exclude self
                .order_by("-profile__created_at")
            )
        else:
            # Admins see all non-admin users
            users = (
                User.objects.select_related("profile")
                .exclude(profile__role="admin")
                .order_by("-profile__created_at")
            )

        rows = [
            {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.profile.full_name,
                "institution_name": user.profile.institution_name,
                "pan": user.profile.pan,
                "role": user.profile.role,
                "is_verified": user.profile.is_verified,
                "created_at": user.profile.created_at,
            }
            for user in users
        ]

        serializer = AccountInfoSerializer(rows, many=True)
        return Response({"results": serializer.data})


class DeclineUserView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request):
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"detail": "user_id is required."}, status=400)

        user = User.objects.filter(id=user_id).first()
        if not user or not hasattr(user, "profile"):
            return Response({"detail": "User not found."}, status=404)

        if user.profile.role == "admin":
            return Response({"detail": "Admin accounts cannot be declined."}, status=400)

        if user.profile.is_verified:
            return Response({"detail": "Only pending signup requests can be declined."}, status=400)

        user.delete()
        return Response({"detail": "Signup request declined successfully."})


class ManagerDeleteUserView(APIView):
    permission_classes = [IsAdminOrManager]

    def delete(self, request):
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"detail": "user_id is required."}, status=400)

        user_to_delete = User.objects.filter(id=user_id).first()
        if not user_to_delete or not hasattr(user_to_delete, "profile"):
            return Response({"detail": "User not found."}, status=404)

        # Prevent deletion of admin accounts
        if user_to_delete.profile.role == "admin":
            return Response({"detail": "Admin accounts cannot be deleted."}, status=400)

        # Managers can only delete users in their institution
        if hasattr(request.user, "profile") and request.user.profile.role == "manager":
            if user_to_delete.profile.institution_name != request.user.profile.institution_name:
                return Response(
                    {"detail": "You can only delete users in your organization."},
                    status=403,
                )

        user_to_delete.delete()
        return Response({"detail": "User deleted successfully."})


class SalesEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = SalesEntrySerializer
    permission_classes = [IsAdminOrAccountant]

    def get_queryset(self):
        return SalesEntry.objects.filter(user=self.request.user)


class PurchaseEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = PurchaseEntrySerializer
    permission_classes = [IsAdminOrAccountant]

    def get_queryset(self):
        return PurchaseEntry.objects.filter(user=self.request.user)


class ExpenseEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseEntrySerializer
    permission_classes = [IsAdminOrAccountant]

    def get_queryset(self):
        return ExpenseEntry.objects.filter(user=self.request.user)


def _aggregate_user(user):
    """Return aggregated totals for a user's entries."""
    sales_agg = SalesEntry.objects.filter(user=user).aggregate(
        total_sales=Sum("amount"),
        total_sales_vat=Sum("vat_amount"),
    )
    purchase_agg = PurchaseEntry.objects.filter(user=user).aggregate(
        total_purchases=Sum("amount"),
        total_purchases_vat=Sum("vat_amount"),
    )
    expense_agg = ExpenseEntry.objects.filter(user=user).aggregate(
        total_expenses=Sum("amount"),
        total_expenses_vat=Sum("vat_amount"),
        total_tds=Sum("tds_amount"),
    )

    total_sales = sales_agg["total_sales"] or Decimal("0")
    total_purchases = purchase_agg["total_purchases"] or Decimal("0")
    total_expenses = expense_agg["total_expenses"] or Decimal("0")
    total_vat = (
        (sales_agg["total_sales_vat"] or Decimal("0"))
        + (purchase_agg["total_purchases_vat"] or Decimal("0"))
        + (expense_agg["total_expenses_vat"] or Decimal("0"))
    )
    total_tds = expense_agg["total_tds"] or Decimal("0")
    net = total_sales - total_purchases - total_expenses

    return {
        "total_sales": str(total_sales),
        "total_purchases": str(total_purchases),
        "total_expenses": str(total_expenses),
        "total_vat": str(total_vat),
        "total_tds": str(total_tds),
        "net": str(net),
        "net_status": "profit" if net >= 0 else "loss",
    }


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = _aggregate_user(request.user)

        sales_rows = (
            SalesEntry.objects.filter(user=request.user)
            .values("nepali_date")
            .annotate(value=Sum("amount"))
            .order_by("nepali_date")
        )
        expense_rows = (
            ExpenseEntry.objects.filter(user=request.user)
            .values("nepali_date")
            .annotate(value=Sum("amount"))
            .order_by("nepali_date")
        )

        return Response({
            "summary": summary,
            "sales_trend": [{"name": r["nepali_date"], "value": str(r["value"])} for r in sales_rows],
            "expense_trend": [{"name": r["nepali_date"], "value": str(r["value"])} for r in expense_rows],
        })


class ReportsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _quarter_for_bs_date(nepali_date):
        """Map BS date to Nepal FY quarter with 3 quarters of 4 months.

        Q1: Shrawan-Kartik (months 04-07)
        Q2: Mangsir-Falgun (months 08-11)
        Q3: Chaitra-Asar (months 12,01,02,03)
        """
        try:
            month = int((nepali_date or "").split("-")[1])
        except (IndexError, ValueError, TypeError):
            return None

        if month in (4, 5, 6, 7):
            return "q1"
        if month in (8, 9, 10, 11):
            return "q2"
        if month in (12, 1, 2, 3):
            return "q3"
        return None

    def get(self, request):
        fiscal_year = request.query_params.get("fiscal_year", "")
        period = request.query_params.get("period", "")
        quarter = request.query_params.get("quarter", "")

        sales_qs = SalesEntry.objects.filter(user=request.user)
        purchase_qs = PurchaseEntry.objects.filter(user=request.user)
        expense_qs = ExpenseEntry.objects.filter(user=request.user)

        if fiscal_year:
            sales_qs = sales_qs.filter(fiscal_year=fiscal_year)
            purchase_qs = purchase_qs.filter(fiscal_year=fiscal_year)
            expense_qs = expense_qs.filter(fiscal_year=fiscal_year)

        if period and period != "annual":
            sales_qs = sales_qs.filter(period_bucket=period)
            purchase_qs = purchase_qs.filter(period_bucket=period)
            expense_qs = expense_qs.filter(period_bucket=period)

        # For annual reports, include monthly and quarterly details as well
        # instead of restricting to period_bucket="annual" only.
        if period == "quarterly" and quarter in ("q1", "q2", "q3"):
            sales_qs = [r for r in sales_qs if self._quarter_for_bs_date(r.nepali_date) == quarter]
            purchase_qs = [r for r in purchase_qs if self._quarter_for_bs_date(r.nepali_date) == quarter]
            expense_qs = [r for r in expense_qs if self._quarter_for_bs_date(r.nepali_date) == quarter]

            def _sum_list(rows, key):
                total = Decimal("0")
                for row in rows:
                    total += getattr(row, key) or Decimal("0")
                return total

            total_sales = _sum_list(sales_qs, "amount")
            total_purchases = _sum_list(purchase_qs, "amount")
            total_expenses = _sum_list(expense_qs, "amount")
            total_vat = _sum_list(sales_qs, "vat_amount") + _sum_list(purchase_qs, "vat_amount") + _sum_list(expense_qs, "vat_amount")
            total_tds = _sum_list(expense_qs, "tds_amount")
        else:
            total_sales = sales_qs.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            total_purchases = purchase_qs.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            total_expenses = expense_qs.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            total_vat = (
                (sales_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
                + (purchase_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
                + (expense_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
            )
            total_tds = expense_qs.aggregate(t=Sum("tds_amount"))["t"] or Decimal("0")

        net = total_sales - total_purchases - total_expenses

        return Response({
            "rows": [
                {"item": "Total Sales", "amount": str(total_sales)},
                {"item": "Total Purchases", "amount": str(total_purchases)},
                {"item": "Total Expenses", "amount": str(total_expenses)},
                {"item": "Total VAT", "amount": str(total_vat)},
                {"item": "Total TDS", "amount": str(total_tds)},
                {"item": "Net Profit/Loss", "amount": str(net)},
            ]
        })


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sales_trend = (
            SalesEntry.objects.filter(user=request.user)
            .values("nepali_date")
            .annotate(value=Sum("amount"))
            .order_by("nepali_date")
        )
        expense_trend = (
            ExpenseEntry.objects.filter(user=request.user)
            .values("nepali_date")
            .annotate(value=Sum("amount"))
            .order_by("nepali_date")
        )

        total_vat = (
            (SalesEntry.objects.filter(user=request.user).aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
            + (PurchaseEntry.objects.filter(user=request.user).aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
            + (ExpenseEntry.objects.filter(user=request.user).aggregate(t=Sum("vat_amount"))["t"] or Decimal("0"))
        )
        total_tds = ExpenseEntry.objects.filter(user=request.user).aggregate(t=Sum("tds_amount"))["t"] or Decimal("0")
        other_tax = Decimal("0")

        return Response({
            "sales_trend": [{"name": r["nepali_date"], "value": str(r["value"])} for r in sales_trend],
            "expense_trend": [{"name": r["nepali_date"], "value": str(r["value"])} for r in expense_trend],
            "tax_distribution": [
                {"name": "VAT", "value": str(total_vat)},
                {"name": "TDS", "value": str(total_tds)},
                {"name": "Other", "value": str(other_tax)},
            ],
        })


class AuditSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = _aggregate_user(request.user)

        institution_name = ""
        if hasattr(request.user, "profile"):
            institution_name = request.user.profile.institution_name

        return Response({
            "institution_name": institution_name,
            "fiscal_year": request.query_params.get("fiscal_year", ""),
            "rows": [
                {"section": "Total Sales", "detail": summary["total_sales"]},
                {"section": "Total Purchases", "detail": summary["total_purchases"]},
                {"section": "Total Expenses", "detail": summary["total_expenses"]},
                {"section": "VAT Collected", "detail": summary["total_vat"]},
                {"section": "TDS Deducted", "detail": summary["total_tds"]},
                {"section": "Net Profit/Loss", "detail": summary["net"]},
            ],
        })


class TdsCertificateGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fiscal_year = request.query_params.get("fiscal_year", "")
        
        # Get all expense entries with TDS for this fiscal year
        expense_qs = ExpenseEntry.objects.filter(user=request.user)
        if fiscal_year:
            expense_qs = expense_qs.filter(fiscal_year=fiscal_year)
        
        # Filter expenses with TDS amount > 0
        tds_expenses = [e for e in expense_qs if e.tds_amount and e.tds_amount > 0]
        
        institution_name = ""
        pan_vat = ""
        if hasattr(request.user, "profile"):
            institution_name = request.user.profile.institution_name
            pan_vat = request.user.profile.pan_vat_number
        
        # Calculate total TDS
        total_tds = sum(e.tds_amount for e in tds_expenses if e.tds_amount)
        
        # Prepare certificate data
        certificate_data = {
            "certificate_number": f"TDS-CERT-{request.user.id}-{fiscal_year}",
            "issued_date": str(__import__('datetime').date.today()),
            "institution_name": institution_name,
            "pan_vat_number": pan_vat,
            "fiscal_year": fiscal_year,
            "total_tds": str(total_tds),
            "total_amount_of_concerned_transaction": str(sum(e.amount for e in tds_expenses if e.amount)),
            "entries": [
                {
                    "date": e.nepali_date,
                    "vendor_pan_vat": e.vendor_pan_vat_number,
                    "description": e.expense_type,
                    "amount": str(e.amount),
                    "tds_rate": str(e.tds_rate) if e.tds_rate else "0",
                    "tds_amount": str(e.tds_amount if e.tds_amount else "0"),
                }
                for e in tds_expenses
            ],
        }
        
        return Response(certificate_data)


class ChallanSlipGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fiscal_year = request.query_params.get("fiscal_year", "")
        
        # Get all entries for this fiscal year
        expense_qs = ExpenseEntry.objects.filter(user=request.user)
        sale_qs = SalesEntry.objects.filter(user=request.user)
        purchase_qs = PurchaseEntry.objects.filter(user=request.user)
        
        if fiscal_year:
            expense_qs = expense_qs.filter(fiscal_year=fiscal_year)
            sale_qs = sale_qs.filter(fiscal_year=fiscal_year)
            purchase_qs = purchase_qs.filter(fiscal_year=fiscal_year)
        
        # Calculate totals
        total_tds = expense_qs.aggregate(t=Sum("tds_amount"))["t"] or Decimal("0")
        total_vat_out = sale_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
        total_vat_in = (purchase_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")) + (
            expense_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
        )
        net_vat = total_vat_out - total_vat_in
        
        institution_name = ""
        pan_vat = ""
        if hasattr(request.user, "profile"):
            institution_name = request.user.profile.institution_name
            pan_vat = request.user.profile.pan_vat_number
        
        # Prepare challan data
        challan_data = {
            "challan_number": f"CHALLAN-{request.user.id}-{fiscal_year}",
            "issued_date": str(__import__('datetime').date.today()),
            "institution_name": institution_name,
            "pan_vat_number": pan_vat,
            "fiscal_year": fiscal_year,
            "total_tds": str(total_tds),
            "total_vat_output": str(total_vat_out),
            "total_vat_input": str(total_vat_in),
            "net_vat_payable": str(net_vat) if net_vat > 0 else "0",
            "total_amount_payable": str(total_tds + (net_vat if net_vat > 0 else Decimal("0"))),
            "tax_period": f"FY {fiscal_year}",
        }
        
        return Response(challan_data)
