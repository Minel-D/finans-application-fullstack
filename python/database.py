from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. VERİTABANI BAĞLANTI ADRESİ (Connection String)
# Format: postgresql://kullanici_adi:sifre@sunucu_adresi/veritabani_adi
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:E4rgt1s1!@localhost/finans_takip"

# 2. MOTORU (ENGINE) OLUŞTURMA
# Bu, veritabanı ile Python arasındaki asıl bağlantı kanalıdır.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. OTURUM (SESSION) FABRİKASI
# Veritabanı ile her iletişim kurmak istediğimizde (veri ekle, çek)
# buradan yeni bir 'Session' (Oturum) alacağız.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. TABLO TABANI (BASE)
# İleride oluşturacağımız tüm tablolar (Kullanıcılar, Harcamalar)
# bu 'Base' sınıfından türetilecek. Bu sayede Python sınıflarını SQL tablolarına dönüştüreceğiz.
Base = declarative_base()

# 5. BAĞLANTIYI TEST ETME (İsteğe bağlı, çalıştığını görmek için)
# Bu dosya doğrudan çalıştırılırsa basit bir bağlantı dener.
if __name__ == "__main__":
    try:
        # Önce modelleri içeri alalım ki Python neyi oluşturacağını bilsin
        import models 
        
        # Base.metadata.create_all komutu, models.py içindeki 
        # tüm tabloları veritabanında oluşturur.
        Base.metadata.create_all(bind=engine)
        
        print("✅ Veritabanı bağlantısı BAŞARILI!")
        print("✅ Tablolar (Harcamalar) başarıyla oluşturuldu!")
    except Exception as e:
        print("❌ Bağlantı HATASI:", e)