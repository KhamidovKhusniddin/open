import database
from datetime import datetime
import uuid

# Initialize DB first (just in case)
database.init_db()

# Sample Data
mock_queues = [
    {
        "id": "queue_" + str(uuid.uuid4())[:8],
        "phone": "+998901234567",
        "number": "A-001",
        "status": "waiting",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": "10:00",
        "staffId": "staff_1",
        "serviceId": "service_bank_1",
        "branchId": "branch_001",
        "created_at": datetime.now().isoformat(),
        "last_notified": datetime.now().isoformat()
    },
    {
        "id": "queue_" + str(uuid.uuid4())[:8],
        "phone": "+998909876543",
        "number": "B-015",
        "status": "waiting",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": "10:30",
        "staffId": "staff_2",
        "serviceId": "service_clinic_1",
        "branchId": "branch_002",
        "created_at": datetime.now().isoformat(),
        "last_notified": datetime.now().isoformat()
    },
    {
        "id": "queue_" + str(uuid.uuid4())[:8],
        "phone": "+998912345678",
        "number": "C-042",
        "status": "serving",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": "09:45",
        "staffId": "staff_3",
        "serviceId": "service_gov_1",
        "branchId": "branch_003",
        "created_at": datetime.now().isoformat(),
        "last_notified": datetime.now().isoformat()
    },
    {
        "id": "queue_" + str(uuid.uuid4())[:8],
        "phone": "+998933332211",
        "number": "A-002",
        "status": "completed",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": "09:00",
        "staffId": "staff_1",
        "serviceId": "service_bank_1",
        "branchId": "branch_001",
        "created_at": datetime.now().isoformat(),
        "last_notified": datetime.now().isoformat()
    }
]

print("Populating DB with mock data...")
for q in mock_queues:
    database.add_queue(q)
    print(f"Added {q['number']} ({q['status']})")

print("✅ Mock data population complete!")
