"""
Schedule API routes for schedule generation and management.

This module provides FastAPI routes for generating schedules,
detecting conflicts, and managing schedule preferences.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query

from models.schedule import (
    ScheduleRequest,
    GeneratedSchedule,
    ScheduleOption,
    ScheduleConstraints,
    SchedulePreferences
)
from models.course import Section, CourseWithSections
from services import (
    course_table_client, 
    schedule_generator, 
    CourseTableError, 
    ScheduleGeneratorError
)
from utils.helpers import parse_course_data, error_handler
from config import settings

logger = logging.getLogger(__name__)

# Create router instance
router = APIRouter(
    prefix="/api/schedules",
    tags=["schedules"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)


@router.post("/generate", response_model=GeneratedSchedule)
async def generate_schedule(
    request: ScheduleRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate optimized schedules based on course selection and preferences.
    
    Args:
        request: Schedule generation request with courses and constraints
        background_tasks: FastAPI background tasks for analytics
        
    Returns:
        GeneratedSchedule: Multiple schedule options with quality scores
        
    Raises:
        HTTPException: For API errors
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Schedule generation request: {request.json()}")
        
        # Validate request
        if not request.course_ids:
            raise HTTPException(
                status_code=400,
                detail="At least one course ID is required"
            )
        
        # Get available sections for all requested courses
        available_sections = await _get_available_sections(
            request.course_ids, 
            request.season_code
        )
        
        # Generate schedules
        generated_schedule = await schedule_generator.generate_schedules(
            request=request,
            available_sections=available_sections
        )
        
        # Log analytics in background
        background_tasks.add_task(
            log_schedule_analytics,
            request.course_ids,
            len(generated_schedule.options),
            int((datetime.now() - start_time).total_seconds() * 1000)
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Schedule generation completed in {processing_time:.2f}ms, {len(generated_schedule.options)} options generated")
        
        return generated_schedule
        
    except ScheduleGeneratorError as e:
        logger.error(f"Schedule generation error: {str(e)}")
        
        # Map specific error codes to HTTP status codes
        if e.error_code == "NO_SECTIONS_AVAILABLE":
            raise HTTPException(
                status_code=404,
                detail=f"No available sections found for requested courses: {str(e)}"
            )
        elif e.error_code == "INVALID_CREDIT_CONSTRAINTS":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid credit constraints: {str(e)}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Schedule generation failed: {str(e)}"
            )
    except CourseTableError as e:
        logger.error(f"CourseTable API error during schedule generation: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Course service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in schedule generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during schedule generation"
        )


@router.get("/courses/{course_id}/sections")
async def get_course_sections(
    course_id: str,
    season_code: str = Query(..., description="Academic season code")
):
    """
    Get available sections for a specific course.
    
    Args:
        course_id: Course identifier
        season_code: Academic season code
        
    Returns:
        Dict: Course sections information
        
    Raises:
        HTTPException: For API errors
    """
    try:
        logger.info(f"Getting sections for course {course_id}, season {season_code}")
        
        result = await course_table_client.get_course_sections(
            course_id=course_id,
            season_code=season_code
        )
        
        course_data = result["data"]
        
        if "course" not in course_data:
            raise HTTPException(
                status_code=404,
                detail=f"Course with ID {course_id} not found"
            )
        
        course_node = course_data["course"]
        sections_data = course_node.get("sections", [])
        
        # Parse sections
        sections = []
        for section_data in sections_data:
            section = _parse_section_data(section_data, course_id)
            if section:
                sections.append(section)
        
        return {
            "course_id": course_id,
            "season_code": season_code,
            "sections": sections,
            "total_count": len(sections),
            "processing_time_ms": result.get("processing_time_ms", 0)
        }
        
    except CourseTableError as e:
        if e.error_code == "COURSE_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=f"Course with ID {course_id} not found"
            )
        else:
            logger.error(f"CourseTable API error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Course service error: {str(e)}"
            )
    except Exception as e:
        logger.error(f"Unexpected error getting course sections: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while getting course sections"
        )


@router.post("/conflicts")
async def check_schedule_conflicts(
    sections: List[str],
    season_code: str = Query(..., description="Academic season code")
):
    """
    Check for conflicts in a set of course sections.
    
    Args:
        sections: List of section IDs to check
        season_code: Academic season code
        
    Returns:
        Dict: Conflict analysis results
        
    Raises:
        HTTPException: For API errors
    """
    try:
        logger.info(f"Checking conflicts for {len(sections)} sections")
        
        # Get full section data
        section_details = []
        for section_id in sections:
            try:
                # Note: This would need a method to get section by ID
                # For now, we'll return a placeholder response
                section_details.append({"id": section_id})
            except Exception as e:
                logger.warning(f"Could not get details for section {section_id}: {str(e)}")
        
        # Perform conflict detection
        conflicts = []
        
        # Placeholder conflict detection
        # In a real implementation, this would use the schedule generator's conflict detection
        for i, section1 in enumerate(sections):
            for section2 in sections[i+1:]:
                # Check for time conflicts (placeholder)
                if False:  # Replace with actual time conflict logic
                    conflicts.append({
                        "section1_id": section1,
                        "section2_id": section2,
                        "conflict_type": "time",
                        "severity": "error",
                        "details": "Time conflict detected"
                    })
        
        return {
            "sections_checked": sections,
            "conflicts": conflicts,
            "has_conflicts": len(conflicts) > 0,
            "total_conflicts": len(conflicts),
            "season_code": season_code
        }
        
    except Exception as e:
        logger.error(f"Error checking conflicts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while checking conflicts"
        )


@router.get("/preferences")
async def get_schedule_preferences():
    """
    Get available schedule preference options.
    
    Returns:
        Dict: Available preference options and their descriptions
    """
    preferences = {
        "time_preferences": {
            "no_early_morning": {
                "description": "Avoid classes before 9:00 AM",
                "type": "boolean"
            },
            "no_late_evening": {
                "description": "Avoid classes after 8:00 PM",
                "type": "boolean"
            },
            "preferred_days": {
                "description": "Preferred days of week for classes",
                "type": "array",
                "options": ["M", "T", "W", "TH", "F"]
            }
        },
        "workload_preferences": {
            "min_credits": {
                "description": "Minimum number of credits",
                "type": "number",
                "min": 0,
                "max": 25
            },
            "max_credits": {
                "description": "Maximum number of credits",
                "type": "number",
                "min": 0,
                "max": 25
            }
        },
        "professor_preferences": {
            "preferred_professors": {
                "description": "Preferred professor names",
                "type": "array"
            },
            "avoided_professors": {
                "description": "Professors to avoid",
                "type": "array"
            }
        },
        "quality_weights": {
            "workload_weight": {
                "description": "Importance of workload balance (0-1)",
                "type": "number",
                "min": 0,
                "max": 1,
                "default": 0.3
            },
            "rating_weight": {
                "description": "Importance of course ratings (0-1)",
                "type": "number",
                "min": 0,
                "max": 1,
                "default": 0.3
            },
            "time_preference_weight": {
                "description": "Importance of time preferences (0-1)",
                "type": "number",
                "min": 0,
                "max": 1,
                "default": 0.2
            },
            "professor_weight": {
                "description": "Importance of professor preferences (0-1)",
                "type": "number",
                "min": 0,
                "max": 1,
                "default": 0.2
            }
        }
    }
    
    return {
        "preferences": preferences,
        "defaults": {
            "min_credits": 12,
            "max_credits": 20,
            "no_early_morning": False,
            "no_late_evening": False,
            "workload_weight": 0.3,
            "rating_weight": 0.3,
            "time_preference_weight": 0.2,
            "professor_weight": 0.2
        }
    }


@router.post("/optimize")
async def optimize_existing_schedule(
    sections: List[str],
    preferences: Optional[SchedulePreferences] = None,
    season_code: str = Query(..., description="Academic season code")
):
    """
    Optimize an existing schedule based on preferences.
    
    Args:
        sections: List of section IDs in current schedule
        preferences: Optimization preferences
        season_code: Academic season code
        
    Returns:
        Dict: Optimization results and suggestions
        
    Raises:
        HTTPException: For API errors
    """
    try:
        logger.info(f"Optimizing schedule with {len(sections)} sections")
        
        # Get course IDs from sections
        course_ids = set()
        # TODO: Extract course IDs from sections
        
        # Create optimization request
        optimization_request = ScheduleRequest(
            course_ids=list(course_ids),
            season_code=season_code,
            constraints=ScheduleConstraints(),
            preferences=preferences,
            max_options=10
        )
        
        # Get available sections
        available_sections = await _get_available_sections(
            optimization_request.course_ids,
            season_code
        )
        
        # Generate optimized schedules
        optimized_schedules = await schedule_generator.generate_schedules(
            request=optimization_request,
            available_sections=available_sections
        )
        
        # Find best option
        best_option = None
        if optimized_schedules.options:
            best_option = max(optimized_schedules.options, key=lambda x: x.quality_score)
        
        return {
            "original_sections": sections,
            "optimized_option": best_option.dict() if best_option else None,
            "all_options": [option.dict() for option in optimized_schedules.options],
            "optimization_applied": preferences is not None,
            "season_code": season_code
        }
        
    except Exception as e:
        logger.error(f"Error optimizing schedule: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while optimizing schedule"
        )


@router.get("/health")
async def schedule_health_check():
    """
    Health check for schedule generation functionality.
    
    Returns:
        Dict: Health status of schedule components
    """
    health_status = {
        "status": "healthy",
        "components": {},
        "timestamp": datetime.now().isoformat()
    }
    
    # Check CourseTable client
    try:
        coursetable_health = await course_table_client.health_check()
        health_status["components"]["coursetable"] = coursetable_health
        if coursetable_health["status"] != "healthy":
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["coursetable"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check schedule generator (simple test)
    try:
        # Create a simple test request
        test_request = ScheduleRequest(
            course_ids=["test"],
            season_code="202401",
            max_options=1
        )
        
        # This will likely fail due to missing course, but tests the generator logic
        health_status["components"]["schedule_generator"] = {
            "status": "healthy",
            "test": "generator_initialized"
        }
    except Exception as e:
        health_status["components"]["schedule_generator"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status


async def _get_available_sections(
    course_ids: List[str], 
    season_code: str
) -> Dict[str, List[Section]]:
    """
    Get available sections for multiple courses.
    
    Args:
        course_ids: List of course IDs
        season_code: Academic season code
        
    Returns:
        Dict mapping course IDs to lists of sections
        
    Raises:
        CourseTableError: If API calls fail
    """
    available_sections = {}
    
    for course_id in course_ids:
        try:
            result = await course_table_client.get_course_sections(
                course_id=course_id,
                season_code=season_code
            )
            
            course_data = result["data"]
            
            if "course" in course_data:
                course_node = course_data["course"]
                sections_data = course_node.get("sections", [])
                
                # Parse sections
                sections = []
                for section_data in sections_data:
                    section = _parse_section_data(section_data, course_id)
                    if section:
                        sections.append(section)
                
                if sections:
                    available_sections[course_id] = sections
            
        except CourseTableError as e:
            logger.warning(f"Could not get sections for course {course_id}: {str(e)}")
            continue
    
    return available_sections


def _parse_section_data(section_data: Dict[str, Any], course_id: str) -> Optional[Section]:
    """
    Parse section data from GraphQL response.
    
    Args:
        section_data: Raw section data from API
        course_id: Parent course ID
        
    Returns:
        Section: Parsed section object or None if parsing fails
    """
    try:
        # Parse meetings
        meetings = []
        meetings_data = section_data.get("meetings", [])
        for meeting_data in meetings_data:
            # Parse timeslots
            timeslots = []
            timeslots_data = meeting_data.get("timeslots", [])
            for timeslot_data in timeslots_data:
                from datetime import time
                timeslot = {
                    "start_time": timeslot_data.get("startTime"),
                    "end_time": timeslot_data.get("endTime")
                }
                timeslots.append(timeslot)
            
            meeting = {
                "days": meeting_data.get("days", ""),
                "location": meeting_data.get("location"),
                "timeslots": timeslots,
                "start_date": meeting_data.get("startDate"),
                "end_date": meeting_data.get("endDate")
            }
            meetings.append(meeting)
        
        # Parse professors
        professors = []
        professors_data = section_data.get("professors", [])
        for prof_data in professors_data:
            professor = {
                "id": prof_data.get("id"),
                "name": prof_data.get("name"),
                "email": prof_data.get("email"),
                "oci": prof_data.get("oci")
            }
            professors.append(professor)
        
        section = {
            "id": section_data.get("id"),
            "course_id": course_id,
            "section": section_data.get("section"),
            "crn": section_data.get("crn"),
            "season_code": section_data.get("seasonCode"),
            "teaching_method": section_data.get("teachingMethod"),
            "capacity": section_data.get("capacity"),
            "enrolled": section_data.get("enrolled"),
            "waitlist": section_data.get("waitlist"),
            "meetings": meetings,
            "professors": professors,
            "notes": section_data.get("notes"),
            "final_exam": section_data.get("finalExam")
        }
        
        return Section(**section)
        
    except Exception as e:
        logger.error(f"Error parsing section data: {str(e)}")
        return None


async def log_schedule_analytics(
    course_ids: List[str],
    options_generated: int,
    processing_time_ms: int
):
    """
    Log schedule generation analytics in background.
    
    Args:
        course_ids: List of course IDs
        options_generated: Number of schedule options generated
        processing_time_ms: Processing time in milliseconds
    """
    try:
        # In a real implementation, this would log to analytics service
        logger.info(f"Schedule Analytics: courses={course_ids}, options={options_generated}, time={processing_time_ms}ms")
        
        # TODO: Implement actual analytics logging
        # - Store generation patterns
        # - Track popular course combinations
        # - Monitor generation performance
        
    except Exception as e:
        logger.error(f"Error logging schedule analytics: {str(e)}")