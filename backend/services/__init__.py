"""
Backend services package.

This package contains all service classes for the AI Course Scheduler backend.
"""

from .graphql_client import course_table_client, CourseTableClient, CourseTableError
from .ai_service import ai_service, AIService, AIServiceError
from .schedule_generator import schedule_generator, ScheduleGenerator, ScheduleGeneratorError

__all__ = [
    "course_table_client",
    "CourseTableClient", 
    "CourseTableError",
    "ai_service",
    "AIService",
    "AIServiceError", 
    "schedule_generator",
    "ScheduleGenerator",
    "ScheduleGeneratorError"
]