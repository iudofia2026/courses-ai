/**
 * CourseDetailPage component - Detailed view for individual courses.
 * Shows comprehensive course information, sections, professor details, and similar courses.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { useCourseDetail, useSchedules } from '../hooks';
import { LoadingStates } from '../components/LoadingStates';
import { CourseCard } from '../components/CourseCard';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const {
    data: courseDetail,
    isLoading,
    error,
  } = useCourseDetail(courseId || '', undefined, true);

  const { selectedCourses, addSelectedCourse, removeSelectedCourse } = useSchedules();

  useEffect(() => {
    if (courseDetail) {
      window.scrollTo(0, 0);
    }
  }, [courseDetail]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCourseSelect = (courseId: string, selected: boolean) => {
    if (selected) {
      addSelectedCourse(courseDetail?.course_with_sections || {});
    } else {
      removeSelectedCourse(courseId);
    }
  };

  const handleSectionSelect = (courseId: string, sectionId: string) => {
    setSelectedSectionId(sectionId === selectedSectionId ? null : sectionId);
  };

  const handleShare = async () => {
    if (courseId) {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        alert('Course link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleBookmark = () => {
    // In a real implementation, this would save to user's bookmarks
    alert('Course bookmarked!');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingStates.CourseDetailSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !courseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'The requested course could not be found.'}
          </p>
          <button onClick={handleBack} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { course_with_sections, section_details, similar_courses } = courseDetail;
  const course = course_with_sections.course;
  const sections = course_with_sections.sections;
  const isSelected = selectedCourses.some(c => c.course_id === courseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Search</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span className="font-semibold text-lg">{course.id}</span>
                    {course.credits && (
                      <span className="flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        {course.credits} credit{course.credits !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBookmark}
                    className="btn-ghost"
                    aria-label="Bookmark course"
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-ghost"
                    aria-label="Share course"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleCourseSelect(course.id, !isSelected)}
                    className={isSelected ? 'btn-secondary' : 'btn-primary'}
                  >
                    {isSelected ? 'Remove from Schedule' : 'Add to Schedule'}
                  </button>
                </div>
              </div>

              {/* Course Description */}
              {course.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{course.description}</p>
                </div>
              )}

              {/* Areas and Skills */}
              {(course.areas?.length || course.skills?.length) && (
                <div className="mb-6">
                  {course.areas && course.areas.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Areas of Study</h3>
                      <div className="flex flex-wrap gap-2">
                        {course.areas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.skills && course.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Gained</h3>
                      <div className="flex flex-wrap gap-2">
                        {course.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Professors */}
              {course.professors && course.professors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.professors.map((professor, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{professor.name}</div>
                          {professor.evaluations?.rating && (
                            <div className="flex items-center text-sm text-gray-600">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {professor.evaluations.rating.toFixed(1)} rating
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {course.requirements && course.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {course.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Sections ({sections.length})
                </h3>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        selectedSectionId === section.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={() => handleSectionSelect(course.id, section.id)}
                              className="flex-shrink-0"
                            >
                              {selectedSectionId === section.id ? (
                                <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded-full hover:border-primary-500" />
                              )}
                            </button>
                            <span className="font-semibold">Section {section.section}</span>
                            <span className="text-sm text-gray-500">CRN: {section.crn}</span>
                            <div className="flex items-center space-x-1 ml-auto">
                              {section.capacity && section.enrolled && (
                                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                              )}
                              {section.capacity && section.enrolled && (
                                <span className={`text-sm font-medium ${
                                  section.enrolled >= section.capacity ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {section.enrolled}/{section.capacity}
                                </span>
                              )}
                              {section.capacity && section.enrolled && section.enrolled >= section.capacity && (
                                <span className="text-sm text-red-600 font-medium">Full</span>
                              )}
                            </div>
                          </div>

                          {/* Meeting Times */}
                          {section.meetings && section.meetings.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {section.meetings.map((meeting, meetingIndex) => (
                                <div key={meetingIndex} className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="h-3 w-3" />
                                    <span>
                                      {meeting.days} {meeting.timeslots && meeting.timeslots.length > 0 &&
                                        `${meeting.timeslots[0].start_time.substring(0, 5)} - ${meeting.timeslots[0].end_time.substring(0, 5)}`
                                      }
                                    </span>
                                  </div>
                                  {meeting.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPinIcon className="h-3 w-3" />
                                      <span>{meeting.location}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Section Professor */}
                          {section.professors && section.professors.length > 0 && (
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Instructor:</span>{' '}
                              {section.professors.map(prof => prof.name).join(', ')}
                            </div>
                          )}

                          {/* Notes */}
                          {section.notes && (
                            <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                              <span className="font-medium">Note:</span> {section.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Similar Courses */}
            {similar_courses && similar_courses.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Courses</h3>
                <div className="space-y-4">
                  {similar_courses.map((similarCourse, index) => (
                    <div key={index} className="border-l-4 border-primary-200 pl-4">
                      <h4 className="font-medium text-gray-900">{similarCourse.title}</h4>
                      <p className="text-sm text-gray-600">{similarCourse.code}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Course Info Card */}
            <div className="card sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Credits</div>
                    <div className="text-sm text-gray-600">{course.credits || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Available Sections</div>
                    <div className="text-sm text-gray-600">{sections.length}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Open Seats</div>
                    <div className="text-sm text-gray-600">
                      {sections.reduce((sum, section) => {
                        if (section.capacity && section.enrolled) {
                          return sum + Math.max(0, section.capacity - section.enrolled);
                        }
                        return sum;
                      }, 0)} total
                    </div>
                  </div>
                </div>

                {course.syllabus_url && (
                  <div className="pt-3 border-t border-gray-200">
                    <a
                      href={course.syllabus_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full"
                    >
                      View Syllabus
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleCourseSelect(course.id, !isSelected)}
                  className={isSelected ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {isSelected ? 'Remove from Schedule' : 'Add to Schedule'}
                </button>
                <button
                  onClick={() => navigate(`/search?q=${encodeURIComponent(course.id)}`)}
                  className="btn-ghost w-full"
                >
                  Search Related Courses
                </button>
                <button
                  onClick={handleShare}
                  className="btn-ghost w-full"
                >
                  Share Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;