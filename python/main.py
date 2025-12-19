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


@app.post("/prices/")
def get_current_prices(request: SymbolList):
    prices = {}
    print(f"📈 Fiyat isteği geldi: {request.symbols}")

    for sym in request.symbols:
        s = sym.upper().strip()
        price_found = False

        # --- 1. ALTIN (GRAM TL) ---
        if s == "ALTIN":
            try:
                # Ons ve Dolar Kuru ile hassas hesaplama
                gold_ticker = yf.Ticker("XAUUSD=X")
                gold_data = gold_ticker.history(period="1d")
                if gold_data.empty: gold_data = yf.Ticker("GC=F").history(period="1d")
                
                usd_data = yf.Ticker("TRY=X").history(period="1d")

                if not gold_data.empty and not usd_data.empty:
                    gold_oz_usd = gold_data['Close'].iloc[-1]
                    usd_try = usd_data['Close'].iloc[-1]
                    gram_tl = (gold_oz_usd * usd_try) / 31.1034768
                    prices[sym] = round(gram_tl, 2)
                    price_found = True
                    print(f"✅ ALTIN: {prices[sym]} ₺")
                    continue
            except: pass

        # --- 2. GÜMÜŞ (GRAM TL) ---
        if s == "GUMUS" or s == "GÜMÜŞ":
            try:
                silver_data = yf.Ticker("SI=F").history(period="1d")
                usd_data = yf.Ticker("TRY=X").history(period="1d")

                if not silver_data.empty and not usd_data.empty:
                    silver_oz_usd = silver_data['Close'].iloc[-1]
                    usd_try = usd_data['Close'].iloc[-1]
                    gram_tl = (silver_oz_usd * usd_try) / 31.1034768
                    prices[sym] = round(gram_tl, 2)
                    price_found = True
                    print(f"✅ GÜMÜŞ: {prices[sym]} ₺")
                    continue
            except: pass

        # --- 3. KRİPTO PARALAR VE HİSSELER ---
        if not price_found:
            # Denenecek senaryolar: 
            # 1. Direkt Kodu Dene (BIST için .IS)
            # 2. "-TRY" ekle (Kripto TL fiyatı için)
            # 3. "-USD" ekle ve Dolarla çarp (Kripto Dolar fiyatı için)
            
            ticker_candidates = []
            
            # Eğer kod 3-4 harfliyse ve USD/EUR değilse (Muhtemelen Kripto veya BIST)
            if len(s) >= 3 and s not in ["USD", "EUR", "GBP", "DOLAR", "EURO"]:
                 ticker_candidates.append(f"{s}-TRY") # Önce TL karşılığını ara (Örn: ETH-TRY)
                 ticker_candidates.append(f"{s}-USD") # Sonra Dolar karşılığını ara (Örn: ETH-USD)
                 ticker_candidates.append(f"{s}.IS")  # Sonra BIST hissesi ara (Örn: THYAO.IS)
            
            # Standart dövizler
            if s == "DOLAR" or s == "USD": ticker_candidates = ["TRY=X"]
            if s == "EURO" or s == "EUR": ticker_candidates = ["EURTRY=X"]

            usd_rate = None # Dolar kurunu hafızada tut

            for t in ticker_candidates:
                try:
                    ticker = yf.Ticker(t)
                    data = ticker.history(period="1d")
                    
                    if not data.empty:
                        current_price = data['Close'].iloc[-1]
                        
                        # Eğer "-USD" ile bulduysak, bunu TL'ye çevirmemiz lazım!
                        if t.endswith("-USD"):
                            if usd_rate is None: # Kuru henüz çekmediysek çek
                                usd_data = yf.Ticker("TRY=X").history(period="1d")
                                if not usd_data.empty:
                                    usd_rate = usd_data['Close'].iloc[-1]
                            
                            if usd_rate:
                                current_price = current_price * usd_rate
                                print(f"💱 {t} ($) -> TL Çevrildi: {current_price}")
                        
                        prices[sym] = round(current_price, 2)
                        price_found = True
                        print(f"✅ Bulundu ({t}): {prices[sym]}")
                        break
                except:
                    continue

        # --- 4. TEFAS ---
        if not price_found and len(s) == 3:
            try:
                tefas = Crawler()
                start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                result = tefas.fetch(start=start_date, columns=["code", "price"])
                fund = result[result['code'] == s]
                if not fund.empty:
                    prices[sym] = round(fund.iloc[0]['price'], 6)
                    print(f"✅ TEFAS: {sym} -> {prices[sym]}")
                else:
                    prices[sym] = None
            except: prices[sym] = None

        if not price_found:
            prices[sym] = None

    return prices











