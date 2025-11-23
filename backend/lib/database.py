from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from lib.config import settings

print(f"Database configuration starting...")
print(f"DATABASE_URL: {settings.database_url[:30]}...")

# PostgreSQL with optimized connection pooling for serverless
engine = create_engine(
    settings.database_url,
    pool_size=5,              # Maintain 5 persistent connections
    max_overflow=10,          # Allow 10 additional temp connections
    pool_timeout=30,          # Wait max 30 seconds for connection
    pool_recycle=300,         # Recycle connections after 5 minutes (you had this)
    pool_pre_ping=True,       # Verify connections before use (you had this)
    echo=False                # Set True for debugging SQL queries
)

print("✓ Database engine created successfully")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("✓ Database module loaded successfully")