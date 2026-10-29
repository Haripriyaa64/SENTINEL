from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.alerts import router as alerts_router
from app.api.traffic import router as traffic_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="IDS and Dark Web Monitoring Platform API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Sensor-Key"],
)

app.include_router(alerts_router)
app.include_router(traffic_router)

@app.get("/", tags=["Health"])
def root() -> dict:
    return {
        "application": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/health/ready", tags=["Health"])
def readiness() -> dict:
    from sqlalchemy import text
    from redis import Redis

    from app.db.session import engine

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    client = Redis.from_url(settings.redis_url)
    try:
        client.ping()
    finally:
        client.close()

    return {
        "status": "ready",
        "database": "connected",
        "redis": "connected",
    }