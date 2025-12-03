from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

# Bu sınıf, veritabanındaki 'harcamalar' tablosunun Python'daki karşılığıdır.
class Transaction(Base):
    # 1. Tablo Adı: SQL'de bu isimle görünecek.
    __tablename__ = "harcamalar"

    # 2. Sütunlar (Excel sütunları gibi düşün)
    
    # ID: Her harcamanın kimlik numarasıdır (Primary Key). 
    # index=True: Aramaları hızlandırmak için fihriste ekle demektir.
    id = Column(Integer, primary_key=True, index=True)

    # Açıklama: "Market alışverişi" gibi metin (String).
    aciklama = Column(String, index=True)

    # Tutar: Para miktarı. Ondalıklı sayı olabilir (Float).
    miktar = Column(Float)

    # Kategori: "Gıda", "Fatura", "Eğlence" vb.
    kategori = Column(String)

    # Tarih: Harcamanın yapıldığı zaman. (Şimdilik String tutalım, ileride Date objesine çeviririz)
    tarih = Column(String)