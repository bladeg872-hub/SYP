from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ExpenseEntry, PurchaseEntry, SalesEntry
from .permissions import IsAdminOrAccountant
from .serializers import (
    EmailOrUsernameTokenObtainPairSerializer,
    ExpenseEntrySerializer,
    PurchaseEntrySerializer,
    RegisterSerializer,
    SalesEntrySerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


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

    def get(self, request):
        fiscal_year = request.query_params.get("fiscal_year", "")
        period = request.query_params.get("period", "")

        sales_qs = SalesEntry.objects.filter(user=request.user)
        purchase_qs = PurchaseEntry.objects.filter(user=request.user)
        expense_qs = ExpenseEntry.objects.filter(user=request.user)

        if fiscal_year:
            sales_qs = sales_qs.filter(fiscal_year=fiscal_year)
            purchase_qs = purchase_qs.filter(fiscal_year=fiscal_year)
            expense_qs = expense_qs.filter(fiscal_year=fiscal_year)

        if period:
            sales_qs = sales_qs.filter(period_bucket=period)
            purchase_qs = purchase_qs.filter(period_bucket=period)
            expense_qs = expense_qs.filter(period_bucket=period)

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
