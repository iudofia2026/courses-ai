/**
 * ScheduleCalendar component for displaying course schedules in a calendar format.
 * Shows weekly schedule with time blocks, conflicts, and course details.
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ScheduleOption, Section, TimeBlock } from '../types';
import { formatTime, DAY_MAP, DAY_ORDER } from '../utils/timeFormatting';
import { detectScheduleConflicts, createWeeklySchedule } from '../utils/scheduleUtils';

interface ScheduleCalendarProps {
  scheduleOption: ScheduleOption;
  className?: string;
  showConflicts?: boolean;
  interactive?: boolean;
  onSectionClick?: (section: Section) => void;
}

interface CalendarTimeSlot {
  day: string;
  hour: number;
  minutes: number;
  sections: Section[];
  isConflict: boolean;
}

export function ScheduleCalendar({
  scheduleOption,
  className = '',
  showConflicts = true,
  interactive = false,
  onSectionClick,
}: ScheduleCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Generate time grid (8 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots: { hour: number; label: string }[] = [];
    for (let hour = 8; hour <= 22; hour++) {
      slots.push({
        hour,
        label: formatTime(`${hour.toString().padStart(2, '0')}:00:00`, 'short'),
      });
    }
    return slots;
  }, []);

  // Create weekly schedule data
  const weeklySchedule = useMemo(() => {
    return createWeeklySchedule(scheduleOption.sections);
  }, [scheduleOption.sections]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    return detectScheduleConflicts(scheduleOption.sections);
  }, [scheduleOption.sections]);

  // Create calendar grid data
  const calendarGrid = useMemo(() => {
    const grid: CalendarTimeSlot[][] = [];

    // Initialize grid
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      grid[dayIndex] = [];
      for (let hour = 8; hour <= 22; hour++) {
        grid[dayIndex][hour - 8] = {
          day: DAY_ORDER[dayIndex],
          hour,
          minutes: 0,
          sections: [],
          isConflict: false,
        };
      }
    }

    // Fill grid with sections
    scheduleOption.sections.forEach((section) => {
      if (!section.meetings) return;

      section.meetings.forEach((meeting) => {
        if (!meeting.days || !meeting.timeslots) return;

        const days = meeting.days.split('').filter((day, index, self) => {
          // Handle 'TH' (Thursday) special case
          if (day === 'T' && meeting.days.includes('TH')) {
            return meeting.days.indexOf('T') === meeting.days.indexOf('TH');
          }
          return !day || day !== 'H';
        });

        meeting.timeslots.forEach((timeslot) => {
          const startHour = parseInt(timeslot.start_time.split(':')[0]);
          const endHour = parseInt(timeslot.end_time.split(':')[0]);
          const startMinute = parseInt(timeslot.start_time.split(':')[1]);

          days.forEach((day) => {
            const dayIndex = DAY_ORDER.indexOf(day);
            if (dayIndex === -1) return;

            // Fill time slots
            for (let hour = startHour; hour < endHour; hour++) {
              if (hour >= 8 && hour <= 22) {
                const slotIndex = hour - 8;
                if (!grid[dayIndex][slotIndex]) {
                  grid[dayIndex][slotIndex] = {
                    day,
                    hour,
                    minutes: 0,
                    sections: [],
                    isConflict: false,
                  };
                }

                grid[dayIndex][slotIndex].sections.push(section);
              }
            }
          });
        });
      });
    });

    // Mark conflicts
    grid.forEach((dayGrid) => {
      dayGrid.forEach((slot) => {
        slot.isConflict = slot.sections.length > 1;
      });
    });

    return grid;
  }, [scheduleOption.sections]);

  // Handle section click
  const handleSectionClick = (section: Section) => {
    if (interactive && onSectionClick) {
      onSectionClick(section);
    }
  };

  // Get section color based on index
  const getSectionColor = (sectionIndex: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
    ];
    return colors[sectionIndex % colors.length];
  };

  // Render a time slot cell
  const renderTimeSlot = (dayIndex: number, hour: number) => {
    const slot = calendarGrid[dayIndex]?.[hour - 8];
    if (!slot) {
      return <div className="border border-gray-100 p-1 h-12"></div>;
    }

    if (slot.sections.length === 0) {
      return <div className="border border-gray-100 p-1 h-12"></div>;
    }

    // Get the primary section for this slot
    const primarySection = slot.sections[0];
    const sectionIndex = scheduleOption.sections.indexOf(primarySection);
    const colorClass = getSectionColor(sectionIndex);

    return (
      <div
        className={`border p-1 h-12 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
          slot.isConflict
            ? 'border-red-300 bg-red-50'
            : colorClass.split(' ').map(c => `border-${c.split('-')[1]}-300`).join(' ')
        }`}
        onClick={() => handleSectionClick(primarySection)}
      >
        <div className="text-xs font-medium truncate">
          {primarySection.course_id}
        </div>
        <div className="text-xs opacity-75 truncate">
          {primarySection.section}
        </div>
        {slot.isConflict && (
          <div className="flex items-center mt-1">
            <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
            <span className="text-xs text-red-600 ml-1">Conflict</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
            <p className="text-sm text-gray-600">
              {weeklySchedule.total_weekly_hours.toFixed(1)} hours/week • {scheduleOption.total_credits} credits
            </p>
          </div>
          {showConflicts && conflicts.length > 0 && (
            <div className="flex items-center text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div className="text-sm font-medium text-gray-700">Time</div>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
              <div key={day} className="text-sm font-medium text-gray-700 text-center">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-1">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.hour} className="grid grid-cols-6 gap-2">
                {/* Time label */}
                <div className="text-xs text-gray-500 flex items-center">
                  {timeSlot.label}
                </div>

                {/* Day columns */}
                {[0, 1, 2, 3, 4].map((dayIndex) => (
                  <div key={dayIndex}>
                    {renderTimeSlot(dayIndex, timeSlot.hour)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Courses</h4>
        <div className="flex flex-wrap gap-2">
          {scheduleOption.sections.map((section, index) => {
            const colorClass = getSectionColor(index);
            return (
              <div
                key={section.id}
                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${colorClass.split(' ')[0]}`}></div>
                {section.course_id} ({section.section})
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Hours</div>
            <div className="font-medium">{weeklySchedule.total_weekly_hours.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-gray-600">Busiest Day</div>
            <div className="font-medium">
              {weeklySchedule.busiest_day ? DAY_MAP[weeklySchedule.busiest_day] : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Free Days</div>
            <div className="font-medium">
              {weeklySchedule.free_days.length > 0
                ? weeklySchedule.free_days.map(day => DAY_MAP[day]).join(', ')
                : 'None'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Quality Score</div>
            <div className="font-medium">{scheduleOption.quality_score.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Conflicts Section */}
      {showConflicts && conflicts.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-red-50">
          <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Schedule Conflicts
          </h4>
          <ul className="space-y-1 text-sm text-red-700">
            {conflicts.map((conflict, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{conflict.details}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}