from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from .core.config import settings
from .models.responses import HealthResponse, ErrorResponse
from .api.routes import query, ai, connection, context


logging.basicConfig(level=logging.INFO if settings.DEBUG else logging.WARNING)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SGBD Backend API",
    description="AI-Powered Database Management System - Backend API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

start_time = time.time()


@app.on_event("startup")
async def startup_event():
    logger.info(f"SGBD Backend starting on {settings.BACKEND_HOST}:{settings.BACKEND_PORT}")
    logger.info(f"Debug mode: {settings.DEBUG}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("SGBD Backend shutting down")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred",
            code="INTERNAL_ERROR"
        ).model_dump()
    )


@app.get("/", response_model=dict)
async def root():
    return {
        "name": "SGBD Backend API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = time.time() - start_time
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        uptime_seconds=uptime
    )


app.include_router(query.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(connection.router, prefix="/api")
app.include_router(context.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG
    )
