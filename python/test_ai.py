import google.generativeai as genai

# BURAYA API KEY'İNİ YAPIŞTIR
API_KEY = "AIzaSyAcPpiMT15H5HskbFvS1UAomCEqn1roLiI"

genai.configure(api_key=API_KEY)

print("--- KULLANABİLECEĞİN MODELLER ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print("Hata:", e)