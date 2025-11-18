from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os
import sys
import traceback

print("=" * 80)
print("BBEUM API - DETAILED STARTUP LOG")
print("=" * 80)
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"DATABASE_URL set: {'DATABASE_URL' in os.environ}")
print(f"SECRET_KEY set: {'SECRET_KEY' in os.environ}")
print("=" * 80)

# Try importing routers one by one to see which fails
routers_to_import = {
    'auth': 'app.api.auth',
    'vendors': 'app.api.vendors',
    'services': 'app.api.services',
    'availability': 'app.api.availability',
    'bookings': 'app.api.bookings',
    'reviews': 'app.api.reviews',
    'service_categories': 'app.api.service_categories',
    'analytics': 'app.api.analytics'
}

imported_routers = {}
failed_routers = {}

for router_name, module_path in routers_to_import.items():
    try:
        print(f"Importing {router_name}...")
        module = __import__(module_path, fromlist=['router'])
        imported_routers[router_name] = module.router
        print(f"✓ {router_name} imported successfully")
    except Exception as e:
        print(f"✗ ERROR importing {router_name}: {e}")
        traceback.print_exc()
        failed_routers[router_name] = str(e)

print("=" * 80)
print(f"Successfully imported: {len(imported_routers)}/{len(routers_to_import)}")
print(f"Failed imports: {len(failed_routers)}")
if failed_routers:
    print("Failed routers:", list(failed_routers.keys()))
print("=" * 80)

# Create app
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

# CORS
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

# Include only successfully imported routers
try:
    print("Including routers...")
    if 'auth' in imported_routers:
        app.include_router(imported_routers['auth'], prefix="/api/auth", tags=["Authentication"])
    if 'vendors' in imported_routers:
        app.include_router(imported_routers['vendors'], prefix="/api/vendors", tags=["Vendors"])
    if 'services' in imported_routers:
        app.include_router(imported_routers['services'], prefix="/api/services", tags=["Services"])
    if 'availability' in imported_routers:
        app.include_router(imported_routers['availability'], prefix="/api/availability", tags=["Availability"])
    if 'bookings' in imported_routers:
        app.include_router(imported_routers['bookings'], prefix="/api/bookings", tags=["Bookings"])
    if 'reviews' in imported_routers:
        app.include_router(imported_routers['reviews'], prefix="/api/reviews", tags=["Reviews"])
    if 'service_categories' in imported_routers:
        app.include_router(imported_routers['service_categories'], prefix="/api/categories", tags=["Categories"])
    if 'analytics' in imported_routers:
        app.include_router(imported_routers['analytics'], prefix="/api/analytics", tags=["Analytics"])
    print(f"✓ Included {len(imported_routers)} routers")
except Exception as e:
    print(f"✗ ERROR including routers: {e}")
    traceback.print_exc()
    raise

@app.get("/")
def read_root():
    return {
        "message": "Bbeum API - Professional Management System",
        "docs": "/docs",
        "status": "running",
        "imported_routers": list(imported_routers.keys()),
        "failed_routers": failed_routers
    }

@app.get("/api")
def api_root():
    return {
        "message": "Bbeum API",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/auth" if 'auth' in imported_routers else "FAILED",
            "vendors": "/api/vendors" if 'vendors' in imported_routers else "FAILED",
            "services": "/api/services" if 'services' in imported_routers else "FAILED",
            "availability": "/api/availability" if 'availability' in imported_routers else "FAILED",
            "bookings": "/api/bookings" if 'bookings' in imported_routers else "FAILED",
            "reviews": "/api/reviews" if 'reviews' in imported_routers else "FAILED",
            "categories": "/api/categories" if 'service_categories' in imported_routers else "FAILED",
            "analytics": "/api/analytics" if 'analytics' in imported_routers else "FAILED"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/debug")
def debug_info():
    """Debug endpoint to check environment"""
    return {
        "status": "running",
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "env_vars": {
            "DATABASE_URL_set": "DATABASE_URL" in os.environ,
            "SECRET_KEY_set": "SECRET_KEY" in os.environ,
            "CLOUDINARY_CLOUD_NAME_set": "CLOUDINARY_CLOUD_NAME" in os.environ,
        },
        "imported_routers": list(imported_routers.keys()),
        "failed_routers": failed_routers
    }

try:
    print("Creating Mangum handler...")
    handler = Mangum(app, lifespan="off")
    print("✓ Mangum handler created successfully")
    print("=" * 80)
    print("BBEUM API STARTUP COMPLETE")
    print("=" * 80)
except Exception as e:
    print(f"✗ FATAL ERROR creating handler: {e}")
    traceback.print_exc()
    raise