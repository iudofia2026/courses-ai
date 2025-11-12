/**
 * CourseCard component for displaying course information with selection functionality.
 * Shows course details, sections, professor info, and enrollment status.
 */

import React, { useState } from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { CourseWithSections, Section, Meeting } from '../types';
import {
  formatCourseMeetings,
  formatWeeklyHours,
  getEnrollmentStatus,
  isSectionFull,
} from '../utils/scheduleUtils';
import { formatDays } from '../utils/timeFormatting';

interface CourseCardProps {
  courseWithSections: CourseWithSections;
  selected?: boolean;
  onSelect?: (courseId: string, selected: boolean) => void;
  onSectionSelect?: (courseId: string, sectionId: string) => void;
  selectedSectionId?: string;
  showSections?: boolean;
  showEnrollment?: boolean;
  compact?: boolean;
  className?: string;
}

export function CourseCard({
  courseWithSections,
  selected = false,
  onSelect,
  onSectionSelect,
  selectedSectionId,
  showSections = true,
  showEnrollment = true,
  compact = false,
  className = '',
}: CourseCardProps) {
  const { course, sections } = courseWithSections;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!course) {
    return null;
  }

  const handleCourseSelect = () => {
    if (onSelect) {
      onSelect(course.id, !selected);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    if (onSectionSelect) {
      onSectionSelect(course.id, sectionId);
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getAverageProfessorRating = (): number | null => {
    if (!course.professors || course.professors.length === 0) {
      return null;
    }

    const validRatings = course.professors
      .map((prof) => prof.evaluations?.rating)
      .filter((rating): rating is number => rating !== undefined);

    if (validRatings.length === 0) {
      return null;
    }

    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  };

  const getAvailableSections = (): Section[] => {
    return sections.filter(section => !isSectionFull(section));
  };

  const averageRating = getAverageProfessorRating();
  const availableSections = getAvailableSections();

  return (
    <div
      className={`card transition-all duration-200 ${
        selected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      } ${className}`}
    >
      {/* Course header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start space-x-3">
            <button
              onClick={handleCourseSelect}
              className="mt-1 flex-shrink-0"
              aria-label={selected ? 'Deselect course' : 'Select course'}
            >
              {selected ? (
                <CheckCircleIcon className="h-5 w-5 text-primary-600" />
              ) : (
                <div className="h-5 w-5 border-2 border-gray-300 rounded-full hover:border-primary-500" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {course.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">{course.id}</span>
                {course.credits && (
                  <span className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    {course.credits} credit{course.credits !== 1 ? 's' : ''}
                  </span>
                )}
                {averageRating && (
                  <span className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    {averageRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course description */}
      {course.description && !compact && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Areas and skills */}
      {(course.areas?.length || course.skills?.length) && !compact && (
        <div className="mb-3">
          {course.areas && course.areas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {course.areas.slice(0, 3).map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {area}
                </span>
              ))}
              {course.areas.length > 3 && (
                <span className="text-xs text-gray-500">+{course.areas.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Professors */}
      {course.professors && course.professors.length > 0 && !compact && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">Instructors:</p>
          <div className="flex flex-wrap gap-2">
            {course.professors.slice(0, 3).map((professor, index) => (
              <div key={index} className="flex items-center space-x-1">
                <UserGroupIcon className="h-3 w-3 text-gray-400" />
                <span className="text-sm text-gray-700">{professor.name}</span>
                {professor.evaluations?.rating && (
                  <span className="text-xs text-gray-500">({professor.evaluations.rating.toFixed(1)})</span>
                )}
              </div>
            ))}
            {course.professors.length > 3 && (
              <span className="text-xs text-gray-500">+{course.professors.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Meeting information summary */}
      {sections.length > 0 && !compact && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatCourseMeetings(sections[0], 'compact')[0]}</span>
            </div>
            <div className="text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-1 inline" />
              {availableSections.length > 0 ? (
                <span className="text-green-600">
                  {availableSections.length} section{availableSections.length !== 1 ? 's' : ''} available
                </span>
              ) : (
                <span className="text-red-600">No available sections</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      {showSections && sections.length > 0 && (
        <div className={`border-t pt-3 ${compact ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Sections ({sections.length})
            </h4>
            {showEnrollment && (
              <div className="text-xs text-gray-500">
                {availableSections.length} of {sections.length} available
              </div>
            )}
          </div>

          <div className="space-y-2">
            {sections.slice(0, compact ? 2 : sections.length).map((section) => {
              const enrollmentStatus = getEnrollmentStatus(section);
              const isExpanded = expandedSections.has(section.id);
              const isSelected = section.id === selectedSectionId;
              const isFull = isSectionFull(section);

              return (
                <div
                  key={section.id}
                  className={`border rounded-lg p-3 transition-all duration-200 ${
                    isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  } ${isFull ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <button
                          onClick={() => handleSectionSelect(section.id)}
                          className={`flex-shrink-0 ${
                            onSectionSelect ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          aria-label={`Select section ${section.section}`}
                        >
                          {isSelected ? (
                            <CheckCircleIcon className="h-4 w-4 text-primary-600" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-gray-300 rounded-full hover:border-primary-500" />
                          )}
                        </button>
                        <span className="font-medium text-sm">{section.section}</span>
                        <span className="text-xs text-gray-500">CRN: {section.crn}</span>
                        {showEnrollment && (
                          <div className="flex items-center space-x-1 ml-auto">
                            {isFull ? (
                              <XCircleIcon className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserGroupIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-xs ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                              {enrollmentStatus.enrolled}/{enrollmentStatus.total}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meeting times */}
                      {section.meetings && section.meetings.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1">
                          {section.meetings.map((meeting, meetingIndex) => (
                            <div key={meetingIndex} className="flex items-center space-x-2">
                              <span className="font-medium">{formatDays(meeting.days)}</span>
                              {meeting.timeslots && meeting.timeslots.length > 0 && (
                                <span>
                                  {meeting.timeslots[0].start_time.substring(0, 5)} -{' '}
                                  {meeting.timeslots[0].end_time.substring(0, 5)}
                                </span>
                              )}
                              {meeting.location && (
                                <span className="flex items-center">
                                  <MapPinIcon className="h-3 w-3 mr-1" />
                                  {meeting.location}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Professors for this section */}
                      {section.professors && section.professors.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1">
                          {section.professors.map((prof, profIndex) => (
                            <span key={profIndex}>
                              {prof.name}
                              {profIndex < section.professors!.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Weekly hours */}
                      <div className="text-xs text-gray-500">
                        {formatWeeklyHours(section)}
                      </div>
                    </div>

                    {/* Expand/collapse button */}
                    {!compact && (section.notes || section.final_exam) && (
                      <button
                        onClick={() => toggleSectionExpansion(section.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        aria-label="Toggle section details"
                      >
                        <InformationCircleIcon
                          className={`h-4 w-4 transform transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      {section.notes && (
                        <div className="mb-2">
                          <strong>Notes:</strong> {section.notes}
                        </div>
                      )}
                      {section.final_exam && (
                        <div>
                          <strong>Final Exam:</strong> {JSON.stringify(section.final_exam)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!compact && sections.length > 2 && (
            <div className="mt-2 text-center">
              <button
                className="text-sm text-primary-600 hover:text-primary-700"
                onClick={() => {/* Handle show all sections */}}
              >
                Show all {sections.length} sections
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}