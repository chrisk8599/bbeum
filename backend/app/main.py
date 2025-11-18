from mangum import Mangum
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello from Vercel"}

handler = Mangum(app, lifespan="off")