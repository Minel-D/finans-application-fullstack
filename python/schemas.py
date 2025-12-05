from pydantic import BaseModel
from typing import List, Optional

# --- TOKEN ŞEMASI ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- HARCAMA ŞEMALARI ---
class HarcamaBase(BaseModel):
    aciklama: str
    miktar: float
    kategori: str
    tarih: str

class HarcamaCreate(HarcamaBase):
    pass

class Harcama(HarcamaBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

# --- KULLANICI ŞEMALARI ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    harcamalar: List[Harcama] = []

    class Config:
        from_attributes = True