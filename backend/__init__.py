"""
AI Course Scheduler Backend.

This is the main backend package for the AI-powered course scheduling application.

Core Features:
- Course search with AI-powered query parsing
- Schedule generation with conflict detection  
- Integration with CourseTable API
- OpenAI integration for intelligent features

Main Components:
- models: Pydantic data models
- services: External service integrations (GraphQL, AI, scheduling)
- routes: FastAPI endpoint handlers
- utils: Helper functions and utilities
- config: Application configuration and settings
"""

__version__ = "1.0.0"
__author__ = "AI Course Scheduler Team"
__description__ = "AI-powered course scheduling backend"