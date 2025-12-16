from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    harcamalar = relationship("Transaction", back_populates="owner")

class Transaction(Base):
    __tablename__ = "harcamalar"

    id = Column(Integer, primary_key=True, index=True)
    aciklama = Column(String, index=True)
    miktar = Column(Float)
    kategori = Column(String) # Market, Fatura veya Altın, Hisse
    tarih = Column(String)
    
    # --- YENİ EKLENEN ALANLAR ---
    is_investment = Column(Boolean, default=False) # Harcama mı (False), Yatırım mı (True)?
    asset_type = Column(String, nullable=True) # Dolar, Euro, Hisse, Fon...
    symbol = Column(String, nullable=True)     # THYAO, AAPL, GOLDT1 (Sadece hisse/fon için)
    buy_price = Column(Float, nullable=True)   # Alış birim fiyatı
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="harcamalar")