from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
import google.generativeai as genai
from pydantic import BaseModel 
import yfinance as yf
from tefas import Crawler

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

# ==========================================
# GÜVENLİK VE KULLANICI FONKSİYONLARI
# ==========================================

# 1. KAYIT OL
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    hashed_password = utils.get_password_hash(user.password)
    # full_name parametresini de ekledik
    new_user = models.User(email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 2. GİRİŞ YAP (TOKEN AL)
@app.post("/token") 
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
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
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_name": user.full_name,
        "user_email": user.email
    }

# 3. AKTİF KULLANICIYI BUL (KRİTİK DÜZELTME: BU FONKSİYON YUKARI TAŞINDI)
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

# 4. ŞİFRE DEĞİŞTİR (Artık get_current_user tanımlı olduğu için hata vermeyecek)
@app.post("/users/change-password")
def change_password(pass_data: schemas.PasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Eski şifre doğru mu?
    if not utils.verify_password(pass_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz hatalı.")
    
    # 2. Yeni şifreyi hashle ve kaydet
    current_user.hashed_password = utils.get_password_hash(pass_data.new_password)
    db.commit()
    
    return {"message": "Şifre başarıyla güncellendi."}

# ==========================================
# HARCAMA İŞLEMLERİ
# ==========================================

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

# ==========================================
# YAPAY ZEKA ANALİZİ
# ==========================================

# Google API Ayarı
api_key = os.getenv("GOOGLE_API_KEY") 
genai.configure(api_key=api_key)

@app.post("/analyze/")
def analyze_spending(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    print(f"🤖 AI Analizi İsteği Geldi - Kullanıcı: {current_user.email}") 

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

    # 4. Gemini'ye Sor
    try:
        # DÜZELTME: Burada da çalışan modeli kullanalım
        model = genai.GenerativeModel('gemini-flash-latest')
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
        print(f"❌ AI HATASI: {e}") 
        return {"analiz": f"Yapay zeka servisinde bir sorun oluştu. (Hata Detayı: {str(e)})"}


# ==========================================
# CHATBOT İŞLEVİ
# ==========================================

@app.post("/chat/", response_model=schemas.ChatResponse)
def chat_with_ai(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    print(f"💬 Chat İsteği: {request.message} - Kullanıcı: {current_user.email}")

    # 1. Kullanıcının harcamalarını çek
    harcamalar = db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).all()
    
    # 2. Finansal veriyi metne dök
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
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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
    
class SymbolList(BaseModel):
    symbols: List[str]


# ==========================================
# PRICES ENDPOINT (SADECE SON GÜNLER & EN GÜNCEL)
# ==========================================
@app.post("/prices/")
def get_current_prices(request: SymbolList):
    prices = {}
    print(f"📈 Fiyat isteği geldi: {request.symbols}")

    for sym in request.symbols:
        s = sym.upper().strip()
        price_found = False

        # --- 1. TEFAS KONTROLÜ (GUM vb.) ---
        if len(s) == 3 and s not in ["USD", "EUR", "GBP", "ETH", "BTC", "SOL", "XRP", "AVX", "BNB", "USDT"]:
            try:
                tefas = Crawler()
                
                # BUGÜN ve SADECE SON 3 GÜN (Hafta sonu boşluğunu kurtarmak için)
                end_date = datetime.now().strftime("%Y-%m-%d")
                start_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
                
                # Sadece bu dar aralığı çek
                result = tefas.fetch(start=start_date, end=end_date, columns=["date", "code", "price"])
                fund = result[result['code'] == s].copy()
                
                if not fund.empty:
                    import pandas as pd
                    fund['date'] = pd.to_datetime(fund['date'])
                    
                    # Tarihe göre YENİDEN -> ESKİYE sırala
                    # Böylece listenin en tepesindeki (iloc[0]) en güncel tarih olur.
                    fund = fund.sort_values(by="date", ascending=False)
                    
                    # En tepedeki (En güncel) veriyi al
                    latest_price = fund.iloc[0]['price']
                    latest_date = fund.iloc[0]['date'].strftime('%Y-%m-%d')
                    
                    prices[sym] = round(latest_price, 6)
                    print(f"✅ TEFAS ({latest_date}): {sym} -> {prices[sym]} TL")
                    price_found = True
                    continue 
            except Exception as e:
                print(f"⚠️ TEFAS Hatası ({s}): {e}")
                pass

        # --- 2. ALTIN ---
        if s == "ALTIN" and not price_found:
            try:
                gold = yf.Ticker("XAUUSD=X").history(period="1d")
                if gold.empty: gold = yf.Ticker("GC=F").history(period="1d")
                usd = yf.Ticker("TRY=X").history(period="1d")
                if not gold.empty and not usd.empty:
                    prices[sym] = round((gold['Close'].iloc[-1] * usd['Close'].iloc[-1]) / 31.1034768, 2)
                    price_found = True
                    continue
            except: pass

        # --- 3. GÜMÜŞ ---
        if (s == "GUMUS" or s == "GÜMÜŞ") and not price_found:
            try:
                silver = yf.Ticker("SI=F").history(period="1d")
                usd = yf.Ticker("TRY=X").history(period="1d")
                if not silver.empty and not usd.empty:
                    prices[sym] = round((silver['Close'].iloc[-1] * usd['Close'].iloc[-1]) / 31.1034768, 2)
                    price_found = True
                    continue
            except: pass

        # --- 4. PİYASA ---
        if not price_found:
            candidates = []
            if len(s) >= 3 and s not in ["USD","EUR","GBP","DOLAR","EURO"]:
                candidates = [f"{s}-TRY", f"{s}-USD", f"{s}.IS"]
            if s in ["DOLAR", "USD"]: candidates = ["TRY=X"]
            if s in ["EURO", "EUR"]: candidates = ["EURTRY=X"]
            
            usd_rate = None
            for t in candidates:
                try:
                    data = yf.Ticker(t).history(period="1d")
                    if not data.empty:
                        price = data['Close'].iloc[-1]
                        if t.endswith("-USD"):
                            if not usd_rate: 
                                u_d = yf.Ticker("TRY=X").history(period="1d")
                                if not u_d.empty: usd_rate = u_d['Close'].iloc[-1]
                            if usd_rate: price *= usd_rate
                        
                        prices[sym] = round(price, 2)
                        price_found = True
                        print(f"✅ PİYASA: {t} -> {prices[sym]}")
                        break
                except: continue
        
        if not price_found: prices[sym] = None
    return prices













