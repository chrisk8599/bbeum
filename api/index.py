"""
Ultra minimal test - no backend imports at all
Place at: repo_root/api/index.py
"""
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI(title="Bbeum API Test")

@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "success",
        "message": "Minimal test working!",
        "note": "If you see this, the serverless function runs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}

handler = Mangum(app, lifespan="off")