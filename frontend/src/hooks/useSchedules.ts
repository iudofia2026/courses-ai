/**
 * useSchedules hook provides schedule generation and management functionality with React Query.
 * Handles schedule creation, validation, comparison, and optimization.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScheduleRequest,
  ScheduleOption,
  GeneratedSchedule,
  ScheduleConstraints,
  SchedulePreferences,
  CourseSelection,
  ScheduleQuality,
  Section,
} from '../types';
import { apiClient } from '../services/api';
import {
  selectBestSection,
  detectScheduleConflicts,
  calculateScheduleQuality,
  validateScheduleOption,
} from '../utils/scheduleUtils';

interface UseSchedulesOptions {
  seasonCode?: string;
  defaultConstraints?: Partial<ScheduleConstraints>;
  defaultPreferences?: Partial<SchedulePreferences>;
  autoSelectSections?: boolean;
  cacheTime?: number;
}

interface UseSchedulesState {
  selectedCourses: CourseSelection[];
  generatedSchedules: ScheduleOption[];
  selectedSchedule: ScheduleOption | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  constraints: ScheduleConstraints;
  preferences: SchedulePreferences;
  scheduleStats: {
    totalGenerated: number;
    averageQuality: number;
    bestQuality: number;
    conflictRate: number;
  } | null;
}

interface UseSchedulesActions {
  selectCourse: (courseId: string, selected: boolean) => void;
  addSelectedCourse: (course: any) => void;
  removeSelectedCourse: (courseId: string) => void;
  clearSelectedCourses: () => void;
  generateSchedules: (options?: Partial<ScheduleRequest>) => Promise<GeneratedSchedule | null>;
  selectSchedule: (schedule: ScheduleOption | null) => void;
  updateConstraints: (constraints: Partial<ScheduleConstraints>) => void;
  updatePreferences: (preferences: Partial<SchedulePreferences>) => void;
  validateSchedule: (schedule: ScheduleOption) => ReturnType<typeof validateScheduleOption>;
  compareSchedules: (schedules: ScheduleOption[]) => any;
  optimizeSchedule: (schedule: ScheduleOption) => Promise<ScheduleOption | null>;
  exportSchedule: (schedule: ScheduleOption, format?: 'json' | 'csv' | 'ical') => void;
  shareSchedule: (schedule: ScheduleOption) => Promise<string | null>;
}

export function useSchedules(options: UseSchedulesOptions = {}): UseSchedulesState & UseSchedulesActions {
  const {
    seasonCode = '',
    defaultConstraints = {},
    defaultPreferences = {},
    autoSelectSections = true,
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const queryClient = useQueryClient();

  // State
  const [selectedCourses, setSelectedCourses] = useState<CourseSelection[]>([]);
  const [generatedSchedules, setGeneratedSchedules] = useState<ScheduleOption[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption | null>(null);
  const [constraints, setConstraints] = useState<ScheduleConstraints>({
    min_credits: 0,
    max_credits: 21,
    max_gap_minutes: 120,
    no_early_morning: false,
    no_late_evening: false,
    preferred_days: [],
    avoid_times: [],
    break_hours: [],
    ...defaultConstraints,
  });
  const [preferences, setPreferences] = useState<SchedulePreferences>({
    workload_weight: 0.3,
    rating_weight: 0.3,
    time_preference_weight: 0.2,
    professor_weight: 0.2,
    preferred_professors: [],
    avoided_professors: [],
    preferred_time_blocks: [],
    avoid_time_blocks: [],
    ...defaultPreferences,
  });

  // Get selected course IDs
  const selectedCourseIds = useMemo(() => {
    return selectedCourses
      .filter(course => course.selected)
      .map(course => course.course_id);
  }, [selectedCourses]);

  // Generate schedules mutation
  const generateSchedulesMutation = useMutation({
    mutationFn: async (request: ScheduleRequest) => {
      return apiClient.generateSchedules(request);
    },
    onSuccess: (data) => {
      setGeneratedSchedules(data.options);

      // Auto-select best schedule if none selected
      if (!selectedSchedule && data.options.length > 0) {
        const bestSchedule = data.options.reduce((best, current) =>
          current.quality_score > best.quality_score ? current : best
        );
        setSelectedSchedule(bestSchedule);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
    },
    onError: (error) => {
      console.error('Failed to generate schedules:', error);
    },
  });

  // Schedule validation mutation
  const validateScheduleMutation = useMutation({
    mutationFn: async (schedule: ScheduleOption) => {
      // In a real implementation, this would call a validation endpoint
      return validateScheduleOption(schedule);
    },
  });

  // Schedule optimization mutation
  const optimizeScheduleMutation = useMutation({
    mutationFn: async (schedule: ScheduleOption) => {
      // In a real implementation, this would call an optimization endpoint
      // For now, just recalculate quality based on current preferences
      const quality = calculateScheduleQuality(schedule.sections, preferences);
      return {
        ...schedule,
        quality_score: quality.overall_score,
      };
    },
    onSuccess: (optimizedSchedule) => {
      // Update the schedule in the generated list
      setGeneratedSchedules(prev =>
        prev.map(schedule =>
          schedule.metadata?.id === optimizedSchedule.metadata?.id
            ? optimizedSchedule
            : schedule
        )
      );
    },
  });

  // Course selection actions
  const selectCourse = useCallback((courseId: string, selected: boolean) => {
    setSelectedCourses(prev =>
      prev.map(course =>
        course.course_id === courseId ? { ...course, selected } : course
      )
    );
  }, []);

  const addSelectedCourse = useCallback((course: any) => {
    setSelectedCourses(prev => {
      const existing = prev.find(c => c.course_id === course.id);
      if (existing) {
        return prev.map(c =>
          c.course_id === course.id ? { ...c, selected: true, course } : c
        );
      }
      return [...prev, {
        course_id: course.id,
        selected: true,
        course,
      }];
    });
  }, []);

  const removeSelectedCourse = useCallback((courseId: string) => {
    setSelectedCourses(prev => prev.filter(c => c.course_id !== courseId));
  }, []);

  const clearSelectedCourses = useCallback(() => {
    setSelectedCourses([]);
    setGeneratedSchedules([]);
    setSelectedSchedule(null);
  }, []);

  // Generate schedules
  const generateSchedules = useCallback(async (
    options: Partial<ScheduleRequest> = {}
  ): Promise<GeneratedSchedule | null> => {
    if (selectedCourseIds.length === 0) {
      throw new Error('No courses selected');
    }

    const request: ScheduleRequest = {
      course_ids: selectedCourseIds,
      season_code: seasonCode,
      constraints,
      preferences,
      max_options: 5,
      include_full_sections: false,
      ...options,
    };

    try {
      const result = await generateSchedulesMutation.mutateAsync(request);
      return result;
    } catch (error) {
      console.error('Failed to generate schedules:', error);
      throw error;
    }
  }, [selectedCourseIds, seasonCode, constraints, preferences, generateSchedulesMutation]);

  // Schedule selection
  const selectSchedule = useCallback((schedule: ScheduleOption | null) => {
    setSelectedSchedule(schedule);
  }, []);

  // Update constraints
  const updateConstraints = useCallback((newConstraints: Partial<ScheduleConstraints>) => {
    setConstraints(prev => ({ ...prev, ...newConstraints }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<SchedulePreferences>) => {
    // Validate weights sum to 1.0
    const updatedPrefs = { ...preferences, ...newPreferences };
    const totalWeight = updatedPrefs.workload_weight + updatedPrefs.rating_weight +
                       updatedPrefs.time_preference_weight + updatedPrefs.professor_weight;

    if (totalWeight !== 1.0 && totalWeight > 0) {
      // Normalize weights
      const factor = 1.0 / totalWeight;
      updatedPrefs.workload_weight *= factor;
      updatedPrefs.rating_weight *= factor;
      updatedPrefs.time_preference_weight *= factor;
      updatedPrefs.professor_weight *= factor;
    }

    setPreferences(updatedPrefs);
  }, [preferences]);

  // Validate schedule
  const validateSchedule = useCallback((schedule: ScheduleOption) => {
    return validateScheduleOption(schedule);
  }, []);

  // Compare schedules
  const compareSchedules = useCallback((schedules: ScheduleOption[]) => {
    if (schedules.length < 2) {
      return null;
    }

    const sortedSchedules = [...schedules].sort((a, b) => b.quality_score - a.quality_score);
    const best = sortedSchedules[0];
    const worst = sortedSchedules[sortedSchedules.length - 1];
    const average = schedules.reduce((sum, s) => sum + s.quality_score, 0) / schedules.length;

    return {
      best,
      worst,
      average,
      comparison: schedules.map(schedule => ({
        schedule,
        quality: calculateScheduleQuality(schedule.sections, preferences),
        conflicts: detectScheduleConflicts(schedule.sections),
        rank: sortedSchedules.indexOf(schedule) + 1,
      })),
    };
  }, [preferences]);

  // Optimize schedule
  const optimizeSchedule = useCallback(async (schedule: ScheduleOption): Promise<ScheduleOption | null> => {
    try {
      const optimized = await optimizeScheduleMutation.mutateAsync(schedule);
      return optimized;
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
      return null;
    }
  }, [optimizeScheduleMutation]);

  // Export schedule
  const exportSchedule = useCallback((schedule: ScheduleOption, format: 'json' | 'csv' | 'ical' = 'json') => {
    const data = {
      schedule,
      constraints,
      preferences,
      generatedAt: new Date().toISOString(),
    };

    switch (format) {
      case 'json':
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;

      case 'csv':
        // CSV export logic
        const csvData = exportToCSV(schedule);
        downloadCSV(csvData, `schedule-${Date.now()}.csv`);
        break;

      case 'ical':
        // iCal export logic
        const icalData = exportToICal(schedule);
        downloadICal(icalData, `schedule-${Date.now()}.ics`);
        break;

      default:
        break;
    }
  }, [constraints, preferences]);

  // Share schedule
  const shareSchedule = useCallback(async (schedule: ScheduleOption): Promise<string | null> => {
    try {
      // In a real implementation, this would create a shareable link
      const shareData = {
        schedule,
        constraints,
        preferences,
        version: '1.0',
      };

      // Simulate API call to create shareable link
      const shareLink = `https://courses-ai.app/shared/${btoa(JSON.stringify(shareData)).slice(0, 20)}`;
      return shareLink;
    } catch (error) {
      console.error('Failed to share schedule:', error);
      return null;
    }
  }, [constraints, preferences]);

  // Calculate schedule statistics
  const scheduleStats = useMemo(() => {
    if (generatedSchedules.length === 0) {
      return null;
    }

    const totalGenerated = generatedSchedules.length;
    const qualityScores = generatedSchedules.map(s => s.quality_score);
    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / totalGenerated;
    const bestQuality = Math.max(...qualityScores);
    const conflictCount = generatedSchedules.filter(s => s.conflicts.length > 0).length;
    const conflictRate = (conflictCount / totalGenerated) * 100;

    return {
      totalGenerated,
      averageQuality,
      bestQuality,
      conflictRate,
    };
  }, [generatedSchedules]);

  // Export helper functions
  const exportToCSV = (schedule: ScheduleOption): string => {
    const headers = ['Course ID', 'Section', 'Days', 'Start Time', 'End Time', 'Location', 'Professor'];
    const rows = schedule.sections.map(section => {
      const meeting = section.meetings?.[0];
      const professor = section.professors?.[0]?.name || '';
      return [
        section.course_id,
        section.section,
        meeting?.days || '',
        meeting?.timeslots?.[0]?.start_time || '',
        meeting?.timeslots?.[0]?.end_time || '',
        meeting?.location || '',
        professor,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const exportToICal = (schedule: ScheduleOption): string => {
    // Basic iCal format
    const events = schedule.sections.map(section => {
      const meeting = section.meetings?.[0];
      if (!meeting || !meeting.timeslots?.[0]) return '';

      const timeslot = meeting.timeslots[0];
      const days = meeting.days;

      // This is a simplified iCal generator
      // A real implementation would need proper date handling and recurrence rules
      return `BEGIN:VEVENT
SUMMARY:${section.course_id} ${section.section}
DTSTART:${timeslot.start_time}
DTEND:${timeslot.end_time}
LOCATION:${meeting.location || ''}
END:VEVENT`;
    }).filter(Boolean);

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Courses AI Schedule//EN
${events.join('\n')}
END:VCALENDAR`;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadICal = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    // State
    selectedCourses,
    generatedSchedules,
    selectedSchedule,
    isLoading: generateSchedulesMutation.isPending,
    isGenerating: generateSchedulesMutation.isPending,
    error: generateSchedulesMutation.error instanceof Error
      ? generateSchedulesMutation.error.message
      : null,
    constraints,
    preferences,
    scheduleStats,

    // Actions
    selectCourse,
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
    generateSchedules,
    selectSchedule,
    updateConstraints,
    updatePreferences,
    validateSchedule,
    compareSchedules,
    optimizeSchedule,
    exportSchedule,
    shareSchedule,
  };
}