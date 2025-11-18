from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os

# Import your routers
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

app = FastAPI(
    title="Bbeum API",
    description="API for beauty service bookings with professional management",
    version="2.0.0"
)

# CORS - Update with your actual Vercel URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        FRONTEND_URL,
        "https://bbeum.vercel.app",  # Replace with your actual frontend URL
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(service_categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

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

# Serverless handler for Vercel
handler = Mangum(app, lifespan="off")