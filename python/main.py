from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas
from database import SessionLocal, engine

# Veritabanı tablolarını oluştur (Eğer database.py'yi çalıştırmadıysan bu garanti eder)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()


origins = [
    "http://localhost:3000", # React'ın çalışacağı adres
    "http://127.0.0.1:3000",
]

# main.py dosyasındaki CORS kısmı şöyle olmalı:

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- DİKKAT: Burayı ["*"] yaptık. Tüm kapıları açtık.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Bağımlılık (Dependency) ---
# Her istekte veritabanı oturumu açar, işlem bitince kapatır.
# Bu, veritabanı bağlantılarının açık kalıp sunucuyu kilitlemesini önler.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# --- API Uç Noktaları (Endpoints) ---

# 1. Veri Ekleme (POST Request)
# Kullanıcı '/harcamalar/' adresine JSON verisi gönderir.
# response_model: Kullanıcıya geri dönülecek veri formatını belirler.
@app.post("/harcamalar/", response_model=schemas.Harcama)
def harcama_olustur(harcama: schemas.HarcamaCreate, db: Session = Depends(get_db)):
    # Pydantic şemasından gelen veriyi SQL modeline çeviriyoruz
    db_harcama = models.Transaction(
        aciklama=harcama.aciklama,
        miktar=harcama.miktar,
        kategori=harcama.kategori,
        tarih=harcama.tarih
    )
    # Veritabanına ekle
    db.add(db_harcama)
    # Değişiklikleri kaydet (Commit)
    db.commit()
    # Eklenen veriyi, ID'si oluşmuş haliyle geri çek (Refresh)
    db.refresh(db_harcama)
    return db_harcama

# 2. Tüm Verileri Listeleme (GET Request)
# Kullanıcı '/harcamalar/' adresine girdiğinde çalışır.
@app.get("/harcamalar/", response_model=List[schemas.Harcama])
def harcamalari_listele(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # SQL sorgusu: SELECT * FROM harcamalar LIMIT 100
    harcamalar = db.query(models.Transaction).offset(skip).limit(limit).all()
    return harcamalar


# 3. Veri Silme (DELETE Request)
# Endpoint: /harcamalar/
@app.delete("/harcamalar/{harcama_id}")
def harcama_sil(harcama_id: int, db: Session = Depends(get_db)):
    # Adım 1: Veritabanında bu ID'ye sahip satırı bul
    harcama = db.query(models.Transaction).filter(models.Transaction.id == harcama_id).first()
    
    # Adım 2: Eğer yoksa hata fırlat
    if harcama is None:
        raise HTTPException(status_code=404, detail="Harcama bulunamadı")
    
    # Adım 3: Varsa silme işlemini bellekte hazırla
    db.delete(harcama)
    
    # Adım 4: İşlemi onayla ve diske yaz
    db.commit()
    
    return {"mesaj": "Harcama başarıyla silindi"}

# 4. Veri Güncelleme (PUT Request)
# Endpoint: /harcamalar/
@app.put("/harcamalar/{harcama_id}", response_model=schemas.Harcama)
def harcama_guncelle(harcama_id: int, harcama_veri: schemas.HarcamaCreate, db: Session = Depends(get_db)):
    # Adım 1: Güncellenecek kaydı bul
    db_harcama = db.query(models.Transaction).filter(models.Transaction.id == harcama_id).first()
    
    # Adım 2: Kayıt yoksa hata ver
    if db_harcama is None:
        raise HTTPException(status_code=404, detail="Harcama bulunamadı")
    
    # Adım 3: Gelen yeni verileri mevcut veritabanı nesnesine aktar
    db_harcama.aciklama = harcama_veri.aciklama
    db_harcama.miktar = harcama_veri.miktar
    db_harcama.kategori = harcama_veri.kategori
    db_harcama.tarih = harcama_veri.tarih
    
    # Adım 4: Kaydet ve yenilenmiş veriyi geri döndür
    db.commit()
    db.refresh(db_harcama)
    
    return db_harcama