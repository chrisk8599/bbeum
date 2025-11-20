from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
from pathlib import Path

# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Load .env file explicitly
load_dotenv(ENV_FILE)

print(f"Loading .env from: {ENV_FILE}")
print(f"DATABASE_URL loaded: {os.getenv('DATABASE_URL', 'NOT FOUND')[:30]}...")

class Settings(BaseSettings):
    app_name: str = "Beauty Booking API"
    
    # Database - PostgreSQL only
    database_url: str
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fix Heroku/some providers that use postgres:// instead of postgresql://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
            print(f"⚠️  Converted postgres:// to postgresql:// for SQLAlchemy compatibility")
    
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    
    # Cloudinary settings
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
    class Config:
        env_file = str(ENV_FILE)
        extra = "ignore"
        case_sensitive = False

settings = Settings()