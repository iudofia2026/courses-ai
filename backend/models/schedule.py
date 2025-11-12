"""
Schedule generation and management models.

This module contains Pydantic models for schedule generation,
conflict detection, and optimization.
"""

from datetime import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from .course import Section, Meeting


class ScheduleOption(BaseModel):
    """Represents a specific schedule option with selected sections."""
    sections: List[Section]
    total_credits: float
    quality_score: float = Field(..., ge=0, le=100)
    conflicts: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @property
    def section_ids(self) -> List[str]:
        """Get all section IDs in this schedule option."""
        return [section.id for section in self.sections]
    
    @property
    def course_ids(self) -> List[str]:
        """Get all course IDs in this schedule option."""
        return list(set(section.course_id for section in self.sections))


class ScheduleConflict(BaseModel):
    """Represents a conflict between two sections."""
    section1_id: str
    section2_id: str
    conflict_type: str = Field(..., description="Type of conflict: 'time', 'overlap', 'same_exam'")
    details: str
    severity: str = Field(..., description="Severity: 'error', 'warning'")


class ScheduleConstraints(BaseModel):
    """Constraints for schedule generation."""
    min_credits: Optional[float] = Field(None, ge=0)
    max_credits: Optional[float] = Field(None, ge=0)
    max_gap_minutes: Optional[int] = Field(None, ge=0, description="Maximum gap between classes")
    no_early_morning: bool = False
    no_late_evening: bool = False
    preferred_days: Optional[List[str]] = None
    avoid_times: Optional[List[str]] = None
    break_hours: Optional[List[str]] = Field(default_factory=list, description="Preferred break times")
    
    class Config:
        extra = "allow"


class SchedulePreferences(BaseModel):
    """User preferences for schedule optimization."""
    workload_weight: float = Field(default=0.3, ge=0, le=1)
    rating_weight: float = Field(default=0.3, ge=0, le=1)
    time_preference_weight: float = Field(default=0.2, ge=0, le=1)
    professor_weight: float = Field(default=0.2, ge=0, le=1)
    preferred_professors: Optional[List[str]] = None
    avoided_professors: Optional[List[str]] = None
    preferred_time_blocks: Optional[List[str]] = None
    avoid_time_blocks: Optional[List[str]] = None
    
    def validate_weights(self) -> bool:
        """Ensure weights sum to 1.0."""
        total = (self.workload_weight + self.rating_weight + 
                self.time_preference_weight + self.professor_weight)
        return abs(total - 1.0) < 0.01


class ScheduleRequest(BaseModel):
    """Request model for schedule generation."""
    course_ids: List[str] = Field(..., min_items=1)
    season_code: str
    constraints: Optional[ScheduleConstraints] = None
    preferences: Optional[SchedulePreferences] = None
    max_options: int = Field(default=5, ge=1, le=20)
    include_full_sections: bool = False
    
    class Config:
        extra = "allow"


class GeneratedSchedule(BaseModel):
    """Generated schedule with multiple options."""
    request_id: str
    season_code: str
    options: List[ScheduleOption]
    total_options_generated: int
    processing_time_ms: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    
    @property
    def has_conflicts(self) -> bool:
        """Check if any schedule option has conflicts."""
        return any(option.conflicts for option in self.options)


class ScheduleQuality(BaseModel):
    """Quality metrics for a schedule."""
    workload_score: float = Field(..., ge=0, le=100)
    professor_score: float = Field(..., ge=0, le=100)
    time_distribution_score: float = Field(..., ge=0, le=100)
    balance_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    
    
    @property
    def grade(self) -> str:
        """Get letter grade based on overall score."""
        if self.overall_score >= 90:
            return "A"
        elif self.overall_score >= 80:
            return "B"
        elif self.overall_score >= 70:
            return "C"
        elif self.overall_score >= 60:
            return "D"
        else:
            return "F"


class ScheduleStats(BaseModel):
    """Statistics about generated schedules."""
    total_schedules: int
    schedules_with_conflicts: int
    schedules_without_conflicts: int
    average_quality_score: float
    best_quality_score: float
    worst_quality_score: float
    common_conflicts: List[str] = Field(default_factory=list)


class TimeBlock(BaseModel):
    """Represents a time block for scheduling."""
    day: str = Field(..., pattern="^(M|T|W|TH|F|SAT|SUN)$")
    start_time: time
    end_time: time
    available: bool = True
    
    class Config:
        extra = "allow"


class WeeklySchedule(BaseModel):
    """Weekly view of a schedule option."""
    time_blocks: List[TimeBlock]
    total_weekly_hours: float
    daily_hours: Dict[str, float] = Field(default_factory=dict)
    busiest_day: Optional[str] = None
    free_days: List[str] = Field(default_factory=list)
    
    
    @property
    def has_gap_days(self) -> bool:
        """Check if there are any days with no classes."""
        return len(self.free_days) > 0