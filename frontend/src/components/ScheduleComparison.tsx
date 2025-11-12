/**
 * ScheduleComparison component for comparing multiple schedule options side by side.
 * Allows users to select the best schedule based on quality, conflicts, and preferences.
 */

import React, { useState } from 'react';
import {
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { ScheduleOption, Section } from '../types';
import { formatCourseMeetings, detectScheduleConflicts, formatScheduleSummary } from '../utils/scheduleUtils';
import { ScheduleCalendar } from './ScheduleCalendar';

interface ScheduleComparisonProps {
  schedules: ScheduleOption[];
  onSelectSchedule?: (schedule: ScheduleOption) => void;
  selectedScheduleId?: string;
  className?: string;
}

interface ScheduleMetrics {
  qualityScore: number;
  totalCredits: number;
  conflictCount: number;
  totalHours: number;
  averageRating: number;
  workloadBalance: number;
  timeDistribution: number;
  earliestClass: string;
  latestClass: string;
}

export function ScheduleComparison({
  schedules,
  onSelectSchedule,
  selectedScheduleId,
  className = '',
}: ScheduleComparisonProps) {
  const [expandedView, setExpandedView] = useState<number | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'overview' | 'detailed'>('overview');

  // Calculate metrics for each schedule
  const scheduleMetrics = schedules.map(schedule => {
    const conflicts = detectScheduleConflicts(schedule.sections);
    let totalMinutes = 0;
    let earliestTime = '23:59';
    let latestTime = '00:00';
    let totalRating = 0;
    let ratingCount = 0;

    schedule.sections.forEach(section => {
      // Calculate total hours
      if (section.meetings) {
        section.meetings.forEach(meeting => {
          meeting.timeslots?.forEach(timeslot => {
            const startMinutes = parseInt(timeslot.start_time.split(':')[0]) * 60 +
                                parseInt(timeslot.start_time.split(':')[1]);
            const endMinutes = parseInt(timeslot.end_time.split(':')[0]) * 60 +
                              parseInt(timeslot.end_time.split(':')[1]);
            totalMinutes += (endMinutes - startMinutes);

            // Track earliest and latest times
            if (timeslot.start_time < earliestTime) {
              earliestTime = timeslot.start_time;
            }
            if (timeslot.end_time > latestTime) {
              latestTime = timeslot.end_time;
            }
          });
        });
      }

      // Calculate average professor rating
      if (section.professors) {
        section.professors.forEach(prof => {
          if (prof.evaluations?.rating) {
            totalRating += prof.evaluations.rating;
            ratingCount++;
          }
        });
      }
    });

    return {
      qualityScore: schedule.quality_score,
      totalCredits: schedule.total_credits,
      conflictCount: conflicts.length,
      totalHours: totalMinutes / 60,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      workloadBalance: 75, // Placeholder - could be calculated based on credit distribution
      timeDistribution: 80, // Placeholder - could be calculated based on time spread
      earliestClass: earliestTime,
      latestClass: latestTime,
    };
  });

  // Get best schedule for each metric
  const getBestScheduleIndex = (metric: keyof ScheduleMetrics) => {
    const bestValue = metric === 'conflictCount'
      ? Math.min(...scheduleMetrics.map(m => m[metric]))
      : Math.max(...scheduleMetrics.map(m => m[metric]));

    return scheduleMetrics.findIndex(m => m[metric] === bestValue);
  };

  // Handle schedule selection
  const handleSelectSchedule = (schedule: ScheduleOption) => {
    if (onSelectSchedule) {
      onSelectSchedule(schedule);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Get quality grade
  const getQualityGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600 bg-green-100' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600 bg-blue-100' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600 bg-yellow-100' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600 bg-orange-100' };
    return { grade: 'F', color: 'text-red-600 bg-red-100' };
  };

  // Render overview comparison
  const renderOverviewComparison = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule, index) => {
        const metrics = scheduleMetrics[index];
        const isSelected = selectedScheduleId === schedule.metadata?.id || selectedScheduleId === index.toString();
        const qualityGrade = getQualityGrade(metrics.qualityScore);
        const isBestQuality = getBestScheduleIndex('qualityScore') === index;
        const isFewestConflicts = getBestScheduleIndex('conflictCount') === index;

        return (
          <div
            key={index}
            className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
            }`}
            onClick={() => handleSelectSchedule(schedule)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Option {index + 1}</h3>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${qualityGrade.color}`}>
                  Grade {qualityGrade.grade}
                </div>
              </div>
              {isSelected && (
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              {/* Quality Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Quality</span>
                  {isBestQuality && (
                    <span className="text-xs text-green-600 font-medium">Best</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${metrics.qualityScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(metrics.qualityScore)}%</span>
                </div>
              </div>

              {/* Credits */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Credits</span>
                </div>
                <span className="text-sm font-medium">{metrics.totalCredits}</span>
              </div>

              {/* Conflicts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <ExclamationTriangleIcon className={`h-4 w-4 ${metrics.conflictCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-sm text-gray-600">Conflicts</span>
                  {isFewestConflicts && metrics.conflictCount === 0 && (
                    <span className="text-xs text-green-600 font-medium">None</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${metrics.conflictCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.conflictCount}
                </span>
              </div>

              {/* Hours per week */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Hours/week</span>
                </div>
                <span className="text-sm font-medium">{metrics.totalHours.toFixed(1)}</span>
              </div>
            </div>

            {/* Course List */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Courses ({schedule.sections.length})</h4>
              <div className="space-y-1">
                {schedule.sections.slice(0, 3).map((section, sectionIndex) => (
                  <div key={sectionIndex} className="text-xs text-gray-600 flex items-center justify-between">
                    <span className="font-medium">{section.course_id}</span>
                    <span>{section.section}</span>
                  </div>
                ))}
                {schedule.sections.length > 3 && (
                  <div className="text-xs text-gray-500">+{schedule.sections.length - 3} more</div>
                )}
              </div>
            </div>

            {/* View Details Button */}
            <button
              className="w-full mt-4 btn-ghost text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedView(expandedView === index ? null : index);
              }}
            >
              {expandedView === index ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        );
      })}
    </div>
  );

  // Render detailed comparison table
  const renderDetailedComparison = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Metric
            </th>
            {schedules.map((_, index) => (
              <th key={index} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Option {index + 1}
                {getBestScheduleIndex('qualityScore') === index && (
                  <span className="ml-2 text-green-600">⭐</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Quality Score */}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Quality Score
            </td>
            {scheduleMetrics.map((metrics, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className="flex flex-col items-center">
                  <span className="font-medium">{Math.round(metrics.qualityScore)}%</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${metrics.qualityScore}%` }}
                    ></div>
                  </div>
                </div>
              </td>
            ))}
          </tr>

          {/* Credits */}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Total Credits
            </td>
            {scheduleMetrics.map((metrics, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className="flex items-center justify-center">
                  <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{metrics.totalCredits}</span>
                </div>
              </td>
            ))}
          </tr>

          {/* Conflicts */}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Conflicts
            </td>
            {scheduleMetrics.map((metrics, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className={`flex items-center justify-center ${metrics.conflictCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">{metrics.conflictCount}</span>
                </div>
              </td>
            ))}
          </tr>

          {/* Weekly Hours */}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Weekly Hours
            </td>
            {scheduleMetrics.map((metrics, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className="flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{metrics.totalHours.toFixed(1)}</span>
                </div>
              </td>
            ))}
          </tr>

          {/* Time Range */}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Daily Schedule
            </td>
            {scheduleMetrics.map((metrics, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <div className="text-xs text-gray-600">
                  <div>{formatTime(metrics.earliestClass)} - {formatTime(metrics.latestClass)}</div>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compare Schedules</h2>
            <p className="text-sm text-gray-600">
              {schedules.length} schedule{scheduleMetrics.length !== 1 ? 's' : ''} to compare
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setComparisonMode('overview')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                comparisonMode === 'overview'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setComparisonMode('detailed')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                comparisonMode === 'detailed'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {comparisonMode === 'overview' ? renderOverviewComparison() : renderDetailedComparison()}
      </div>

      {/* Expanded Schedule Views */}
      {expandedView !== null && comparisonMode === 'overview' && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Option {expandedView + 1} - Detailed View
            </h3>
            <button
              onClick={() => setExpandedView(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              × Close
            </button>
          </div>
          <ScheduleCalendar
            scheduleOption={schedules[expandedView]}
            interactive={false}
          />
        </div>
      )}

      {/* Recommendation */}
      {schedules.length > 1 && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="flex items-start space-x-3">
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Recommendation</h4>
              <p className="text-sm text-blue-700 mt-1">
                Based on quality score and conflict analysis, Option {getBestScheduleIndex('qualityScore') + 1}
                appears to be the best choice with {Math.round(scheduleMetrics[getBestScheduleIndex('qualityScore')].qualityScore)}% quality score.
              </p>
              <button
                className="mt-2 btn-primary text-sm"
                onClick={() => handleSelectSchedule(schedules[getBestScheduleIndex('qualityScore')])}
              >
                Select Option {getBestScheduleIndex('qualityScore') + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}