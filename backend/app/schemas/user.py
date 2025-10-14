from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserType

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    user_type: UserType

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    user_type: UserType
    avatar_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse