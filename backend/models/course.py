"""
Course data models matching CourseTable API schema.

This module contains Pydantic models for course data, professors,
seasons, and other related entities from the CourseTable API.
"""

from datetime import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Timeslot(BaseModel):
    """Represents a meeting time slot for a course section."""
    start_time: time
    end_time: time
    
    class Config:
        # Allow string times like "14:00:00"
        json_encoders = {
            time: lambda v: v.isoformat()
        }


class Meeting(BaseModel):
    """Represents a meeting time and location for a course section."""
    timeslots: List[Timeslot]
    days: str = Field(..., description="Days of week, e.g., 'MW', 'TTH', 'MWF'")
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Evaluation(BaseModel):
    """Course evaluation statistics."""
    workload: Optional[float] = Field(None, ge=0, le=5)
    rating: Optional[float] = Field(None, ge=0, le=5)
    
    class Config:
        # Allow both float and string representations
        extra = "allow"


class Professor(BaseModel):
    """Professor information."""
    id: Optional[int] = None
    name: str
    email: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    workload: Optional[float] = Field(None, ge=0, le=5)
    evaluations: Optional[Evaluation] = None
    oci: Optional[float] = None
    
    class Config:
        extra = "allow"


class Season(BaseModel):
    """Academic season information."""
    code: str = Field(..., description="Season code, e.g., '202401'")
    year: int
    term: str = Field(..., description="Fall, Spring, or Summer")
    
    class Config:
        extra = "allow"


class Course(BaseModel):
    """Course information matching CourseTable API schema."""
    id: str = Field(..., description="Course unique identifier")
    title: str
    description: Optional[str] = None
    credits: Optional[float] = Field(None, ge=0)
    department: Optional[Dict[str, Any]] = None
    areas: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    professors: Optional[List[Professor]] = None
    requirements: Optional[List[str]] = None
    syllabus_url: Optional[str] = None
    
    class Config:
        extra = "allow"


class Section(BaseModel):
    """Course section information."""
    id: str = Field(..., description="Section unique identifier")
    course_id: str
    section: str = Field(..., description="Section number, e.g., '01', '02'")
    crn: Optional[int] = None
    season_code: str
    teaching_method: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    enrolled: Optional[int] = Field(None, ge=0)
    waitlist: Optional[int] = Field(None, ge=0)
    meetings: Optional[List[Meeting]] = None
    professors: Optional[List[Professor]] = None
    notes: Optional[str] = None
    syllabus_url: Optional[str] = None
    final_exam: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"


class CourseWithSections(BaseModel):
    """Course with its sections, for search results."""
    course: Course
    sections: List[Section]
    
    def get_available_sections(self) -> List[Section]:
        """Get sections that have available seats."""
        return [
            section for section in self.sections
            if section.capacity and section.enrolled and section.capacity > section.enrolled
        ]


class CourseSearchResult(BaseModel):
    """Result of a course search query."""
    courses: List[CourseWithSections]
    total_count: int
    has_more: bool
    next_offset: Optional[int] = None


class CourseListing(BaseModel):
    """Course listing information from CourseTable API."""
    code: str
    title: str
    description: Optional[str] = None
    credits: Optional[float] = None
    
    class Config:
        extra = "allow"


class SeasonInfo(BaseModel):
    """Season information for API requests."""
    season_code: str
    season_code_current: Optional[str] = None
    seasons: Optional[List[Season]] = None


class PageInfo(BaseModel):
    """Pagination information from GraphQL responses."""
    has_next_page: bool
    has_previous_page: bool
    start_cursor: Optional[str] = None
    end_cursor: Optional[str] = None