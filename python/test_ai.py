# test_ai.py
import os
from dotenv import load_dotenv
load_dotenv()

print("1. Kütüphaneler import ediliyor...")
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("   - Import Başarılı.")
except Exception as e:
    print(f"   - Import Hatası: {e}")

print("2. Model başlatılıyor...")
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    # API key yoksa test için boş string verelim, hata verirse bağlantı hatası verir, BaseModel hatası vermez.
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, google_api_key=api_key or "TEST_KEY")
    print("   - Model Başlatma Başarılı! (BaseModel hatası yok)")
except Exception as e:
    print(f"   - HATA BURADA OLUŞTU: {e}")