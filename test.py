# import os
# import difflib
# import requests
# from PIL import Image
# import google.generativeai as genai

# # ========== CONFIG ==========
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyA8JFwu5DpLSKBfTTk2K3dUW61y32gZeoo")

# # ========== SETUP ==========
# genai.configure(api_key=GOOGLE_API_KEY)
# model = genai.GenerativeModel("models/gemini-1.5-flash")  # ✅ Updated model

# # ========== OCR FUNCTION ==========
# def extract_text_from_prescription(image_path):
#     image = Image.open(image_path)

#     prompt = (
#         "This is a doctor's handwritten prescription. "
#         "Extract only the **medicine names**, **strengths** (like 500mg), and **dosages** (like 1-0-1). "
#         "Ignore patient name, doctor name, or other info. "
#         "Return the result as a plain list of medicines with strength and dosage."
#     )

#     response = model.generate_content([prompt, image])
#     return response.text.strip()

# # ========== SPELL CORRECTION ==========
# def correct_medicine_names(extracted_text, known_meds):
#     corrected = set()
#     for line in extracted_text.splitlines():
#         words = line.strip().split()
#         for word in words:
#             matches = difflib.get_close_matches(word, known_meds, n=1, cutoff=0.7)
#             if matches:
#                 corrected.add(matches[0])
#     return list(corrected)

# # ========== OPENFDA QUERY ==========
# def query_openfda(medicine_name):
#     base_url = "https://api.fda.gov/drug/label.json"
#     params = {
#         "search": f"openfda.generic_name:{medicine_name}",
#         "limit": 1
#     }
#     try:
#         response = requests.get(base_url, params=params)
#         if response.status_code == 200:
#             return response.json().get("results", [])
#         else:
#             print(f"[!] Error for {medicine_name}: {response.text}")
#             return []
#     except Exception as e:
#         print(f"[!] Exception for {medicine_name}: {e}")
#         return []

# # ========== MAIN WORKFLOW ==========
# def main(image_path):
#     print("🧠 Extracting from image...")
#     extracted_text = extract_text_from_prescription(image_path)
#     print("📄 Extracted Text:\n", extracted_text)

#     known_meds = [
#         "Paracetamol", "Ibuprofen", "Cetirizine", "Amoxicillin", "Ranitidine",
#         "Pantoprazole", "Azithromycin", "Metformin", "Loratadine", "Ciprofloxacin","cercal","Mootex",
#         "Amlodipine", "Atorvastatin", "Omeprazole", "Doxycycline"
#     ]

#     print("\n🔍 Correcting medicine names...")
#     corrected_names = correct_medicine_names(extracted_text, known_meds)
#     print("✅ Corrected:", corrected_names)

#     print("\n💊 Fetching info from OpenFDA...")
#     for med in corrected_names:
#         results = query_openfda(med)
#         if results:
#             print(f"\n🔹 Medicine: {med}")
#             entry = results[0]
#             openfda = entry.get("openfda", {})
#             print(f"  - Brand: {openfda.get('brand_name', ['N/A'])[0]}")
#             print(f"  - Generic: {openfda.get('generic_name', ['N/A'])[0]}")
#             print(f"  - Manufacturer: {openfda.get('manufacturer_name', ['N/A'])[0]}")
#             print(f"  - Purpose: {entry.get('purpose', ['N/A'])[0]}")
#         else:
#             print(f"❌ No info found for {med}")

# # ========== RUN ==========
# if __name__ == "__main__":
#     image_path = "/home/santhakumar/Pictures/Screenshots/Screenshot from 2025-07-15 15-03-49.png"  # 🔁 Change this path to your image
#     main(image_path)









import os
import difflib
from PIL import Image
import google.generativeai as genai

# ========== CONFIG ==========
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyA8JFwu5DpLSKBfTTk2K3dUW61y32gZeoo")

# ========== SETUP ==========
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("models/gemini-2.0-flash")

# ========== LOCAL MEDICINE DATABASE ==========
local_medicine_db = [
    {"name": "Paracetamol", "strength": "500mg", "manufacturer": "ABC Pharma", "usage": "Pain relief"},
    {"name": "Cercal", "strength": "50mg", "manufacturer": "Zeno Labs", "usage": "Nerve pain"},
    {"name": "Mootex TH", "strength": "50mg + 5mg", "manufacturer": "HealthGen", "usage": "Muscle relaxant"},
    {"name": "Cerbal NP", "strength": "100mg", "manufacturer": "NeuroTech", "usage": "Neuropathy"},
]

# ========== OCR FUNCTION ==========
def extract_text_from_prescription(image_path):
    image = Image.open(image_path)

    prompt = (
        "This is a doctor's handwritten prescription. "
        "Extract only the **medicine names**, **strengths** (like 500mg), and **dosages** (like 1-0-1). "
        "Ignore patient name, doctor name, or other info. "
        "Return the result as a plain list of medicines with strength and dosage."
    )

    response = model.generate_content([prompt, image])
    return response.text.strip()

# ========== SPELL CORRECTION ==========
def correct_medicine_names(extracted_text, known_meds):
    corrected = set()
    for line in extracted_text.splitlines():
        matches = difflib.get_close_matches(line.strip().lower(), [med.lower() for med in known_meds], n=1, cutoff=0.4)
        if matches:
            corrected.add(matches[0].title())
    return list(corrected)

# ========== LOCAL DB LOOKUP ==========
def lookup_local_medicine_info(medicine_name):
    for med in local_medicine_db:
        if medicine_name.lower() == med["name"].lower():
            return med
    return None

# ========== MAIN WORKFLOW ==========
def main(image_path):
    print("🧠 Extracting from image...")
    extracted_text = extract_text_from_prescription(image_path)
    print("📄 Extracted Text:\n", extracted_text)

    # Prepare known meds list from local DB
    known_meds = [med["name"] for med in local_medicine_db]

    print("\n🔍 Correcting medicine names...")
    corrected_names = correct_medicine_names(extracted_text, known_meds)
    print("✅ Corrected:", corrected_names)

    print("\n💊 Looking up local medicine database...")
    for med_name in corrected_names:
        info = lookup_local_medicine_info(med_name)
        if info:
            print(f"\n🔹 Medicine: {med_name}")
            print(f"  - Strength: {info['strength']}")
            print(f"  - Manufacturer: {info['manufacturer']}")
            print(f"  - Usage: {info['usage']}")
        else:
            print(f"❌ No local info found for {med_name}")

# ========== RUN ==========
if __name__ == "__main__":
    image_path = "/home/santhakumar/Pictures/Screenshots/Screenshot from 2025-07-15 15-03-49.png"
    main(image_path)
