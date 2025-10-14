from pydantic import BaseModel, Field
from datetime import datetime

class ServiceImageResponse(BaseModel):
    id: int
    image_url: str
    order: int

    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str | None = None
    price: float = Field(..., gt=0)
    duration_minutes: int = Field(..., gt=0)

class ServiceUpdate(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = None
    price: float | None = Field(None, gt=0)
    duration_minutes: int | None = Field(None, gt=0)
    is_active: bool | None = None

class ServiceResponse(BaseModel):
    id: int
    vendor_id: int
    name: str
    description: str | None
    price: float
    duration_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    images: list[ServiceImageResponse] = []

    class Config:
        from_attributes = True

class ServiceImageUpload(BaseModel):
    service_id: int
    image_url: str  # Cloudinary URL
    order: int = 0