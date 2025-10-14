from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import vendors, auth, services
from app.models import user, vendor, service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Beauty Booking API",
    description="API for beauty service bookings",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])

@app.get("/")
def read_root():
    return {
        "message": "Beauty Booking API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}