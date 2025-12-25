from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# .env dosyasını yükle (Local çalışma için)
load_dotenv()

# --- VERİTABANI BAĞLANTI AYARI ---

# 1. Önce Render'dan gelen DATABASE_URL var mı diye bak
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Eğer Render yoksa (Localdeyiz), kendi bilgisayarındaki ayarları kullan
if not SQLALCHEMY_DATABASE_URL:
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "admin") # Burası senin şifren neyse o kalsın
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "finans_takip")
    SQLALCHEMY_DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"

# 3. Render Düzeltmesi: postgres:// ile başlıyorsa postgresql:// yap (SQLAlchemy kuralı)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Bağlantıyı Kur
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()