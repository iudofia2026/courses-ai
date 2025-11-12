/**
 * Utility functions for formatting and manipulating time-related data.
 * Provides consistent time formatting across the application.
 */

import { Meeting, Timeslot, Section } from '../types';

// Time formatting constants
export const TIME_FORMATS = {
  HOUR_12: '12h',
  HOUR_24: '24h',
  SHORT: 'short',
  COMPACT: 'compact',
} as const;

type TimeFormat = typeof TIME_FORMATS[keyof typeof TIME_FORMATS];

// Day mapping
export const DAY_MAP: Record<string, string> = {
  'M': 'Monday',
  'T': 'Tuesday',
  'W': 'Wednesday',
  'TH': 'Thursday',
  'F': 'Friday',
  'SAT': 'Saturday',
  'SUN': 'Sunday',
};

export const DAY_SHORT_MAP: Record<string, string> = {
  'Monday': 'M',
  'Tuesday': 'T',
  'Wednesday': 'W',
  'Thursday': 'TH',
  'Friday': 'F',
  'Saturday': 'SAT',
  'Sunday': 'SUN',
};

export const DAY_ORDER = ['M', 'T', 'W', 'TH', 'F', 'SAT', 'SUN'];

/**
 * Convert 24-hour time string to 12-hour format
 */
export function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time string based on specified format
 */
export function formatTime(time: string, format: TimeFormat = TIME_FORMATS.HOUR_12): string {
  if (!time) return '';

  switch (format) {
    case TIME_FORMATS.HOUR_12:
      return formatTime12Hour(time);

    case TIME_FORMATS.HOUR_24:
      return time.substring(0, 5); // HH:MM

    case TIME_FORMATS['SHORT']:
      return time.substring(0, 5).replace(/^0/, ''); // Remove leading zero

    case TIME_FORMATS['COMPACT']:
      return time.substring(0, 2) + ':' + time.substring(3, 5);

    default:
      return time;
  }
}

/**
 * Format a time range (e.g., "10:00 AM - 11:15 AM")
 */
export function formatTimeRange(
  startTime: string,
  endTime: string,
  format: TimeFormat = TIME_FORMATS.HOUR_12
): string {
  return `${formatTime(startTime, format)} - ${formatTime(endTime, format)}`;
}

/**
 * Format a timeslot object into a readable string
 */
export function formatTimeslot(timeslot: Timeslot, format: TimeFormat = TIME_FORMATS.HOUR_12): string {
  return formatTimeRange(timeslot.start_time, timeslot.end_time, format);
}

/**
 * Format meeting days and times into a human-readable string
 */
export function formatMeeting(meeting: Meeting, format: TimeFormat = TIME_FORMATS.HOUR_12): string {
  const days = formatDays(meeting.days);
  const timeRange = meeting.timeslots && meeting.timeslots.length > 0
    ? formatTimeslot(meeting.timeslots[0], format)
    : '';

  const location = meeting.location ? ` in ${meeting.location}` : '';

  if (days && timeRange) {
    return `${days} ${timeRange}${location}`;
  } else if (days) {
    return `${days}${location}`;
  } else {
    return timeRange;
  }
}

/**
 * Format course meeting times for display
 */
export function formatCourseMeetings(section: Section, format: TimeFormat = TIME_FORMATS.HOUR_12): string[] {
  if (!section.meetings || section.meetings.length === 0) {
    return ['No meeting times scheduled'];
  }

  return section.meetings.map(meeting => formatMeeting(meeting, format));
}

/**
 * Expand day abbreviations to full names
 */
export function formatDays(days: string): string {
  if (!days) return '';

  const dayMap: Record<string, string> = {
    'M': 'Mon',
    'T': 'Tue',
    'W': 'Wed',
    'TH': 'Thu',
    'F': 'Fri',
    'SAT': 'Sat',
    'SUN': 'Sun',
  };

  const dayList: string[] = [];
  let i = 0;

  while (i < days.length) {
    // Check for two-character day (TH)
    if (i + 1 < days.length && days.substring(i, i + 2) === 'TH') {
      dayList.push(dayMap['TH']);
      i += 2;
    } else {
      dayList.push(dayMap[days[i]] || days[i]);
      i++;
    }
  }

  return dayList.join(', ');
}

/**
 * Calculate duration in minutes between two time strings
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end - start;
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Check if two meetings conflict (same days and overlapping times)
 */
export function doMeetingsConflict(meeting1: Meeting, meeting2: Meeting): boolean {
  if (!meeting1.days || !meeting2.days) return false;

  // Check if they share any days
  const days1 = meeting1.days.split('');
  const days2 = meeting2.days.split('');
  const hasCommonDay = days1.some(day1 =>
    days2.some(day2 => {
      // Handle TH (Thursday) case
      if (day1 === 'T' && day2 === 'H') return false;
      if (day2 === 'T' && day1 === 'H') return false;
      return day1 === day2;
    })
  );

  if (!hasCommonDay) return false;

  // Check time overlap for common days
  if (!meeting1.timeslots || !meeting2.timeslots) return false;

  return meeting1.timeslots.some(timeslot1 =>
    meeting2.timeslots!.some(timeslot2 =>
      doTimeRangesOverlap(
        timeslot1.start_time,
        timeslot1.end_time,
        timeslot2.start_time,
        timeslot2.end_time
      )
    )
  );
}

/**
 * Get a readable description of meeting pattern
 */
export function getMeetingPattern(section: Section): string {
  if (!section.meetings || section.meetings.length === 0) {
    return 'Asynchronous';
  }

  const patterns = section.meetings.map(meeting => {
    const days = formatDays(meeting.days);
    const timeRange = meeting.timeslots && meeting.timeslots.length > 0
      ? formatTimeslot(meeting.timeslots[0], TIME_FORMATS['SHORT'])
      : '';

    return days && timeRange ? `${days} ${timeRange}` : days || timeRange || 'Scheduled';
  });

  return patterns.join('; ');
}

/**
 * Format total weekly hours for a course section
 */
export function formatWeeklyHours(section: Section): string {
  if (!section.meetings || section.meetings.length === 0) {
    return '0 hours/week';
  }

  let totalMinutes = 0;
  section.meetings.forEach(meeting => {
    meeting.timeslots?.forEach(timeslot => {
      totalMinutes += calculateDuration(timeslot.start_time, timeslot.end_time);
    });
  });

  const hours = totalMinutes / 60;
  return `${hours.toFixed(1)} hours/week`;
}

/**
 * Get time block for calendar display
 */
export function getTimeBlock(timeslot: Timeslot): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  duration: number;
} {
  const startTime = timeslot.start_time.split(':');
  const endTime = timeslot.end_time.split(':');

  return {
    startHour: parseInt(startTime[0]),
    startMinute: parseInt(startTime[1]),
    endHour: parseInt(endTime[0]),
    endMinute: parseInt(endTime[1]),
    duration: calculateDuration(timeslot.start_time, timeslot.end_time),
  };
}

/**
 * Check if a time is during early morning hours (before 9 AM)
 */
export function isEarlyMorning(time: string): boolean {
  const minutes = timeToMinutes(time);
  return minutes < 9 * 60; // Before 9:00 AM
}

/**
 * Check if a time is during late evening hours (after 7 PM)
 */
export function isLateEvening(time: string): boolean {
  const minutes = timeToMinutes(time);
  return minutes >= 19 * 60; // After 7:00 PM
}

/**
 * Sort timeslots by start time
 */
export function sortTimeslotsByStartTime(timeslots: Timeslot[]): Timeslot[] {
  return [...timeslots].sort((a, b) =>
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
}

/**
 * Get next available time slot after a given time
 */
export function getNextAvailableTime(startTime: string, gapMinutes: number = 0): string {
  const minutes = timeToMinutes(startTime) + gapMinutes;
  return minutesToTime(minutes);
}