"""
Backend API routes package.

This package contains all FastAPI route handlers for the AI Course Scheduler.
"""

from .search import router as search_router
from .schedules import router as schedules_router

__all__ = [
    "search_router",
    "schedules_router"
]