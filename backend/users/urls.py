from django.urls import path

from .views import (
    AnalyticsSummaryView,
    AuditSummaryView,
    DashboardSummaryView,
    ExpenseEntryListCreateView,
    LoginView,
    ProfileView,
    PurchaseEntryListCreateView,
    RefreshView,
    RegisterView,
    ReportsSummaryView,
    SalesEntryListCreateView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("me/", ProfileView.as_view(), name="me"),
    path("sales/", SalesEntryListCreateView.as_view(), name="sales-list-create"),
    path("purchases/", PurchaseEntryListCreateView.as_view(), name="purchases-list-create"),
    path("expenses/", ExpenseEntryListCreateView.as_view(), name="expenses-list-create"),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("reports/", ReportsSummaryView.as_view(), name="reports-summary"),
    path("analytics/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("audit/", AuditSummaryView.as_view(), name="audit-summary"),
]
