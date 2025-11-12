/**
 * SchedulesPage component - Main schedule management interface.
 * Shows generated schedules, allows comparison, and provides schedule optimization.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  PlusIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowDownIcon,
  ShareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { ScheduleCalendar } from '../components/ScheduleCalendar';
import { ScheduleComparison } from '../components/ScheduleComparison';
import { LoadingStates, LoadingButton } from '../components/LoadingStates';
import { useSchedules } from '../hooks';
import { ScheduleOption } from '../types';

export function SchedulesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'comparison'>('calendar');

  const {
    selectedCourses,
    generatedSchedules,
    selectedSchedule,
    isGenerating,
    error,
    constraints,
    preferences,
    updateConstraints,
    updatePreferences,
    generateSchedules,
    selectSchedule,
    exportSchedule,
    shareSchedule,
  } = useSchedules();

  const handleGenerateSchedules = async () => {
    try {
      await generateSchedules();
      setViewMode('comparison');
    } catch (error) {
      console.error('Failed to generate schedules:', error);
    }
  };

  const handleBackToSearch = () => {
    navigate('/search');
  };

  const handleExportSchedule = (format: 'json' | 'csv' | 'ical' = 'json') => {
    if (selectedSchedule) {
      exportSchedule(selectedSchedule, format);
    }
  };

  const handleShareSchedule = async () => {
    if (selectedSchedule) {
      try {
        const shareLink = await shareSchedule(selectedSchedule);
        if (shareLink) {
          // Copy to clipboard
          await navigator.clipboard.writeText(shareLink);
          alert('Schedule link copied to clipboard!');
        }
      } catch (error) {
        console.error('Failed to share schedule:', error);
      }
    }
  };

  // Loading state for schedule generation
  if (isGenerating && generatedSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Schedules</h2>
          <p className="text-gray-600">
            AI is analyzing your course selections and creating optimal schedules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToSearch}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Search</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
              <p className="text-gray-600">
                {selectedCourses.length > 0
                  ? `${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''} selected`
                  : 'Select courses to generate schedules'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {generatedSchedules.length > 0 && (
                <>
                  <div className="flex items-center bg-white rounded-lg border border-gray-300">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-4 py-2 rounded-l-lg text-sm font-medium ${
                        viewMode === 'calendar'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Calendar
                    </button>
                    <button
                      onClick={() => setViewMode('comparison')}
                      className={`px-4 py-2 rounded-r-lg text-sm font-medium ${
                        viewMode === 'comparison'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChartBarIcon className="h-4 w-4 inline mr-2" />
                      Compare
                    </button>
                  </div>

                  {selectedSchedule && (
                    <>
                      <div className="relative">
                        <button className="btn-secondary">
                          <ShareIcon className="h-4 w-4 mr-2" />
                          Share
                        </button>
                      </div>

                      <div className="relative group">
                        <button className="btn-secondary">
                          <ArrowDownIcon className="h-4 w-4 mr-2" />
                          Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <button
                            onClick={() => handleExportSchedule('json')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export as JSON
                          </button>
                          <button
                            onClick={() => handleExportSchedule('csv')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export as CSV
                          </button>
                          <button
                            onClick={() => handleExportSchedule('ical')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export to Calendar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600">
                <PlusIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No courses selected */}
        {selectedCourses.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Selected</h2>
            <p className="text-gray-600 mb-6">
              Start by searching for and selecting courses to build your schedule.
            </p>
            <button onClick={handleBackToSearch} className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Selected Courses Sidebar */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Selected Courses</h3>
                <div className="space-y-3">
                  {selectedCourses.filter(c => c.selected).map((course) => (
                    <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{course.course?.title}</div>
                        <div className="text-xs text-gray-600">{course.course_id}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {course.course?.credits} cr
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Total Credits:</span>
                    <span className="text-sm font-semibold">
                      {selectedCourses.reduce((sum, course) =>
                        sum + (course.course?.credits || 0), 0
                      ).toFixed(1)}
                    </span>
                  </div>

                  <LoadingButton
                    onClick={handleGenerateSchedules}
                    loading={isGenerating}
                    disabled={selectedCourses.filter(c => c.selected).length === 0}
                    className="w-full"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    {generatedSchedules.length > 0 ? 'Regenerate' : 'Generate'} Schedules
                  </LoadingButton>
                </div>
              </div>

              {/* Quick Settings */}
              {generatedSchedules.length > 0 && (
                <div className="card mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Schedule Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="21"
                        value={constraints.max_credits}
                        onChange={(e) => updateConstraints({ max_credits: parseInt(e.target.value) })}
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferences
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={constraints.no_early_morning}
                            onChange={(e) => updateConstraints({ no_early_morning: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">No early morning classes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={constraints.no_late_evening}
                            onChange={(e) => updateConstraints({ no_late_evening: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">No late evening classes</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {generatedSchedules.length === 0 ? (
                <div className="text-center py-16">
                  <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Generate Schedules</h2>
                  <p className="text-gray-600 mb-6">
                    Click "Generate Schedules" to create optimized schedule options based on your selected courses and preferences.
                  </p>
                  <LoadingButton
                    onClick={handleGenerateSchedules}
                    loading={isGenerating}
                    className="btn-primary"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate Schedules
                  </LoadingButton>
                </div>
              ) : (
                <>
                  {viewMode === 'calendar' && selectedSchedule ? (
                    <ScheduleCalendar
                      scheduleOption={selectedSchedule}
                      showConflicts={true}
                      interactive={true}
                    />
                  ) : viewMode === 'comparison' ? (
                    <ScheduleComparison
                      schedules={generatedSchedules}
                      onSelectSchedule={selectSchedule}
                      selectedScheduleId={selectedSchedule?.metadata?.id}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Schedule</h2>
                      <p className="text-gray-600 mb-6">
                        Switch to comparison view to see all generated schedules and select the best one for you.
                      </p>
                      <button
                        onClick={() => setViewMode('comparison')}
                        className="btn-primary"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-2" />
                        Compare Schedules
                      </button>
                    </div>
                  )}

                  {/* Schedule Options */}
                  {generatedSchedules.length > 1 && selectedSchedule && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Schedule Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedSchedules.filter(s => s.metadata?.id !== selectedSchedule?.metadata?.id).map((schedule) => (
                          <div
                            key={schedule.metadata?.id}
                            className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedSchedule?.metadata?.id === schedule.metadata?.id
                                ? 'ring-2 ring-primary-500 bg-primary-50'
                                : ''
                            }`}
                            onClick={() => selectSchedule(schedule)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">Option {generatedSchedules.indexOf(schedule) + 1}</h4>
                              <div className="text-sm font-medium text-primary-600">
                                {Math.round(schedule.quality_score)}%
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {schedule.total_credits} credits
                              {schedule.conflicts.length > 0 && (
                                <span className="text-red-600 ml-2">
                                  {schedule.conflicts.length} conflict{schedule.conflicts.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchedulesPage;