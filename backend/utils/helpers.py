"""
Utility functions and helper methods.

This module contains common utility functions used across the backend,
including data parsing, error handling, and helper methods.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, time
import traceback

from models.course import (
    Course, 
    Section, 
    CourseWithSections,
    Professor,
    Meeting,
    Timeslot,
    Evaluation
)

logger = logging.getLogger(__name__)


def parse_course_data(course_node: Dict[str, Any]) -> Optional[CourseWithSections]:
    """
    Parse course data from GraphQL response node.
    
    Args:
        course_node: Raw course data from CourseTable API
        
    Returns:
        CourseWithSections: Parsed course with sections or None if parsing fails
    """
    try:
        # Parse course information
        course_data = {
            "id": course_node.get("id"),
            "title": course_node.get("title", ""),
            "description": course_node.get("description"),
            "credits": course_node.get("credits"),
            "department": course_node.get("department"),
            "areas": [area.get("name") for area in course_node.get("areas", [])],
            "skills": [skill.get("name") for skill in course_node.get("skills", [])],
            "professors": _parse_professors(course_node.get("professors", [])),
            "requirements": [req.get("name") for req in course_node.get("requirements", [])],
            "syllabus_url": course_node.get("syllabusUrl")
        }
        
        # Create Course object
        course = Course(**course_data)
        
        # Parse sections
        sections = []
        sections_data = course_node.get("sections", [])
        for section_data in sections_data:
            section = _parse_section_data(section_data, course_data["id"])
            if section:
                sections.append(section)
        
        return CourseWithSections(
            course=course,
            sections=sections
        )
        
    except Exception as e:
        logger.error(f"Error parsing course data: {str(e)}")
        logger.debug(f"Course node data: {course_node}")
        return None


def _parse_professors(professors_data: List[Dict[str, Any]]) -> List[Professor]:
    """Parse professor data from API response."""
    professors = []
    
    for prof_data in professors_data:
        try:
            # Parse evaluations
            evaluations_data = prof_data.get("evaluations")
            evaluations = None
            if evaluations_data:
                evaluations = Evaluation(
                    workload=evaluations_data.get("workload"),
                    rating=evaluations_data.get("rating")
                )
            
            professor = Professor(
                id=prof_data.get("id"),
                name=prof_data.get("name", ""),
                email=prof_data.get("email"),
                rating=evaluations.rating if evaluations else None,
                workload=evaluations.workload if evaluations else None,
                evaluations=evaluations,
                oci=prof_data.get("oci")
            )
            professors.append(professor)
            
        except Exception as e:
            logger.warning(f"Error parsing professor data: {str(e)}")
            continue
    
    return professors


def _parse_section_data(section_data: Dict[str, Any], course_id: str) -> Optional[Section]:
    """Parse section data from API response."""
    try:
        # Parse meetings
        meetings = []
        meetings_data = section_data.get("meetings", [])
        for meeting_data in meetings_data:
            meeting = _parse_meeting_data(meeting_data)
            if meeting:
                meetings.append(meeting)
        
        # Parse professors
        professors = _parse_professors(section_data.get("professors", []))
        
        section = Section(
            id=section_data.get("id"),
            course_id=course_id,
            section=section_data.get("section", ""),
            crn=section_data.get("crn"),
            season_code=section_data.get("seasonCode"),
            teaching_method=section_data.get("teachingMethod"),
            capacity=section_data.get("capacity"),
            enrolled=section_data.get("enrolled"),
            waitlist=section_data.get("waitlist"),
            meetings=meetings,
            professors=professors,
            notes=section_data.get("notes"),
            final_exam=section_data.get("finalExam")
        )
        
        return section
        
    except Exception as e:
        logger.warning(f"Error parsing section data: {str(e)}")
        return None


def _parse_meeting_data(meeting_data: Dict[str, Any]) -> Optional[Meeting]:
    """Parse meeting data from API response."""
    try:
        # Parse timeslots
        timeslots = []
        timeslots_data = meeting_data.get("timeslots", [])
        for timeslot_data in timeslots_data:
            timeslot = _parse_timeslot_data(timeslot_data)
            if timeslot:
                timeslots.append(timeslot)
        
        meeting = Meeting(
            timeslots=timeslots,
            days=meeting_data.get("days", ""),
            location=meeting_data.get("location"),
            start_date=meeting_data.get("startDate"),
            end_date=meeting_data.get("endDate")
        )
        
        return meeting
        
    except Exception as e:
        logger.warning(f"Error parsing meeting data: {str(e)}")
        return None


def _parse_timeslot_data(timeslot_data: Dict[str, Any]) -> Optional[Timeslot]:
    """Parse timeslot data from API response."""
    try:
        # Parse time strings to time objects
        start_time_str = timeslot_data.get("startTime")
        end_time_str = timeslot_data.get("endTime")
        
        start_time = _parse_time_string(start_time_str)
        end_time = _parse_time_string(end_time_str)
        
        if start_time and end_time:
            return Timeslot(
                start_time=start_time,
                end_time=end_time
            )
        
    except Exception as e:
        logger.warning(f"Error parsing timeslot data: {str(e)}")
    
    return None


def _parse_time_string(time_str: Optional[str]) -> Optional[time]:
    """Parse time string to time object."""
    if not time_str:
        return None
    
    try:
        # Handle different time formats
        if ":" in time_str:
            # Format like "14:00:00" or "14:00"
            parts = time_str.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            second = int(parts[2]) if len(parts) > 2 else 0
            return time(hour, minute, second)
        else:
            # Handle other formats if needed
            logger.warning(f"Unrecognized time format: {time_str}")
            return None
            
    except Exception as e:
        logger.warning(f"Error parsing time string '{time_str}': {str(e)}")
        return None


def parse_search_response(response_data: Dict[str, Any]) -> List[CourseWithSections]:
    """
    Parse search response data into list of courses with sections.
    
    Args:
        response_data: Raw response data from CourseTable API
        
    Returns:
        List[CourseWithSections]: Parsed courses
    """
    courses = []
    
    try:
        if "courses" in response_data:
            courses_edges = response_data["courses"].get("edges", [])
            
            for edge in courses_edges:
                course_node = edge.get("node", {})
                course_with_sections = parse_course_data(course_node)
                if course_with_sections:
                    courses.append(course_with_sections)
    
    except Exception as e:
        logger.error(f"Error parsing search response: {str(e)}")
    
    return courses


def error_handler(func):
    """
    Decorator for consistent error handling.
    
    Provides consistent error logging and response formatting across API endpoints.
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            logger.debug(f"Traceback: {traceback.format_exc()}")
            
            # Return standardized error response
            return {
                "error": True,
                "message": str(e),
                "type": type(e).__name__,
                "timestamp": datetime.now().isoformat()
            }
    
    return wrapper


def format_time_display(time_obj: Optional[time]) -> str:
    """
    Format time object for display.
    
    Args:
        time_obj: Time object to format
        
    Returns:
        str: Formatted time string
    """
    if not time_obj:
        return "TBA"
    
    return time_obj.strftime("%I:%M %p").strip()


def format_days_display(days: str) -> str:
    """
    Format days string for better display.
    
    Args:
        days: Days string like "MWF" or "TTH"
        
    Returns:
        str: Formatted days string
    """
    day_map = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday', 
        'TH': 'Thursday',
        'F': 'Friday',
        'SAT': 'Saturday',
        'SUN': 'Sunday'
    }
    
    if not days:
        return "TBA"
    
    # Handle common patterns
    if days == "MWF":
        return "Monday, Wednesday, Friday"
    elif days == "TTH":
        return "Tuesday, Thursday"
    elif days == "MW":
        return "Monday, Wednesday"
    elif days == "MF":
        return "Monday, Friday"
    else:
        # Expand each day
        result_days = []
        for day in days:
            if day in day_map:
                result_days.append(day_map[day])
        return ", ".join(result_days)


def calculate_schedule_stats(sections: List[Section]) -> Dict[str, Any]:
    """
    Calculate statistics for a schedule.
    
    Args:
        sections: List of sections in the schedule
        
    Returns:
        Dict: Schedule statistics
    """
    if not sections:
        return {
            "total_credits": 0,
            "total_sections": 0,
            "days_per_week": 0,
            "hours_per_week": 0
        }
    
    total_credits = sum(section.credits or 0 for section in sections)
    total_sections = len(sections)
    
    # Calculate days and hours
    all_days = set()
    total_minutes = 0
    
    for section in sections:
        if section.meetings:
            for meeting in section.meetings:
                days = meeting.days
                all_days.update(days)
                
                if meeting.timeslots:
                    for timeslot in meeting.timeslots:
                        start_minutes = (timeslot.start_time.hour * 60) + timeslot.start_time.minute
                        end_minutes = (timeslot.end_time.hour * 60) + timeslot.end_time.minute
                        total_minutes += (end_minutes - start_minutes)
    
    return {
        "total_credits": total_credits,
        "total_sections": total_sections,
        "days_per_week": len(all_days),
        "hours_per_week": round(total_minutes / 60, 1),
        "meeting_days": sorted(list(all_days))
    }


def sanitize_query(query: str) -> str:
    """
    Sanitize search query to prevent injection and improve search quality.
    
    Args:
        query: Raw search query
        
    Returns:
        str: Sanitized query
    """
    if not query:
        return ""
    
    # Remove potentially harmful characters
    dangerous_chars = ["<", ">", "{", "}", "[", "]", "(", ")", ";", "'", "\""]
    
    sanitized = query
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, "")
    
    # Normalize whitespace
    sanitized = " ".join(sanitized.split())
    
    return sanitized.strip()


def validate_season_code(season_code: str) -> bool:
    """
    Validate season code format.
    
    Args:
        season_code: Season code to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not season_code or len(season_code) != 6:
        return False
    
    try:
        year = int(season_code[:4])
        term = int(season_code[4:])
        
        # Basic validation
        return 2000 <= year <= 2100 and 1 <= term <= 3
        
    except ValueError:
        return False


def get_current_season_code() -> str:
    """
    Get the current academic season code.
    
    Returns:
        str: Current season code in YYYYMM format
    """
    now = datetime.now()
    year = now.year
    month = now.month
    
    # Determine academic term
    if month >= 8 and month <= 12:  # Fall semester
        term = "01"
        academic_year = year
    elif month >= 1 and month <= 5:  # Spring semester
        term = "02"
        academic_year = year
    else:  # Summer semester
        term = "03"
        academic_year = year
    
    return f"{academic_year}{term}"


def generate_request_id() -> str:
    """
    Generate a unique request ID for tracking.
    
    Returns:
        str: Unique request ID
    """
    timestamp = int(datetime.now().timestamp())
    random_suffix = str(timestamp)[-6:]
    return f"req_{timestamp}_{random_suffix}"


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            identifier: Unique identifier (IP address, user ID, etc.)
            
        Returns:
            bool: True if request is allowed, False otherwise
        """
        now = datetime.now()
        
        # Clean old requests
        self._cleanup_old_requests(now)
        
        # Check current requests
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Add current request
        self.requests[identifier].append(now)
        
        # Check if over limit
        return len(self.requests[identifier]) <= self.max_requests
    
    def _cleanup_old_requests(self, now: datetime):
        """Remove requests outside the time window."""
        cutoff = now.timestamp() - self.window_seconds
        
        for identifier in list(self.requests.keys()):
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if req_time.timestamp() > cutoff
            ]
            
            # Remove empty entries
            if not self.requests[identifier]:
                del self.requests[identifier]


# Create a default rate limiter instance
default_rate_limiter = RateLimiter(
    max_requests=100,
    window_seconds=3600  # 1 hour
)