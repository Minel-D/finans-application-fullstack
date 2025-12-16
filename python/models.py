from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String) # YENİ: İsim Soyisim sütunu
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    harcamalar = relationship("Transaction", back_populates="owner")

# ... Transaction sınıfı aynı kalacak ...
class Transaction(Base):
    __tablename__ = "harcamalar"
    id = Column(Integer, primary_key=True, index=True)
    aciklama = Column(String, index=True)
    miktar = Column(Float)
    kategori = Column(String)
    tarih = Column(String)
    
    # Yeni alanlar (Yatırım güncellemesiyle eklemiştik)
    is_investment = Column(Boolean, default=False)
    asset_type = Column(String, nullable=True)
    symbol = Column(String, nullable=True)
    buy_price = Column(Float, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="harcamalar")