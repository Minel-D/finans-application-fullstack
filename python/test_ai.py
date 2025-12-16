import google.generativeai as genai
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("🔍 Mevcut Modeller Aranıyor...\n")

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Model Adı: {m.name}")
except Exception as e:
    print(f"❌ Hata: {e}")