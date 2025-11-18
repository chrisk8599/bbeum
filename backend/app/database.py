from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import sys

print(f"Database configuration starting...")
print(f"DATABASE_URL: {settings.database_url[:20]}...")  # Don't print full URL with credentials

try:
    # Handle both SQLite (local) and PostgreSQL (production)
    if settings.database_url.startswith("sqlite"):
        print("Using SQLite database (local development)")
        engine = create_engine(
            settings.database_url, 
            connect_args={"check_same_thread": False}
        )
    elif settings.database_url.startswith("postgresql"):
        print("Using PostgreSQL database (production)")
        # PostgreSQL doesn't need check_same_thread
        # Add pool settings for serverless
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=300,  # Recycle connections after 5 minutes
        )
    else:
        print(f"⚠️  Unknown database type in URL: {settings.database_url[:10]}")
        engine = create_engine(settings.database_url)
    
    print("✓ Database engine created successfully")
    
except Exception as e:
    print(f"✗ ERROR creating database engine: {e}")
    import traceback
    traceback.print_exc()
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("✓ Database module loaded successfully")