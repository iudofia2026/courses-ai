"""
Application configuration using Pydantic Settings.

This module handles all environment variables and application settings
with proper validation and type checking.
"""

from typing import List, Optional
from functools import lru_cache
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # FastAPI Configuration
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    debug: bool = Field(default=False)
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000, ge=1, le=65535)
    api_title: str = Field(default="AI Course Scheduler API")
    api_version: str = Field(default="1.0.0")
    api_description: str = Field(default="AI-powered course search and scheduling API")
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
    )
    cors_allow_credentials: bool = Field(default=True)
    cors_allow_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    cors_allow_headers: List[str] = Field(default=["*"])
    
    # AI Configuration
    ai_provider: str = Field(default="openai", pattern="^(openai|gemini)$")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    openai_model: str = Field(default="gpt-4-turbo-preview")
    openai_temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    openai_max_tokens: int = Field(default=2000, ge=1)
    openai_timeout: int = Field(default=30, ge=1)

    # Gemini API Configuration
    gemini_api_key: Optional[str] = Field(default=None, description="Google Gemini API key")
    gemini_model: str = Field(default="gemini-2.0-flash")
    gemini_temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    gemini_max_tokens: int = Field(default=2000, ge=1)
    gemini_timeout: int = Field(default=30, ge=1)

    # AI Features Toggle
    ai_search_enabled: bool = Field(default=False)
    
    # CourseTable API Configuration
    coursetable_api_url: str = Field(
        default="https://graph.coursetable.com/api/v1/graphql"
    )
    coursetable_timeout: int = Field(default=10, ge=1)
    coursetable_retries: int = Field(default=3, ge=0)
    
    # Redis Configuration (Optional)
    redis_url: Optional[str] = Field(default=None, description="Redis URL for caching")
    redis_ttl: int = Field(default=300, ge=60, description="Default TTL in seconds")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Rate Limiting Configuration
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_requests: int = Field(default=100, ge=1)
    rate_limit_window: int = Field(default=3600, ge=1)  # 1 hour
    
    # Search Configuration
    search_max_results: int = Field(default=100, ge=1, le=500)
    search_cache_enabled: bool = Field(default=True)
    search_cache_ttl: int = Field(default=300, ge=60)
    ai_search_enabled: bool = Field(default=True)
    
    # Schedule Generation Configuration
    schedule_max_options: int = Field(default=20, ge=1, le=50)
    schedule_timeout_seconds: int = Field(default=30, ge=5, le=300)
    schedule_quality_threshold: float = Field(default=50.0, ge=0.0, le=100.0)
    
    # Monitoring and Health Checks
    health_check_enabled: bool = Field(default=True)
    metrics_enabled: bool = Field(default=False)
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            # Handle JSON-like string with brackets and quotes
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                # Handle comma-separated string
                return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator('api_port', pre=True)
    def validate_port(cls, v):
        """Validate API port number."""
        if isinstance(v, str):
            try:
                port = int(v)
                if not (1 <= port <= 65535):
                    raise ValueError("Port must be between 1 and 65535")
                return port
            except ValueError:
                raise ValueError("Port must be a valid integer")
        return v
    
    @validator('openai_temperature', pre=True)
    def validate_temperature(cls, v):
        """Validate OpenAI temperature."""
        if isinstance(v, str):
            try:
                temp = float(v)
                if not (0.0 <= temp <= 2.0):
                    raise ValueError("Temperature must be between 0.0 and 2.0")
                return temp
            except ValueError:
                raise ValueError("Temperature must be a valid float")
        return v
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() == "production"
    
    @property
    def is_staging(self) -> bool:
        """Check if running in staging mode."""
        return self.environment.lower() == "staging"
    
    @property
    def cors_config(self) -> dict:
        """Get CORS configuration as dictionary."""
        return {
            "allow_origins": self.cors_origins,
            "allow_credentials": self.cors_allow_credentials,
            "allow_methods": self.cors_allow_methods,
            "allow_headers": self.cors_allow_headers,
        }
    
    @property
    def openai_config(self) -> dict:
        """Get OpenAI configuration as dictionary."""
        return {
            "api_key": self.openai_api_key,
            "model": self.openai_model,
            "temperature": self.openai_temperature,
            "max_tokens": self.openai_max_tokens,
            "timeout": self.openai_timeout,
        }
    
    @property
    def coursetable_config(self) -> dict:
        """Get CourseTable API configuration as dictionary."""
        return {
            "url": self.coursetable_api_url,
            "timeout": self.coursetable_timeout,
            "retries": self.coursetable_retries,
        }
    
    @property
    def redis_config(self) -> Optional[dict]:
        """Get Redis configuration as dictionary if enabled."""
        if self.redis_url:
            return {
                "url": self.redis_url,
                "default_ttl": self.redis_ttl,
            }
        return None
    
    @property
    def logging_config(self) -> dict:
        """Get logging configuration as dictionary."""
        return {
            "level": self.log_level,
            "format": self.log_format,
        }
    
    @property
    def rate_limit_config(self) -> dict:
        """Get rate limiting configuration as dictionary."""
        return {
            "enabled": self.rate_limit_enabled,
            "requests": self.rate_limit_requests,
            "window": self.rate_limit_window,
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    
    Returns:
        Settings: Application configuration object
        
    This function uses LRU cache to avoid re-reading environment variables
    on every call. The cache is automatically invalidated when the
    application restarts.
    """
    return Settings()


# Export the settings instance for easy import
settings = get_settings()


# Configuration constants
DEFAULT_SEASON_CODE = "202401"  # Can be updated as needed
SUPPORTED_SEASONS = [
    "202401", "202402", "202403",  # 2023-2024
    "202501", "202502", "202503",  # 2024-2025
    "202601", "202602", "202603",  # 2025-2026
]

SEARCH_FIELDS = [
    "title",
    "description", 
    "areas",
    "skills",
    "department",
    "professors.name",
]

SUPPORTED_QUERY_TYPES = [
    "course",
    "professor",
    "area",
    "keyword",
    "requirement",
]

SCHEDULE_GENERATION_LIMITS = {
    "max_courses_per_schedule": 10,
    "max_options_per_request": 20,
    "min_quality_score": 30.0,
    "max_processing_time_seconds": 60,
}