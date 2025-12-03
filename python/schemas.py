from pydantic import BaseModel

# Temel Şema: Hem veri okurken hem yazarken ortak olan alanlar
class HarcamaBase(BaseModel):
    aciklama: str
    miktar: float
    kategori: str
    tarih: str

# Veri Oluşturma Şeması (Create):
# Kullanıcıdan veri alırken sadece yukarıdaki temel bilgileri isteriz.
# ID veritabanı tarafından otomatik verilir, kullanıcıdan istemeyiz.
class HarcamaCreate(HarcamaBase):
    pass

# Veri Okuma Şeması (Response):
# Kullanıcıya veri gösterirken ID bilgisini de göstermek isteriz.
class Harcama(HarcamaBase):
    id: int

    # Bu ayar, Pydantic'in veritabanı modellerini (ORM) okumasını sağlar.
    class Config:
        from_attributes = True