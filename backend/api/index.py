from fastapi import FastAPI
from mangum import Mangum
import sys
import os

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(
    title="Bbeum API",
    description="API for beauty service bookings with professional management",
    version="2.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Bbeum API - Minimal Test",
        "status": "running",
        "info": "Database routers disabled for testing"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "database": "not connected yet"}

@app.get("/test-env")
def test_env():
    """Test if environment variables are set"""
    return {
        "DATABASE_URL_exists": "DATABASE_URL" in os.environ,
        "SECRET_KEY_exists": "SECRET_KEY" in os.environ,
        "python_version": sys.version
    }

# Vercel serverless handler
handler = Mangum(app, lifespan="off")