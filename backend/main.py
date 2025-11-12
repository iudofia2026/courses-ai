"""
Main FastAPI application for AI Course Scheduler.

This module sets up the FastAPI application, middleware, routers,
and handles application lifecycle events.
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

from config import settings
from routes import search_router, schedules_router
from services import course_table_client, ai_service

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Get structured logger
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting AI Course Scheduler API", 
                environment=settings.environment,
                version=settings.api_version)
    
    try:
        # Initialize services and perform health checks
        await startup_health_checks()
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error("Application startup failed", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Course Scheduler API")
    
    try:
        # Close service connections
        await cleanup_services()
        
        logger.info("Application shutdown completed successfully")
        
    except Exception as e:
        logger.error("Application shutdown failed", error=str(e))


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
    contact={
        "name": "AI Course Scheduler Team",
        "email": "support@courses-ai.example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    }
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    **settings.cors_config
)

# Add trusted host middleware for production
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["courses-ai.example.com", "*.courses-ai.example.com"]
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses."""
    import time
    
    start_time = time.time()
    
    # Log request
    logger.info(
        "API request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            "API request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time_ms=round(process_time * 1000, 2)
        )
        
        # Add processing time header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        
        logger.error(
            "API request failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time_ms=round(process_time * 1000, 2)
        )
        
        raise


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.error(
        "Unhandled exception",
        method=request.method,
        url=str(request.url),
        error=str(exc),
        error_type=type(exc).__name__
    )
    
    if settings.is_development:
        # Include detailed error info in development
        import traceback
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc() if settings.debug else None
            }
        )
    else:
        # Generic error response in production
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Comprehensive health check for all services.
    
    Returns:
        Dict: Health status of all application components
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": settings.api_version,
        "environment": settings.environment,
        "components": {}
    }
    
    # Check CourseTable API
    try:
        coursetable_health = await course_table_client.health_check()
        health_status["components"]["coursetable_api"] = coursetable_health
        
        if coursetable_health["status"] != "healthy":
            health_status["status"] = "degraded"
            
    except Exception as e:
        health_status["components"]["coursetable_api"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # Check AI Service
    try:
        ai_health = await ai_service.health_check()
        health_status["components"]["ai_service"] = ai_health
        
        if ai_health["status"] != "healthy" and settings.ai_search_enabled:
            health_status["status"] = "degraded"
            
    except Exception as e:
        health_status["components"]["ai_service"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        if settings.ai_search_enabled:
            health_status["status"] = "degraded"
    
    # Overall status determination
    component_statuses = [
        comp.get("status", "unknown") 
        for comp in health_status["components"].values()
    ]
    
    if "unhealthy" in component_statuses:
        health_status["status"] = "unhealthy"
    elif "degraded" in component_statuses:
        health_status["status"] = "degraded"
    
    return health_status


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with basic API information.
    
    Returns:
        Dict: API information and status
    """
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "status": "running",
        "environment": settings.environment,
        "docs_url": "/docs" if settings.is_development else None,
        "health_check_url": "/health",
        "endpoints": {
            "search": "/api/search/",
            "schedules": "/api/schedules/"
        }
    }


# API version endpoint
@app.get("/version")
async def get_version():
    """
    Get API version information.
    
    Returns:
        Dict: Version and build information
    """
    return {
        "api_version": settings.api_version,
        "environment": settings.environment,
        "features": {
            "ai_search_enabled": settings.ai_search_enabled,
            "search_enabled": True,
            "schedule_generation_enabled": True,
            "rate_limiting_enabled": settings.rate_limit_enabled
        }
    }


# Include routers
app.include_router(search_router, prefix="/api")
app.include_router(schedules_router)


async def startup_health_checks():
    """Perform health checks during application startup."""
    logger.info("Performing startup health checks")
    
    # Check CourseTable API
    try:
        coursetable_health = await course_table_client.health_check()
        if coursetable_health["status"] == "healthy":
            logger.info("CourseTable API health check passed")
        else:
            logger.warning("CourseTable API health check failed", 
                         status=coursetable_health["status"])
    except Exception as e:
        logger.error("CourseTable API health check error", error=str(e))
        raise
    
    # Check AI Service if enabled
    if settings.ai_search_enabled:
        try:
            ai_health = await ai_service.health_check()
            if ai_health["status"] == "healthy":
                logger.info("AI service health check passed")
            else:
                logger.warning("AI service health check failed",
                             status=ai_health["status"])
        except Exception as e:
            logger.error("AI service health check error", error=str(e))
            # Don't fail startup for AI service issues in production
            if not settings.is_production:
                raise


async def cleanup_services():
    """Clean up service connections during shutdown."""
    logger.info("Cleaning up service connections")
    
    try:
        await course_table_client.close()
        logger.info("CourseTable client closed successfully")
    except Exception as e:
        logger.warning("Error closing CourseTable client", error=str(e))
    
    # Note: OpenAI client doesn't require explicit cleanup
    logger.info("Service cleanup completed")


if __name__ == "__main__":
    import uvicorn
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=settings.log_format
    )
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
        access_log=True
    )