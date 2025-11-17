from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import vendors, auth, services, availability, bookings, reviews, service_categories,analytics
from app.models import (
    user, 
    vendor, 
    professional,  # NEW
    professional_invite,  # NEW
    service, 
    availability as availability_models, 
    booking, 
    review
)
from app.models.service_category import ServiceCategory

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bbeum API",
    description="API for beauty service bookings with professional management",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.0.77:3000",
        "https://your-app-name.vercel.app",  # ADD YOUR VERCEL DOMAIN
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import professionals router
from app.api import professionals

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(professionals.router, prefix="/api/professionals", tags=["Professionals"])  # NEW
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
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}