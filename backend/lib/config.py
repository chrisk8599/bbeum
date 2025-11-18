from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    app_name: str = "Beauty Booking API"
    
    # Database - use environment variable in production
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./beauty_booking.db"
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fix Heroku/some providers that use postgres:// instead of postgresql://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
            print(f"⚠️  Converted postgres:// to postgresql:// for SQLAlchemy compatibility")
    
    secret_key: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-in-production"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    
    # Cloudinary settings
    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "")
    cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
