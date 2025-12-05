from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# --- KULLANICI TABLOSU ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True) # Aynı email ile 2 kişi olamaz
    hashed_password = Column(String) # Şifrenin hashlenmiş hali

    # İlişki: Bir kullanıcının birden fazla harcaması olabilir.
    harcamalar = relationship("Transaction", back_populates="owner")


# --- HARCAMA TABLOSU ---
class Transaction(Base):
    __tablename__ = "harcamalar"

    id = Column(Integer, primary_key=True, index=True)
    aciklama = Column(String, index=True)
    miktar = Column(Float)
    kategori = Column(String)
    tarih = Column(String)
    
    # YENİ: Bu harcama kime ait?
    owner_id = Column(Integer, ForeignKey("users.id")) # users tablosunun id'sine bağlanır
    
    # İlişki: Bu harcamanın bir sahibi vardır.
    owner = relationship("User", back_populates="harcamalar")