"""
Backend data models package.

This package contains all Pydantic models for the AI Course Scheduler backend.
"""

from .course import (
    Course,
    Section,
    CourseWithSections,
    CourseSearchResult,
    Professor,
    Meeting,
    Timeslot,
    Season,
    Evaluation,
    PageInfo
)

from .schedule import (
    ScheduleOption,
    ScheduleRequest,
    GeneratedSchedule,
    ScheduleConstraints,
    SchedulePreferences,
    ScheduleConflict,
    ScheduleQuality,
    ScheduleStats,
    WeeklySchedule,
    TimeBlock
)

from .search import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    CourseSearchQuery,
    ParsedQuery,
    SearchFilter,
    SuggestionRequest,
    SuggestionResponse,
    SearchSuggestion,
    CourseDetailRequest,
    CourseDetailResponse,
    SearchAnalytics
)

__all__ = [
    # Course models
    "Course",
    "Section", 
    "CourseWithSections",
    "CourseSearchResult",
    "Professor",
    "Meeting",
    "Timeslot",
    "Season",
    "Evaluation",
    "PageInfo",
    
    # Schedule models
    "ScheduleOption",
    "ScheduleRequest",
    "GeneratedSchedule",
    "ScheduleConstraints",
    "SchedulePreferences",
    "ScheduleConflict",
    "ScheduleQuality",
    "ScheduleStats",
    "WeeklySchedule",
    "TimeBlock",
    
    # Search models
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
    "CourseSearchQuery",
    "ParsedQuery",
    "SearchFilter",
    "SuggestionRequest",
    "SuggestionResponse",
    "SearchSuggestion",
    "CourseDetailRequest",
    "CourseDetailResponse",
    "SearchAnalytics"
]