from pydantic import BaseModel
from typing import List, Optional

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- CHATBOT ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# --- HARCAMA / YATIRIM ---
class HarcamaBase(BaseModel):
    aciklama: str
    miktar: float
    kategori: str
    tarih: str
    # Yeni alanlar (Opsiyonel, çünkü harcamada bunlar boş olabilir)
    is_investment: bool = False
    asset_type: Optional[str] = None
    symbol: Optional[str] = None
    buy_price: Optional[float] = None

class HarcamaCreate(HarcamaBase):
    pass

class Harcama(HarcamaBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

# --- USER ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    harcamalar: List[Harcama] = []

    class Config:
        from_attributes = True