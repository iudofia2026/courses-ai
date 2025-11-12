"""
Search request and response models.

This module contains Pydantic models for course search functionality,
including AI-powered query parsing and filtering.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

from .course import CourseWithSections, SeasonInfo


class SearchFilter(BaseModel):
    """Individual search filter for course queries."""
    field: str = Field(..., description="Field to filter on, e.g., 'department', 'areas'")
    operator: str = Field(..., description="Operator: '=', 'in', 'contains', 'regex'")
    value: Union[str, List[str], int, float, bool]
    
    class Config:
        extra = "allow"


class CourseSearchQuery(BaseModel):
    """Course search query with filters and pagination."""
    query: Optional[str] = None
    filters: List[SearchFilter] = Field(default_factory=list)
    season_code: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    sort_by: Optional[str] = None
    sort_direction: str = Field(default="asc", pattern="^(asc|desc)$")
    include_full_sections: bool = False
    
    class Config:
        extra = "allow"


class ParsedQuery(BaseModel):
    """AI-parsed query with structured search parameters."""
    original_query: str
    intent: str = Field(..., description="Search intent: 'course', 'professor', 'area', etc.")
    keywords: List[str] = Field(default_factory=list)
    filters: List[SearchFilter] = Field(default_factory=list)
    entities: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(..., ge=0, le=1)
    suggestions: List[str] = Field(default_factory=list)
    
    class Config:
        extra = "allow"


class SearchRequest(BaseModel):
    """Complete search request with AI query parsing."""
    user_query: Optional[str] = None
    structured_query: Optional[CourseSearchQuery] = None
    use_ai_parsing: bool = True
    season_code: Optional[str] = None
    max_results: int = Field(default=50, ge=1, le=200)
    
    class Config:
        extra = "allow"


class SearchResult(BaseModel):
    """Individual search result with course and section info."""
    course_with_sections: CourseWithSections
    relevance_score: float = Field(default=1.0, ge=0, le=1)
    match_reasons: List[str] = Field(default_factory=list)
    highlights: Dict[str, List[str]] = Field(default_factory=dict)
    
    
    @property
    def course(self):
        """Get the course object for convenience."""
        return self.course_with_sections.course
    
    
    @property
    def sections(self):
        """Get the sections list for convenience."""
        return self.course_with_sections.sections


class SearchResponse(BaseModel):
    """Complete search response with pagination and metadata."""
    results: List[SearchResult]
    total_count: int
    has_more: bool
    next_offset: Optional[int] = None
    parsed_query: Optional[ParsedQuery] = None
    query_time_ms: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    
    @property
    def courses(self):
        """Get all courses from results."""
        return [result.course_with_sections for result in self.results]


class SuggestionRequest(BaseModel):
    """Request for search suggestions."""
    partial_query: str = Field(..., min_length=1)
    season_code: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=20)
    
    class Config:
        extra = "allow"


class SearchSuggestion(BaseModel):
    """Search suggestion with metadata."""
    text: str
    type: str = Field(..., description="Type: 'course', 'professor', 'area', 'keyword'")
    count: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        extra = "allow"


class SuggestionResponse(BaseModel):
    """Response containing search suggestions."""
    suggestions: List[SearchSuggestion]
    query_time_ms: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PopularSearch(BaseModel):
    """Popular search term with statistics."""
    query: str
    count: int
    last_searched: datetime
    average_results: float
    
    class Config:
        extra = "allow"


class SearchAnalytics(BaseModel):
    """Analytics data for search functionality."""
    total_searches: int
    unique_queries: int
    average_results_per_search: float
    most_searched_courses: List[PopularSearch] = Field(default_factory=list)
    search_trends: Dict[str, List[PopularSearch]] = Field(default_factory=dict)
    
    class Config:
        extra = "allow"


class FilterOption(BaseModel):
    """Filter option for UI display."""
    field: str
    label: str
    type: str = Field(..., description="Type: 'select', 'multiselect', 'range', 'text'")
    options: List[Dict[str, Any]] = Field(default_factory=list)
    min_value: Optional[Union[int, float]] = None
    max_value: Optional[Union[int, float]] = None
    
    class Config:
        extra = "allow"


class SearchConfig(BaseModel):
    """Configuration for search functionality."""
    available_filters: List[FilterOption] = Field(default_factory=list)
    default_sort_options: List[str] = Field(default_factory=list)
    max_results_per_page: int = Field(default=50, ge=10, le=200)
    enable_ai_search: bool = True
    cache_results: bool = True
    cache_ttl_seconds: int = Field(default=300, ge=60, le=3600)
    
    class Config:
        extra = "allow"


class CourseDetailRequest(BaseModel):
    """Request for detailed course information."""
    course_id: str
    season_code: Optional[str] = None
    include_sections: bool = True
    include_evaluations: bool = True
    
    class Config:
        extra = "allow"


class SectionDetail(BaseModel):
    """Detailed section information with analytics."""
    section_id: str
    enrollment_history: List[Dict[str, Any]] = Field(default_factory=list)
    waitlist_trend: Optional[str] = None
    typical_enrollment: Optional[int] = None
    popularity_score: Optional[float] = None
    
    class Config:
        extra = "allow"


class CourseDetailResponse(BaseModel):
    """Detailed course information response."""
    course_with_sections: CourseWithSections
    section_details: List[SectionDetail] = Field(default_factory=list)
    similar_courses: List[Dict[str, Any]] = Field(default_factory=list)
    prerequisite_info: Optional[Dict[str, Any]] = None
    query_time_ms: int
    
    class Config:
        extra = "allow"