import requests
import time

# --- CONFIGURATION ---
BASE_URL = "http://localhost:8001/prescriptions/mobile/"
UPLOAD_ENDPOINT = f"{BASE_URL}upload/"
STATUS_ENDPOINT = lambda pid: f"{BASE_URL}status/{pid}/"
SUGGESTIONS_ENDPOINT = lambda pid: f"{BASE_URL}suggestions/{pid}/"

IMAGE_PATH = "/home/santhakumar/Pictures/Screenshots/Screenshot from 2025-07-15 15-03-49.png"  # Replace with your test image path
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyODI4NTE2LCJpYXQiOjE3NTI4MjgyMTYsImp0aSI6ImQzNGM0MmE5N2Q3MTQ4ZmViODI5MjU3MzcxY2M0NjI4IiwidXNlcl9pZCI6MX0.86J_h9GHuouAyj5uVr3xFjxPnvu-ESx6ophj9hD1wtc"  # Optional: If your API requires Bearer token

HEADERS = {
    'Authorization': f'Bearer {AUTH_TOKEN}' if AUTH_TOKEN else None
}
HEADERS = {k: v for k, v in HEADERS.items() if v is not None}

# --- STEP 1: Upload the Prescription ---
with open(IMAGE_PATH, 'rb') as img:
    files = {'image': img}
    data = {'notes': 'Testing mobile upload OCR'}
    print("📤 Uploading prescription to /mobile/upload/ ...")
    response = requests.post(UPLOAD_ENDPOINT, headers=HEADERS, files=files, data=data)

if response.status_code != 201:
    print("❌ Upload failed:", response.status_code, response.text)
    exit(1)

res_data = response.json()
prescription_id = res_data.get("prescription_id")
print(f"✅ Uploaded successfully. Prescription ID: {prescription_id}")

# --- STEP 2: Poll for Processing Status ---
print("⏳ Waiting for AI/OCR processing...")
max_attempts = 10
delay = 3  # seconds

for attempt in range(max_attempts):
    status_resp = requests.get(STATUS_ENDPOINT(prescription_id), headers=HEADERS)
    if status_resp.status_code != 200:
        print("❌ Failed to fetch status:", status_resp.status_code, status_resp.text)
        exit(1)

    status_data = status_resp.json()
    print(f"🔁 Attempt {attempt+1}: Status = {status_data.get('status')}")
    if status_data.get('status') == "completed":
        print("✅ Processing completed.")
        break
    time.sleep(delay)
else:
    print("❌ OCR did not complete in time.")
    exit(1)

# --- STEP 3: Fetch Extracted Medicines ---
suggest_resp = requests.get(SUGGESTIONS_ENDPOINT(prescription_id), headers=HEADERS)
if suggest_resp.status_code != 200:
    print("❌ Failed to get suggestions:", suggest_resp.status_code, suggest_resp.text)
    exit(1)

suggestions = suggest_resp.json()

print("\n🧠 OCR Extracted Medicines and DB Mapping:")
for med in suggestions.get("medicines", []):
    print("-" * 40)
    print(f"📝 OCR Extracted: {med['name']}")
    if med.get("product"):
        product = med["product"]
        print(f"📦 Mapped Product: {product['name']} (₹{product['price']})")
    else:
        print("⚠️ Not mapped to any product")
    print(f"✔️ Approved: {med['customer_approved']}")
    print(f"🧾 Qty: {med.get('quantity', 1)}")

print("\n💰 Cost Breakdown:")
print(suggestions.get("cost_breakdown", {}))
