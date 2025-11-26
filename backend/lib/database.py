from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from lib.config import settings

print(f"Database configuration starting...")
print(f"DATABASE_URL: {settings.database_url[:30]}...")

# PostgreSQL with optimized connection pooling for serverless
engine = create_engine(
    DATABASE_URL,
    pool_size=1,           # Only 1 connection in pool
    max_overflow=0,        # No extra connections
    pool_pre_ping=True,    # Check connection before using
    pool_recycle=3600      # Recycle connections every hour
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


