/**
 * Utility functions for schedule manipulation, conflict detection, and optimization.
 * Provides helper functions for working with course schedules and selections.
 */

import {
  Section,
  CourseWithSections,
  ScheduleOption,
  ScheduleConflict,
  ScheduleQuality,
  WeeklySchedule,
  TimeBlock,
  CourseSelection,
  Meeting,
} from '../types';
import { doMeetingsConflict, formatTime, timeToMinutes, DAY_ORDER } from './timeFormatting';

// Course selection utilities
export function createCourseSelection(
  course: CourseWithSections,
  selected: boolean = false
): CourseSelection {
  return {
    course_id: course.course.id,
    selected,
    course,
  };
}

export function updateCourseSelection(
  selections: CourseSelection[],
  courseId: string,
  selected: boolean
): CourseSelection[] {
  return selections.map(selection =>
    selection.course_id === courseId ? { ...selection, selected } : selection
  );
}

export function getSelectedCourses(selections: CourseSelection[]): CourseSelection[] {
  return selections.filter(selection => selection.selected);
}

export function getSelectedCourseIds(selections: CourseSelection[]): string[] {
  return selections
    .filter(selection => selection.selected)
    .map(selection => selection.course_id);
}

// Section selection utilities
export function selectBestSection(
  course: CourseWithSections,
  preferences?: {
    preferredProfessors?: string[];
    avoidedProfessors?: string[];
    preferredTimes?: string[];
    avoidEarlyMorning?: boolean;
    avoidLateEvening?: boolean;
  }
): Section | null {
  if (!course.sections || course.sections.length === 0) {
    return null;
  }

  // Filter out full sections
  const availableSections = course.sections.filter(section =>
    !section.capacity || !section.enrolled || section.capacity > section.enrolled
  );

  if (availableSections.length === 0) {
    // If no sections are available, return the first one
    return course.sections[0];
  }

  // Score each section based on preferences
  const scoredSections = availableSections.map(section => {
    let score = 0;

    // Professor preferences
    if (preferences?.preferredProfessors && section.professors) {
      const hasPreferredProfessor = section.professors.some(prof =>
        preferences.preferredProfessors!.includes(prof.name)
      );
      if (hasPreferredProfessor) score += 100;
    }

    if (preferences?.avoidedProfessors && section.professors) {
      const hasAvoidedProfessor = section.professors.some(prof =>
        preferences.avoidedProfessors!.includes(prof.name)
      );
      if (hasAvoidedProfessor) score -= 100;
    }

    // Time preferences
    if (section.meetings) {
      section.meetings.forEach(meeting => {
        meeting.timeslots?.forEach(timeslot => {
          // Avoid early morning
          if (preferences?.avoidEarlyMorning) {
            const minutes = timeToMinutes(timeslot.start_time);
            if (minutes < 9 * 60) score -= 50;
          }

          // Avoid late evening
          if (preferences?.avoidLateEvening) {
            const minutes = timeToMinutes(timeslot.start_time);
            if (minutes >= 19 * 60) score -= 50;
          }
        });
      });
    }

    return { section, score };
  });

  // Sort by score and return the best
  scoredSections.sort((a, b) => b.score - a.score);
  return scoredSections[0].section;
}

// Conflict detection utilities
export function detectScheduleConflicts(sections: Section[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const section1 = sections[i];
      const section2 = sections[j];

      // Check for time conflicts
      if (section1.meetings && section2.meetings) {
        for (const meeting1 of section1.meetings) {
          for (const meeting2 of section2.meetings) {
            if (doMeetingsConflict(meeting1, meeting2)) {
              conflicts.push({
                section1_id: section1.id,
                section2_id: section2.id,
                conflict_type: 'time',
                details: `Time conflict between ${section1.course_id} and ${section2.course_id}`,
                severity: 'error',
              });
            }
          }
        }
      }

      // Check for same course
      if (section1.course_id === section2.course_id) {
        conflicts.push({
          section1_id: section1.id,
          section2_id: section2.id,
          conflict_type: 'duplicate_course',
          details: `Duplicate sections for course ${section1.course_id}`,
          severity: 'error',
        });
      }
    }
  }

  return conflicts;
}

export function hasConflicts(sections: Section[]): boolean {
  return detectScheduleConflicts(sections).length > 0;
}

export function validateScheduleOption(option: ScheduleOption): {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  warnings: string[];
} {
  const conflicts = detectScheduleConflicts(option.sections);
  const warnings: string[] = [];

  // Check credit load
  if (option.total_credits > 21) {
    warnings.push('High credit load (>21 credits)');
  } else if (option.total_credits < 12) {
    warnings.push('Low credit load (<12 credits)');
  }

  // Check quality score
  if (option.quality_score < 50) {
    warnings.push('Low quality schedule');
  }

  // Check for back-to-back classes with long distances (simplified)
  // In a real implementation, you'd need campus location data

  return {
    isValid: conflicts.length === 0,
    conflicts,
    warnings,
  };
}

// Schedule quality calculation
export function calculateScheduleQuality(
  sections: Section[],
  preferences?: {
    workload_weight?: number;
    rating_weight?: number;
    time_preference_weight?: number;
    professor_weight?: number;
  }
): ScheduleQuality {
  const weights = {
    workload: preferences?.workload_weight ?? 0.3,
    rating: preferences?.rating_weight ?? 0.3,
    time_preference: preferences?.time_preference_weight ?? 0.2,
    professor: preferences?.professor_weight ?? 0.2,
  };

  let totalWorkloadScore = 0;
  let totalRatingScore = 0;
  let totalTimeScore = 0;
  let totalProfessorScore = 0;
  let count = 0;

  sections.forEach(section => {
    count++;

    // Workload score (based on professor evaluation)
    if (section.professors) {
      const avgWorkload = section.professors.reduce((sum, prof) =>
        sum + (prof.evaluations?.workload ?? 3), 0) / section.professors.length;
      // Convert 0-5 scale to 0-100 (lower workload is better)
      totalWorkloadScore += (5 - avgWorkload) * 20;
    }

    // Rating score (based on professor evaluation)
    if (section.professors) {
      const avgRating = section.professors.reduce((sum, prof) =>
        sum + (prof.evaluations?.rating ?? 3), 0) / section.professors.length;
      // Convert 0-5 scale to 0-100
      totalRatingScore += avgRating * 20;
    }

    // Time preference score (avoid early morning/late evening)
    let timeScore = 100;
    if (section.meetings) {
      section.meetings.forEach(meeting => {
        meeting.timeslots?.forEach(timeslot => {
          const minutes = timeToMinutes(timeslot.start_time);
          if (minutes < 9 * 60) timeScore -= 30; // Early morning penalty
          if (minutes >= 19 * 60) timeScore -= 30; // Late evening penalty
        });
      });
    }
    totalTimeScore += Math.max(0, timeScore);

    // Professor score (simple placeholder - could be enhanced with more data)
    totalProfessorScore += 75; // Default score
  });

  // Calculate weighted averages
  const avgWorkloadScore = count > 0 ? totalWorkloadScore / count : 50;
  const avgRatingScore = count > 0 ? totalRatingScore / count : 50;
  const avgTimeScore = count > 0 ? totalTimeScore / count : 50;
  const avgProfessorScore = count > 0 ? totalProfessorScore / count : 50;

  const overallScore =
    avgWorkloadScore * weights.workload +
    avgRatingScore * weights.rating +
    avgTimeScore * weights.time_preference +
    avgProfessorScore * weights.professor;

  return {
    workload_score: Math.min(100, Math.max(0, avgWorkloadScore)),
    professor_score: Math.min(100, Math.max(0, avgRatingScore)),
    time_distribution_score: Math.min(100, Math.max(0, avgTimeScore)),
    balance_score: 75, // Placeholder for balance calculation
    overall_score: Math.min(100, Math.max(0, overallScore)),
  };
}

// Schedule display utilities
export function createWeeklySchedule(sections: Section[]): WeeklySchedule {
  const timeBlocks: TimeBlock[] = [];
  const dailyHours: Record<string, number> = {};
  let totalWeeklyHours = 0;

  // Initialize daily hours
  DAY_ORDER.forEach(day => {
    dailyHours[day] = 0;
  });

  // Process each section
  sections.forEach(section => {
    if (!section.meetings) return;

    section.meetings.forEach(meeting => {
      if (!meeting.days || !meeting.timeslots) return;

      const days = meeting.days.split('');
      meeting.timeslots.forEach(timeslot => {
        days.forEach(day => {
          // Handle 'TH' (Thursday) case
          if (day === 'T' && meeting.days.includes('TH')) {
            if (meeting.days.indexOf('T') !== meeting.days.indexOf('TH')) {
              return; // Skip 'T' if it's part of 'TH'
            }
          }

          const startMinutes = timeToMinutes(timeslot.start_time);
          const endMinutes = timeToMinutes(timeslot.end_time);
          const duration = (endMinutes - startMinutes) / 60;

          timeBlocks.push({
            day,
            start_time: timeslot.start_time,
            end_time: timeslot.end_time,
            available: false,
          });

          dailyHours[day] += duration;
          totalWeeklyHours += duration;
        });
      });
    });
  });

  // Find busiest day
  const busiestDay = Object.entries(dailyHours)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  // Find free days
  const freeDays = Object.entries(dailyHours)
    .filter(([, hours]) => hours === 0)
    .map(([day]) => day);

  return {
    time_blocks: timeBlocks,
    total_weekly_hours: totalWeeklyHours,
    daily_hours: dailyHours,
    busiest_day: busiestDay,
    free_days: freeDays,
  };
}

// Schedule comparison utilities
export function compareScheduleOptions(
  option1: ScheduleOption,
  option2: ScheduleOption
): {
  winner: ScheduleOption;
  reason: string;
  comparison: Record<string, any>;
} {
  const comparison: Record<string, any> = {
    quality: {
      option1: option1.quality_score,
      option2: option2.quality_score,
      winner: option1.quality_score > option2.quality_score ? 1 : 2,
    },
    credits: {
      option1: option1.total_credits,
      option2: option2.total_credits,
    },
    conflicts: {
      option1: option1.conflicts.length,
      option2: option2.conflicts.length,
      winner: option1.conflicts.length < option2.conflicts.length ? 1 : 2,
    },
  };

  let winner = option1;
  let reason = 'Higher quality score';

  // Primary comparison: quality score
  if (option1.quality_score !== option2.quality_score) {
    winner = option1.quality_score > option2.quality_score ? option1 : option2;
    reason = winner === option1 ? 'Higher quality score' : 'Fewer conflicts';
  }
  // Secondary comparison: conflicts
  else if (option1.conflicts.length !== option2.conflicts.length) {
    winner = option1.conflicts.length < option2.conflicts.length ? option1 : option2;
    reason = 'Fewer conflicts';
  }
  // Tertiary comparison: credit balance
  else {
    const idealCredits = 15; // Could be configurable
    const diff1 = Math.abs(option1.total_credits - idealCredits);
    const diff2 = Math.abs(option2.total_credits - idealCredits);

    if (diff1 !== diff2) {
      winner = diff1 < diff2 ? option1 : option2;
      reason = 'Better credit balance';
    }
  }

  return {
    winner,
    reason,
    comparison,
  };
}

// Export utility for formatting schedule summaries
export function formatScheduleSummary(option: ScheduleOption): string {
  const conflicts = option.conflicts.length;
  const quality = Math.round(option.quality_score);
  const credits = option.total_credits;

  let summary = `${credits} credits, ${quality}% quality`;

  if (conflicts > 0) {
    summary += `, ${conflicts} conflict${conflicts > 1 ? 's' : ''}`;
  }

  return summary;
}

// Utility to check if section is full
export function isSectionFull(section: Section): boolean {
  return section.capacity !== undefined &&
         section.enrolled !== undefined &&
         section.enrolled >= section.capacity;
}

// Utility to get enrollment status
export function getEnrollmentStatus(section: Section): {
  status: 'open' | 'limited' | 'full';
  available: number;
  total: number;
  percentage: number;
} {
  const enrolled = section.enrolled || 0;
  const capacity = section.capacity || 0;

  if (capacity === 0) {
    return {
      status: 'open',
      available: -1,
      total: 0,
      percentage: 0,
    };
  }

  const available = capacity - enrolled;
  const percentage = (enrolled / capacity) * 100;

  let status: 'open' | 'limited' | 'full' = 'open';
  if (percentage >= 95) {
    status = 'full';
  } else if (percentage >= 80) {
    status = 'limited';
  }

  return {
    status,
    available: Math.max(0, available),
    total: capacity,
    percentage,
  };
}

// Export formatCourseMeetings from timeFormatting for convenience
export { formatCourseMeetings, formatWeeklyHours } from './timeFormatting';