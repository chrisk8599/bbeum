from pydantic import BaseModel

class ServiceCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str

    
    class Config:
        from_attributes = True
