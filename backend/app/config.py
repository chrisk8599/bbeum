from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Beauty Booking API"
    database_url: str = "sqlite:///./beauty_booking.db"
    secret_key: str = "your-secret-key-change-in-production-make-it-long-and-random"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Cloudinary settings
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()