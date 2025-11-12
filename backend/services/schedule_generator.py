"""
Schedule generation service with conflict detection and optimization.

This module provides intelligent schedule generation using course sections,
conflict detection algorithms, and optimization based on user preferences.
"""

import logging
from typing import List, Dict, Optional, Any, Set, Tuple
from datetime import time, datetime, timedelta
import itertools
from collections import defaultdict

from models.schedule import (
    ScheduleOption,
    ScheduleRequest,
    GeneratedSchedule,
    ScheduleConflict,
    ScheduleConstraints,
    SchedulePreferences,
    ScheduleQuality,
    TimeBlock
)
from models.course import Section, Meeting, Timeslot, Professor
from config import settings

logger = logging.getLogger(__name__)


class ScheduleGeneratorError(Exception):
    """Custom exception for schedule generation errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None):
        super().__init__(message)
        self.error_code = error_code


class ScheduleGenerator:
    """
    Advanced schedule generator with conflict detection and optimization.
    
    Provides intelligent schedule generation using various algorithms:
    - Backtracking search for valid combinations
    - Conflict detection for time overlaps and exam conflicts
    - Quality scoring based on user preferences
    - Optimization for workload balance and time distribution
    """
    
    def __init__(self):
        """Initialize the schedule generator."""
        self.day_map = {
            'M': 'Monday',
            'T': 'Tuesday', 
            'W': 'Wednesday',
            'TH': 'Thursday',
            'F': 'Friday',
            'SAT': 'Saturday',
            'SUN': 'Sunday'
        }
        
        # Time preferences for scoring
        self.time_preferences = {
            'early_morning': (time(6, 0), time(8, 59)),    # 6:00-8:59 AM
            'morning': (time(9, 0), time(11, 59)),         # 9:00-11:59 AM
            'midday': (time(12, 0), time(14, 59)),        # 12:00-2:59 PM
            'afternoon': (time(15, 0), time(17, 59)),      # 3:00-5:59 PM
            'evening': (time(18, 0), time(21, 59)),        # 6:00-9:59 PM
            'late_night': (time(22, 0), time(23, 59))      # 10:00-11:59 PM
        }
    
    async def generate_schedules(
        self,
        request: ScheduleRequest,
        available_sections: Dict[str, List[Section]]
    ) -> GeneratedSchedule:
        """
        Generate multiple schedule options based on the request.
        
        Args:
            request: Schedule generation request
            available_sections: Mapping of course IDs to available sections
            
        Returns:
            GeneratedSchedule: Multiple schedule options with metadata
            
        Raises:
            ScheduleGeneratorError: If generation fails
        """
        start_time = datetime.now()
        request_id = f"schedule_{int(start_time.timestamp())}"
        
        try:
            logger.info(f"Generating schedules for {len(request.course_ids)} courses, request_id: {request_id}")
            
            # Validate request and sections
            self._validate_request(request, available_sections)
            
            # Filter sections based on constraints
            filtered_sections = self._filter_sections(
                available_sections, 
                request.constraints, 
                request.include_full_sections
            )
            
            # Generate all possible combinations
            all_combinations = self._generate_section_combinations(filtered_sections)
            
            logger.info(f"Generated {len(all_combinations)} total combinations")
            
            # Detect conflicts and filter valid schedules
            valid_schedules = []
            for combination in all_combinations:
                conflicts = self._detect_conflicts(combination)
                if not conflicts or request.constraints is None:
                    # Only include schedules with conflicts if no strict constraints
                    valid_schedules.append((combination, conflicts))
            
            logger.info(f"Found {len(valid_schedules)} valid schedules")
            
            # Calculate quality scores for valid schedules
            scored_schedules = []
            for sections, conflicts in valid_schedules:
                quality_score = self._calculate_quality_score(
                    sections, 
                    conflicts, 
                    request.preferences
                )
                
                schedule_option = ScheduleOption(
                    sections=sections,
                    total_credits=sum(section.credits or 0 for section in sections),
                    quality_score=quality_score,
                    conflicts=[conf.details for conf in conflicts],
                    metadata={
                        "generation_time": datetime.now().isoformat(),
                        "course_count": len(sections),
                        "has_conflicts": len(conflicts) > 0
                    }
                )
                scored_schedules.append(schedule_option)
            
            # Sort by quality score (descending)
            scored_schedules.sort(key=lambda x: x.quality_score, reverse=True)
            
            # Select top schedules
            selected_schedules = scored_schedules[:request.max_options]
            
            # Apply minimum quality threshold if specified
            if request.constraints and hasattr(request.constraints, 'min_quality_score'):
                min_quality = getattr(request.constraints, 'min_quality_score', 0)
                selected_schedules = [
                    s for s in selected_schedules 
                    if s.quality_score >= min_quality
                ]
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = GeneratedSchedule(
                request_id=request_id,
                season_code=request.season_code,
                options=selected_schedules,
                total_options_generated=len(all_combinations),
                processing_time_ms=int(processing_time),
                metadata={
                    "courses_requested": request.course_ids,
                    "valid_schedules_found": len(valid_schedules),
                    "schedules_with_conflicts": len([s for s in selected_schedules if s.conflicts]),
                    "average_quality": sum(s.quality_score for s in selected_schedules) / len(selected_schedules) if selected_schedules else 0,
                    "constraints_applied": request.constraints is not None,
                    "preferences_applied": request.preferences is not None
                }
            )
            
            logger.info(f"Schedule generation completed in {processing_time:.2f}ms, {len(selected_schedules)} options returned")
            return result
            
        except Exception as e:
            logger.error(f"Schedule generation failed: {str(e)}")
            raise ScheduleGeneratorError(
                f"Schedule generation failed: {str(e)}",
                error_code="GENERATION_FAILED"
            )
    
    def _validate_request(
        self, 
        request: ScheduleRequest, 
        available_sections: Dict[str, List[Section]]
    ):
        """Validate the schedule generation request."""
        # Check if all requested courses have available sections
        missing_courses = [
            course_id for course_id in request.course_ids 
            if course_id not in available_sections or not available_sections[course_id]
        ]
        
        if missing_courses:
            raise ScheduleGeneratorError(
                f"No available sections for courses: {missing_courses}",
                error_code="NO_SECTIONS_AVAILABLE"
            )
        
        # Validate constraints
        if request.constraints:
            if (request.constraints.min_credits and request.constraints.max_credits and 
                request.constraints.min_credits > request.constraints.max_credits):
                raise ScheduleGeneratorError(
                    "Minimum credits cannot be greater than maximum credits",
                    error_code="INVALID_CREDIT_CONSTRAINTS"
                )
    
    def _filter_sections(
        self,
        available_sections: Dict[str, List[Section]],
        constraints: Optional[ScheduleConstraints],
        include_full_sections: bool
    ) -> Dict[str, List[Section]]:
        """Filter sections based on constraints and availability."""
        filtered = {}
        
        for course_id, sections in available_sections.items():
            filtered_sections = []
            
            for section in sections:
                # Check section availability
                if not include_full_sections and section.capacity and section.enrolled:
                    if section.enrolled >= section.capacity:
                        continue
                
                # Apply constraints if provided
                if constraints:
                    if self._violates_constraints(section, constraints):
                        continue
                
                filtered_sections.append(section)
            
            if filtered_sections:
                filtered[course_id] = filtered_sections
        
        return filtered
    
    def _violates_constraints(self, section: Section, constraints: ScheduleConstraints) -> bool:
        """Check if a section violates given constraints."""
        if not section.meetings:
            return False
        
        for meeting in section.meetings:
            for timeslot in meeting.timeslots:
                # Check early morning constraint
                if constraints.no_early_morning:
                    if timeslot.start_time < time(9, 0):
                        return True
                
                # Check late evening constraint
                if constraints.no_late_evening:
                    if timeslot.end_time > time(20, 0):
                        return True
                
                # Check preferred days
                if constraints.preferred_days:
                    meeting_days = set(meeting.days)
                    preferred_days = set(constraints.preferred_days)
                    if not meeting_days.intersection(preferred_days):
                        return True
        
        return False
    
    def _generate_section_combinations(
        self, 
        filtered_sections: Dict[str, List[Section]]
    ) -> List[List[Section]]:
        """Generate all possible combinations of sections."""
        # Get list of section lists for each course
        sections_list = list(filtered_sections.values())
        
        if not sections_list:
            return []
        
        # Generate cartesian product of all section combinations
        combinations = []
        try:
            for combination in itertools.product(*sections_list):
                combinations.append(list(combination))
        except MemoryError:
            logger.warning("Too many combinations, using sampling approach")
            # Fall back to sampling if too many combinations
            combinations = self._sample_combinations(sections_list, max_combinations=1000)
        
        return combinations
    
    def _sample_combinations(
        self, 
        sections_list: List[List[Section]], 
        max_combinations: int = 1000
    ) -> List[List[Section]]:
        """Sample combinations when there are too many possible combinations."""
        import random
        
        combinations = []
        total_possible = 1
        for sections in sections_list:
            total_possible *= len(sections)
        
        # If total combinations is manageable, generate all
        if total_possible <= max_combinations:
            return list(itertools.product(*sections_list))
        
        # Otherwise, sample randomly
        sample_size = min(max_combinations, total_possible // 10)
        
        for _ in range(sample_size):
            combination = []
            for sections in sections_list:
                combination.append(random.choice(sections))
            combinations.append(combination)
        
        return combinations
    
    def _detect_conflicts(self, sections: List[Section]) -> List[ScheduleConflict]:
        """Detect conflicts in a schedule of sections."""
        conflicts = []
        
        # Check time conflicts
        time_conflicts = self._detect_time_conflicts(sections)
        conflicts.extend(time_conflicts)
        
        # Check final exam conflicts
        exam_conflicts = self._detect_exam_conflicts(sections)
        conflicts.extend(exam_conflicts)
        
        # Check same professor conflicts (back-to-back classes)
        professor_conflicts = self._detect_professor_conflicts(sections)
        conflicts.extend(professor_conflicts)
        
        return conflicts
    
    def _detect_time_conflicts(self, sections: List[Section]) -> List[ScheduleConflict]:
        """Detect time conflicts between sections."""
        conflicts = []
        
        for i, section1 in enumerate(sections):
            for section2 in sections[i+1:]:
                if self._sections_have_time_conflict(section1, section2):
                    conflict = ScheduleConflict(
                        section1_id=section1.id,
                        section2_id=section2.id,
                        conflict_type="time",
                        details=f"Time conflict between {section1.course_id} and {section2.course_id}",
                        severity="error"
                    )
                    conflicts.append(conflict)
        
        return conflicts
    
    def _sections_have_time_conflict(self, section1: Section, section2: Section) -> bool:
        """Check if two sections have time conflicts."""
        if not section1.meetings or not section2.meetings:
            return False
        
        for meeting1 in section1.meetings:
            for meeting2 in section2.meetings:
                # Check if meetings are on the same day(s)
                days1 = set(meeting1.days)
                days2 = set(meeting2.days)
                common_days = days1.intersection(days2)
                
                if common_days:
                    # Check time overlap for common days
                    for timeslot1 in meeting1.timeslots:
                        for timeslot2 in meeting2.timeslots:
                            if self._timeslots_overlap(timeslot1, timeslot2):
                                return True
        
        return False
    
    def _timeslots_overlap(self, timeslot1: Timeslot, timeslot2: Timeslot) -> bool:
        """Check if two timeslots overlap."""
        return (timeslot1.start_time < timeslot2.end_time and 
                timeslot2.start_time < timeslot1.end_time)
    
    def _detect_exam_conflicts(self, sections: List[Section]) -> List[ScheduleConflict]:
        """Detect final exam conflicts."""
        conflicts = []
        
        exam_schedules = {}
        for section in sections:
            if section.final_exam and 'date' in section.final_exam:
                exam_date = section.final_exam.get('date')
                if exam_date:
                    if exam_date in exam_schedules:
                        exam_schedules[exam_date].append(section)
                    else:
                        exam_schedules[exam_date] = [section]
        
        # Check for exam conflicts
        for exam_date, exam_sections in exam_schedules.items():
            if len(exam_sections) > 1:
                for i, section1 in enumerate(exam_sections):
                    for section2 in exam_sections[i+1:]:
                        conflict = ScheduleConflict(
                            section1_id=section1.id,
                            section2_id=section2.id,
                            conflict_type="final_exam",
                            details=f"Final exam conflict on {exam_date}",
                            severity="error"
                        )
                        conflicts.append(conflict)
        
        return conflicts
    
    def _detect_professor_conflicts(self, sections: List[Section]) -> List[ScheduleConflict]:
        """Detect potential professor conflicts (back-to-back classes)."""
        conflicts = []
        
        # Group sections by professor
        professor_sections = defaultdict(list)
        for section in sections:
            if section.professors:
                for professor in section.professors:
                    professor_sections[professor.id].append(section)
        
        # Check for back-to-back classes with same professor
        for professor_id, prof_sections in professor_sections.items():
            if len(prof_sections) > 1:
                # This is just a warning, not necessarily a conflict
                section_ids = [s.id for s in prof_sections]
                conflict = ScheduleConflict(
                    section1_id=section_ids[0],
                    section2_id=section_ids[1],
                    conflict_type="same_professor",
                    details=f"Multiple sections with same professor (ID: {professor_id})",
                    severity="warning"
                )
                conflicts.append(conflict)
        
        return conflicts
    
    def _calculate_quality_score(
        self,
        sections: List[Section],
        conflicts: List[ScheduleConflict],
        preferences: Optional[SchedulePreferences]
    ) -> float:
        """Calculate quality score for a schedule."""
        base_score = 100.0
        
        # Deduct points for conflicts
        conflict_penalty = 0
        for conflict in conflicts:
            if conflict.severity == "error":
                conflict_penalty += 25
            elif conflict.severity == "warning":
                conflict_penalty += 10
        
        base_score -= conflict_penalty
        
        # Apply preferences if provided
        if preferences:
            preference_score = self._calculate_preference_score(sections, preferences)
            # Weight the preference score
            final_score = (base_score * 0.7) + (preference_score * 0.3)
        else:
            final_score = base_score
        
        # Add workload balance bonus
        balance_bonus = self._calculate_workload_balance(sections)
        final_score += balance_bonus
        
        # Add time distribution bonus
        time_bonus = self._calculate_time_distribution_score(sections)
        final_score += time_bonus
        
        # Ensure score is within bounds
        return max(0.0, min(100.0, final_score))
    
    def _calculate_preference_score(
        self, 
        sections: List[Section], 
        preferences: SchedulePreferences
    ) -> float:
        """Calculate score based on user preferences."""
        if not preferences.validate_weights():
            logger.warning("Preference weights don't sum to 1.0, using defaults")
            return 50.0
        
        scores = {}
        
        # Professor preference score
        professor_score = self._calculate_professor_preference_score(sections, preferences)
        scores["professor"] = professor_score * preferences.professor_weight
        
        # Time preference score
        time_score = self._calculate_time_preference_score(sections, preferences)
        scores["time"] = time_score * preferences.time_preference_weight
        
        # Workload score
        workload_score = self._calculate_workload_score(sections, preferences)
        scores["workload"] = workload_score * preferences.workload_weight
        
        # Overall rating score
        rating_score = self._calculate_rating_score(sections, preferences)
        scores["rating"] = rating_score * preferences.rating_weight
        
        return sum(scores.values())
    
    def _calculate_professor_preference_score(
        self, 
        sections: List[Section], 
        preferences: SchedulePreferences
    ) -> float:
        """Calculate score based on professor preferences."""
        if not sections:
            return 50.0
        
        total_score = 0
        section_count = 0
        
        for section in sections:
            if not section.professors:
                continue
            
            section_score = 50.0  # Neutral score
            
            for professor in section.professors:
                # Check for preferred professors
                if preferences.preferred_professors and professor.name in preferences.preferred_professors:
                    section_score = 100.0
                    break
                
                # Check for avoided professors
                if preferences.avoided_professors and professor.name in preferences.avoided_professors:
                    section_score = 0.0
                    break
                
                # Use professor rating if available
                if professor.rating:
                    section_score = (professor.rating / 5.0) * 100.0
            
            total_score += section_score
            section_count += 1
        
        return total_score / section_count if section_count > 0 else 50.0
    
    def _calculate_time_preference_score(
        self, 
        sections: List[Section], 
        preferences: SchedulePreferences
    ) -> float:
        """Calculate score based on time preferences."""
        if not sections:
            return 50.0
        
        # This is a simplified implementation
        # In a real system, you'd analyze the actual meeting times
        score = 75.0  # Default good score
        
        # Penalize very early or very late classes
        for section in sections:
            if section.meetings:
                for meeting in section.meetings:
                    for timeslot in meeting.timeslots:
                        # Early morning penalty
                        if timeslot.start_time < time(8, 0):
                            score -= 10
                        # Late evening penalty
                        elif timeslot.end_time > time(21, 0):
                            score -= 10
        
        return max(0.0, score)
    
    def _calculate_workload_score(
        self, 
        sections: List[Section], 
        preferences: SchedulePreferences
    ) -> float:
        """Calculate score based on workload preferences."""
        total_credits = sum(section.credits or 0 for section in sections)
        
        # Ideal workload is around 15-18 credits
        ideal_min, ideal_max = 12, 18
        
        if ideal_min <= total_credits <= ideal_max:
            return 100.0
        elif total_credits < ideal_min:
            return 50.0  # Lighter workload
        else:
            # Heavy workload penalty
            penalty = (total_credits - ideal_max) * 5
            return max(0.0, 100.0 - penalty)
    
    def _calculate_rating_score(
        self, 
        sections: List[Section], 
        preferences: SchedulePreferences
    ) -> float:
        """Calculate score based on course/professor ratings."""
        total_score = 0
        rating_count = 0
        
        for section in sections:
            # Professor ratings
            if section.professors:
                for professor in section.professors:
                    if professor.rating:
                        total_score += (professor.rating / 5.0) * 100.0
                        rating_count += 1
        
        return total_score / rating_count if rating_count > 0 else 50.0
    
    def _calculate_workload_balance(self, sections: List[Section]) -> float:
        """Calculate bonus for balanced workload across days."""
        if not sections:
            return 0.0
        
        # Count credits by day
        daily_credits = defaultdict(float)
        
        for section in sections:
            if section.meetings and section.credits:
                for meeting in section.meetings:
                    days_credit = section.credits / len(meeting.days)
                    for day in meeting.days:
                        daily_credits[day] += days_credit
        
        if not daily_credits:
            return 0.0
        
        # Calculate standard deviation (lower is better)
        credits_list = list(daily_credits.values())
        avg_credits = sum(credits_list) / len(credits_list)
        variance = sum((x - avg_credits) ** 2 for x in credits_list) / len(credits_list)
        std_dev = variance ** 0.5
        
        # Bonus for balanced schedule (lower std deviation = higher bonus)
        balance_bonus = max(0, 10 - std_dev)
        
        return balance_bonus
    
    def _calculate_time_distribution_score(self, sections: List[Section]) -> float:
        """Calculate bonus for good time distribution."""
        if not sections:
            return 0.0
        
        # Count classes by time blocks
        time_block_counts = defaultdict(int)
        
        for section in sections:
            if section.meetings:
                for meeting in section.meetings:
                    for timeslot in meeting.timeslots:
                        time_block = self._get_time_block(timeslot.start_time)
                        time_block_counts[time_block] += 1
        
        # Bonus for having classes distributed across time blocks
        distribution_bonus = min(len(time_block_counts) * 2, 10)
        
        return distribution_bonus
    
    def _get_time_block(self, time_obj: time) -> str:
        """Get time block category for a given time."""
        for block_name, (start_time, end_time) in self.time_preferences.items():
            if start_time <= time_obj <= end_time:
                return block_name
        return "other"


# Create a singleton instance
schedule_generator = ScheduleGenerator()