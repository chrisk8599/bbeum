from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os
import sys
import traceback

print("=" * 50)
print("STARTING BBEUM API")
print("=" * 50)
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"DATABASE_URL set: {'DATABASE_URL' in os.environ}")
print(f"SECRET_KEY set: {'SECRET_KEY' in os.environ}")
print("=" * 50)

try:
    # Import your routers
    print("Importing routers...")
    from app.api import (
        vendors, 
        auth, 
        services, 
        availability, 
        bookings, 
        reviews, 
        service_categories, 
        analytics
    )
    print("✓ Routers imported successfully")
except Exception as e:
    print(f"✗ ERROR importing routers: {e}")
    traceback.print_exc()
    raise

try:
    print("Creating FastAPI app...")
    app = FastAPI(
        title="Bbeum API",
        description="API for beauty service bookings with professional management",
        version="2.0.0"
    )
    print("✓ FastAPI app created")
except Exception as e:
    print(f"✗ ERROR creating app: {e}")
    traceback.print_exc()
    raise

# CORS - Update with your actual Vercel URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

try:
    print("Adding CORS middleware...")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            FRONTEND_URL,
            "https://bbeum.vercel.app",
            "https://*.vercel.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✓ CORS middleware added")
except Exception as e:
    print(f"✗ ERROR adding CORS: {e}")
    traceback.print_exc()
    raise

try:
    print("Including routers...")
    # Include routers with /api prefix
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
    app.include_router(services.router, prefix="/api/services", tags=["Services"])
    app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
    app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
    app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
    app.include_router(service_categories.router, prefix="/api/categories", tags=["Categories"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    print("✓ All routers included")
except Exception as e:
    print(f"✗ ERROR including routers: {e}")
    traceback.print_exc()
    raise

@app.get("/")
def read_root():
    return {
        "message": "Bbeum API - Professional Management System",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/api")
def api_root():
    return {
        "message": "Bbeum API",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "vendors": "/api/vendors",
            "services": "/api/services",
            "availability": "/api/availability",
            "bookings": "/api/bookings",
            "reviews": "/api/reviews",
            "categories": "/api/categories",
            "analytics": "/api/analytics"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

try:
    print("Creating Mangum handler...")
    # Serverless handler for Vercel
    handler = Mangum(app, lifespan="off")
    print("✓ Mangum handler created successfully")
    print("=" * 50)
    print("BBEUM API INITIALIZED SUCCESSFULLY")
    print("=" * 50)
except Exception as e:
    print(f"✗ ERROR creating Mangum handler: {e}")
    traceback.print_exc()
    raise