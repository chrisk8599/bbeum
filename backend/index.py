from fastapi import FastAPI
from mangum import Mangum

app = FastAPI(title="Bbeum API")

@app.get("/")
def root():
    return {"message": "Bbeum API", "status": "running"}

@app.get("/health") 
def health():
    return {"status": "healthy"}

# Vercel needs this
handler = Mangum(app)