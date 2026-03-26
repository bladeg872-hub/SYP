from django.conf import settings
from django.db import models


class UserProfile(models.Model):
	ROLE_CHOICES = [
		("admin", "Admin"),
		("manager", "Manager"),
		("accountant", "Accountant"),
		("auditor", "Auditor"),
	]

	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
	institution_name = models.CharField(max_length=255, blank=True)
	full_name = models.CharField(max_length=255, blank=True)
	pan = models.CharField(max_length=10, unique=True)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="accountant")
	is_verified = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.user.username} ({self.pan})"


class SalesEntry(models.Model):
	PERIOD_BUCKET_CHOICES = [
		("monthly", "Monthly"),
		("quarterly", "Quarterly"),
		("annual", "Annual"),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sales_entries")
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	buyer_pan_vat = models.CharField(max_length=10)
	nepali_date = models.CharField(max_length=10)
	fiscal_year = models.CharField(max_length=9)
	period_bucket = models.CharField(max_length=20, choices=PERIOD_BUCKET_CHOICES)
	vat_amount = models.DecimalField(max_digits=12, decimal_places=2)
	total_amount = models.DecimalField(max_digits=12, decimal_places=2)
	bill_file_name = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.user.username} - {self.nepali_date} - {self.total_amount}"


class PurchaseEntry(models.Model):
	PERIOD_BUCKET_CHOICES = [
		("monthly", "Monthly"),
		("quarterly", "Quarterly"),
		("annual", "Annual"),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="purchase_entries")
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	supplier_pan_vat = models.CharField(max_length=10)
	nepali_date = models.CharField(max_length=10)
	fiscal_year = models.CharField(max_length=9)
	period_bucket = models.CharField(max_length=20, choices=PERIOD_BUCKET_CHOICES)
	vat_amount = models.DecimalField(max_digits=12, decimal_places=2)
	total_amount = models.DecimalField(max_digits=12, decimal_places=2)
	bill_file_name = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.user.username} - {self.nepali_date} - {self.total_amount}"


class ExpenseEntry(models.Model):
	PERIOD_BUCKET_CHOICES = [
		("monthly", "Monthly"),
		("quarterly", "Quarterly"),
		("annual", "Annual"),
	]

	EXPENSE_TYPE_CHOICES = [
		("salary", "Salary"),
		("other", "Other Expenses"),
		("operational", "Operational"),
		("capital", "Capital"),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expense_entries")
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPE_CHOICES)
	vendor_pan_vat = models.CharField(max_length=10)
	tds_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	nepali_date = models.CharField(max_length=10)
	fiscal_year = models.CharField(max_length=9)
	period_bucket = models.CharField(max_length=20, choices=PERIOD_BUCKET_CHOICES)
	vat_amount = models.DecimalField(max_digits=12, decimal_places=2)
	tds_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	total_amount = models.DecimalField(max_digits=12, decimal_places=2)
	bill_file_name = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.user.username} - {self.expense_type} - {self.total_amount}"
