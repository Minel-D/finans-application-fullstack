from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

import models
import schemas
import utils
from database import SessionLocal, engine

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