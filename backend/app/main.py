from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import vendors, auth, services, availability, bookings, reviews, service_categories, analytics
from mangum import Mangum  # Serverless adapter

app = FastAPI(
    title="Bbeum API",
    description="API for beauty service bookings with professional management",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app-name.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(service_categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

# Health & root
@app.get("/")
def read_root():
    return {"message": "Bbeum API - Professional Management System", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Database init on startup (optional)
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

# Serverless handler
handler = Mangum(app)
