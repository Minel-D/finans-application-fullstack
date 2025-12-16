from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import google.generativeai as genai
from pydantic import BaseModel 

import models
import schemas
import utils
from database import SessionLocal, engine

import os
from dotenv import load_dotenv
# .env dosyasını yükle
load_dotenv()

# Tabloları oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- GÜVENLİK FONKSİYONLARI ---

# main.py dosyasındaki create_user ve login fonksiyonlarını BUL ve BUNLARLA DEĞİŞTİR:

# 1. DETAYLI KAYIT FONKSİYONU
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    print(f"\n📝 KAYIT DENEMESİ: {user.email}") # Terminale yaz
    
    # Email kontrolü
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        print("❌ HATA: Bu email zaten var!")
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    # Şifreleme ve Kayıt
    hashed_password = utils.get_password_hash(user.password)
    print(f"🔑 Şifre Hashlendi: {hashed_password[:10]}...")
    
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"✅ KAYIT BAŞARILI! ID: {new_user.id} olarak veritabanına yazıldı.\n")
    return new_user

# 2. DETAYLI GİRİŞ FONKSİYONU
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"\n🔍 GİRİŞ DENEMESİ: {form_data.username} (Şifre: {form_data.password})")
    
    # Kullanıcıyı ara
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user:
        print(f"❌ HATA: '{form_data.username}' veritabanında BULUNAMADI!")
        # Debug için tüm kullanıcıları yazdıralım
        all_users = db.query(models.User).all()
        print(f"📂 Mevcut Kullanıcılar: {[u.email for u in all_users]}")
    else:
        print(f"✅ KULLANICI BULUNDU: ID={user.id}")
        
        # Şifre kontrolü
        if not utils.verify_password(form_data.password, user.hashed_password):
             print(f"❌ ŞİFRE YANLIŞ! Veritabanındaki Hash: {user.hashed_password[:10]}...")
        else:
             print("✅ ŞİFRE DOĞRU! Giriş yapılıyor...")

    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Şu anki kullanıcıyı bul
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Giriş yapmanız gerekiyor",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = utils.jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except utils.jwt.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- HARCAMA İŞLEMLERİ (ARTIK KORUMALI) ---

@app.post("/harcamalar/", response_model=schemas.Harcama)
def create_harcama(harcama: schemas.HarcamaCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_harcama = models.Transaction(**harcama.dict(), owner_id=current_user.id)
    db.add(db_harcama)
    db.commit()
    db.refresh(db_harcama)
    return db_harcama

@app.get("/harcamalar/", response_model=List[schemas.Harcama])
def read_harcamalar(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Sadece giriş yapanın verilerini getir
    return db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).all()

@app.delete("/harcamalar/{harcama_id}")
def delete_harcama(harcama_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    harcama = db.query(models.Transaction).filter(models.Transaction.id == harcama_id, models.Transaction.owner_id == current_user.id).first()
    if not harcama:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    db.delete(harcama)
    db.commit()
    return {"detail": "Silindi"}

@app.put("/harcamalar/{harcama_id}", response_model=schemas.Harcama)
def update_harcama(harcama_id: int, veri: schemas.HarcamaCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    harcama = db.query(models.Transaction).filter(models.Transaction.id == harcama_id, models.Transaction.owner_id == current_user.id).first()
    if not harcama:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    harcama.aciklama = veri.aciklama
    harcama.miktar = veri.miktar
    harcama.kategori = veri.kategori
    harcama.tarih = veri.tarih
    db.commit()
    db.refresh(harcama)
    return harcama



# --- YAPAY ZEKA ANALİZİ ---

# Google API Ayarı

api_key = os.getenv("GOOGLE_API_KEY") 
genai.configure(api_key=api_key)


@app.post("/analyze/")
def analyze_spending(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    print(f"🤖 AI Analizi İsteği Geldi - Kullanıcı: {current_user.email}") # Debug logu

    # 1. Harcamaları çek
    harcamalar = db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).all()
    
    # 2. Eğer harcama yoksa
    if not harcamalar:
        print("ℹ️ Harcama yok, bilgi mesajı dönülüyor.")
        return {"analiz": "Henüz analiz yapacak kadar veriniz yok. Lütfen birkaç harcama ekleyin."}

    # 3. Veriyi hazırla
    veri_ozeti = ""
    toplam = 0
    for h in harcamalar:
        veri_ozeti += f"- {h.kategori}: {h.miktar} TL ({h.aciklama})\n"
        toplam += h.miktar
    
    print(f"📊 Toplam Harcama: {toplam} TL. Gemini'ye soruluyor...")

    # 4. Gemini'ye Sor (Hata Korumalı)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Sen bir finansal danışmansın. Aşağıda bir kişinin harcama listesi var.
        Toplam Harcama: {toplam} TL.
        
        Harcama Listesi:
        {veri_ozeti}
        
        Lütfen bu kişiye:
        1. Harcamalarını kısaca analiz et.
        2. Tasarruf edebileceği alanları söyle.
        3. Esprili ve samimi bir dille, kısa bir paragraf (maksimum 3 cümle) tavsiye ver.
        """
        
        response = model.generate_content(prompt)
        print("✅ Gemini Cevap Verdi.")
        return {"analiz": response.text}
        
    except Exception as e:
        print(f"❌ AI HATASI: {e}") # Terminalde hatayı gör
        return {"analiz": f"Yapay zeka servisinde bir sorun oluştu. (Hata Detayı: {str(e)})"}


# --- CHATBOT İŞLEVİ ---
# --- CHATBOT FONKSİYONU (main.py - analyze fonksiyonunun altına ekle) ---

@app.post("/chat/", response_model=schemas.ChatResponse)
def chat_with_ai(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    print(f"💬 Chat İsteği: {request.message} - Kullanıcı: {current_user.email}")

    # 1. Kullanıcının harcamalarını çek (Bağlam oluşturmak için)
    harcamalar = db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).all()
    
    # 2. Finansal veriyi metne dök (AI'ın anlaması için)
    harcama_ozeti = ""
    toplam = 0
    if not harcamalar:
        harcama_ozeti = "Kullanıcının henüz hiç harcama kaydı yok."
    else:
        for h in harcamalar:
            harcama_ozeti += f"- {h.tarih} tarihinde {h.kategori} kategorisinde {h.miktar} TL ({h.aciklama})\n"
            toplam += h.miktar
    
    context_text = f"Kullanıcının Toplam Harcaması: {toplam} TL.\nDetaylı Harcama Listesi:\n{harcama_ozeti}"

    # 3. Gemini'ye Soruyu Sor
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Prompt Mühendisliği: AI'a rol veriyoruz
        prompt = f"""
        Sen yardımsever ve esprili bir finans asistanısın. Adın 'FinanceAgent'.
        
        Aşağıda kullanıcının finansal verileri var:
        {context_text}
        
        Kullanıcının sorusu: "{request.message}"
        
        Lütfen kullanıcının verilerine dayanarak bu soruyu cevapla. 
        Eğer verilerde cevabı yoksa (örneğin 'köpeğimin adı ne' gibi), finansla ilgili olmadığı için nazikçe konuyu finansa getir.
        Cevabın kısa, net ve samimi olsun.
        """
        
        response = model.generate_content(prompt)
        return {"response": response.text}
        
    except Exception as e:
        print(f"❌ CHAT HATASI: {e}")
        return {"response": "Şu an bağlantıda bir sorun var, ama senin için buradayım. Lütfen tekrar dene."}