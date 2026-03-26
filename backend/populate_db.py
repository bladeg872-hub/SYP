import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile, SalesEntry, PurchaseEntry, ExpenseEntry

# Clear existing data
print("Clearing existing data...")
SalesEntry.objects.all().delete()
PurchaseEntry.objects.all().delete()
ExpenseEntry.objects.all().delete()
UserProfile.objects.filter(user__username__startswith='testuser').delete()
User.objects.filter(username__startswith='testuser').delete()

# Create test users with different roles
print("Creating test users...")

users_data = [
    {"username": "testuser_admin", "email": "admin@test.com", "role": "admin"},
    {"username": "testuser_manager", "email": "manager@test.com", "role": "manager"},
    {"username": "testuser_accountant", "email": "accountant@test.com", "role": "accountant"},
    {"username": "testuser_auditor", "email": "auditor@test.com", "role": "auditor"},
]

users = {}
for data in users_data:
    user = User.objects.create_user(
        username=data["username"],
        email=data["email"],
        password="Test@1234",
        first_name=data["role"].capitalize()
    )
    profile = UserProfile.objects.create(
        user=user,
        institution_name=f"{data['role'].capitalize()} Institution",
        full_name=f"Test {data['role'].capitalize()}",
        pan=f"{1000000000 + hash(data['username']) % 9000000000}",
        role=data["role"],
        is_verified=True
    )
    users[data["role"]] = user
    print(f"✓ Created {data['role']} user: {user.username}")

# Create Sales Entries for the accountant
print("\nCreating Sales Entries...")
sales_data = [
    {
        "amount": Decimal("50000.00"),
        "buyer_pan_vat": "1234567890",
        "nepali_date": "2081/10/15",
        "fiscal_year": "2080/81",
        "period_bucket": "monthly",
        "vat_amount": Decimal("5000.00"),
        "total_amount": Decimal("55000.00"),
        "bill_file_name": "bill_001.pdf"
    },
    {
        "amount": Decimal("75000.00"),
        "buyer_pan_vat": "9876543210",
        "nepali_date": "2081/11/20",
        "fiscal_year": "2080/81",
        "period_bucket": "quarterly",
        "vat_amount": Decimal("7500.00"),
        "total_amount": Decimal("82500.00"),
        "bill_file_name": "bill_002.pdf"
    },
]

for data in sales_data:
    SalesEntry.objects.create(user=users["accountant"], **data)
    print(f"✓ Created sales entry: Rs. {data['total_amount']}")

# Create Purchase Entries
print("\nCreating Purchase Entries...")
purchase_data = [
    {
        "amount": Decimal("30000.00"),
        "supplier_pan_vat": "1111111111",
        "nepali_date": "2081/10/10",
        "fiscal_year": "2080/81",
        "period_bucket": "monthly",
        "vat_amount": Decimal("3000.00"),
        "total_amount": Decimal("33000.00"),
        "bill_file_name": "purchase_001.pdf"
    },
    {
        "amount": Decimal("45000.00"),
        "supplier_pan_vat": "2222222222",
        "nepali_date": "2081/11/15",
        "fiscal_year": "2080/81",
        "period_bucket": "quarterly",
        "vat_amount": Decimal("4500.00"),
        "total_amount": Decimal("49500.00"),
        "bill_file_name": "purchase_002.pdf"
    },
]

for data in purchase_data:
    PurchaseEntry.objects.create(user=users["accountant"], **data)
    print(f"✓ Created purchase entry: Rs. {data['total_amount']}")

# Create Expense Entries
print("\nCreating Expense Entries...")
expense_data = [
    {
        "amount": Decimal("20000.00"),
        "expense_type": "salary",
        "vendor_pan_vat": "5555555555",
        "tds_rate": Decimal("10"),
        "nepali_date": "2081/10/01",
        "fiscal_year": "2080/81",
        "period_bucket": "monthly",
        "vat_amount": Decimal("0.00"),
        "tds_amount": Decimal("2000.00"),
        "total_amount": Decimal("20000.00"),
        "bill_file_name": "salary_001.pdf"
    },
    {
        "amount": Decimal("15000.00"),
        "expense_type": "operational",
        "vendor_pan_vat": "6666666666",
        "tds_rate": Decimal("0"),
        "nepali_date": "2081/11/05",
        "fiscal_year": "2080/81",
        "period_bucket": "monthly",
        "vat_amount": Decimal("1500.00"),
        "tds_amount": Decimal("0.00"),
        "total_amount": Decimal("16500.00"),
        "bill_file_name": "operational_001.pdf"
    },
    {
        "amount": Decimal("50000.00"),
        "expense_type": "capital",
        "vendor_pan_vat": "7777777777",
        "tds_rate": Decimal("5"),
        "nepali_date": "2081/12/10",
        "fiscal_year": "2080/81",
        "period_bucket": "quarterly",
        "vat_amount": Decimal("5000.00"),
        "tds_amount": Decimal("2500.00"),
        "total_amount": Decimal("55000.00"),
        "bill_file_name": "capital_001.pdf"
    },
]

for data in expense_data:
    ExpenseEntry.objects.create(user=users["accountant"], **data)
    print(f"✓ Created {data['expense_type']} expense: Rs. {data['total_amount']}")

print("\n" + "="*50)
print("✅ DATABASE POPULATED SUCCESSFULLY!")
print("="*50)
print("\nTest Credentials:")
for data in users_data:
    print(f"  • {data['role'].upper()}: {data['username']} / Test@1234")
print("\nDatabase contains:")
print(f"  • Total Users: {User.objects.count()}")
print(f"  • Sales Entries: {SalesEntry.objects.count()}")
print(f"  • Purchase Entries: {PurchaseEntry.objects.count()}")
print(f"  • Expense Entries: {ExpenseEntry.objects.count()}")
