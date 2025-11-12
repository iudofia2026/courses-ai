/**
 * SearchPage component - Main course search interface with filters and results.
 * Integrates search functionality with course cards and selection capabilities.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from '../components/SearchBar';
import { CourseCard } from '../components/CourseCard';
import { FilterPanel } from '../components/FilterPanel';
import { LoadingStates, CourseCardSkeleton } from '../components/LoadingStates';
import { useSearch, useSchedules } from '../hooks';
import { SearchFilter, SearchResult } from '../types';
import { useNavigate } from 'react-router-dom';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  const {
    query,
    filters,
    isLoading,
    error,
    results,
    totalCount,
    hasMore,
    isFetching,
    setQuery,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    loadMore,
  } = useSearch({
    enableAutoSearch: true,
    debounceMs: 500,
  });

  const { selectedCourses, addSelectedCourse, removeSelectedCourse, clearSelectedCourses } = useSchedules();

  // Initialize with URL parameters
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery, setQuery]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (filters.length > 0) {
      params.set('filters', JSON.stringify(filters));
    }
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // Handle course selection
  const handleCourseSelect = (courseId: string, selected: boolean) => {
    if (selected) {
      const course = results.find(r => r.course.id === courseId);
      if (course) {
        addSelectedCourse(course.course_with_sections);
        setSelectedCourseIds(prev => new Set(prev).add(courseId));
      }
    } else {
      removeSelectedCourse(courseId);
      setSelectedCourseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  // Handle section selection
  const handleSectionSelect = (courseId: string, sectionId: string) => {
    // In a real implementation, this would handle specific section selection
    console.log(`Selected section ${sectionId} for course ${courseId}`);
  };

  // Generate schedules from selected courses
  const handleGenerateSchedules = () => {
    if (selectedCourseIds.size > 0) {
      navigate('/schedules');
    }
  };

  // Clear all selections
  const handleClearSelections = () => {
    clearSelectedCourses();
    setSelectedCourseIds(new Set());
  };

  // Loading state
  if (isLoading && results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search for courses, professors, or topics..."
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            </div>
            <div>
              <LoadingStates.FilterPanelSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XMarkIcon className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Search</h1>
              {query && (
                <p className="text-gray-600">
                  Showing results for "{query}"
                  {totalCount > 0 && ` (${totalCount} found)`}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 btn-secondary"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
              {filters.length > 0 && (
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                  {filters.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for courses, professors, or topics..."
            defaultValue={query}
          />

          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="flex items-center space-x-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => removeFilter(filter.field, filter.value)}
                  className="inline-flex items-center space-x-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200"
                >
                  <span>{filter.field}: {String(filter.value)}</span>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              className="sticky top-4"
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Selected Courses Summary */}
            {selectedCourseIds.size > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary-900">
                      {selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''} selected
                    </h3>
                    <p className="text-sm text-primary-700">
                      Total credits: {selectedCourses.reduce((sum, course) =>
                        sum + (course.course?.credits || 0), 0
                      ).toFixed(1)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleClearSelections}
                      className="btn-ghost text-sm"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleGenerateSchedules}
                      className="btn-primary"
                    >
                      Generate Schedule
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Header */}
            {results.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Showing {results.length} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <select className="input-field text-sm py-1">
                    <option>Sort by Relevance</option>
                    <option>Sort by Rating</option>
                    <option>Sort by Credits</option>
                    <option>Sort by Department</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-4">
              {results.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">
                    {query
                      ? `No courses match "${query}". Try adjusting your search terms or filters.`
                      : 'Start by searching for courses, professors, or topics.'}
                  </p>
                  {filters.length > 0 && (
                    <button onClick={clearFilters} className="btn-secondary">
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                results.map((searchResult) => (
                  <CourseCard
                    key={searchResult.course_with_sections.course.id}
                    courseWithSections={searchResult.course_with_sections}
                    selected={selectedCourseIds.has(searchResult.course_with_sections.course.id)}
                    onSelect={handleCourseSelect}
                    onSectionSelect={handleSectionSelect}
                    showSections={true}
                    showEnrollment={true}
                  />
                ))
              )}
            </div>

            {/* Load More Button */}
            {hasMore && results.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="btn-secondary"
                >
                  {isFetching ? 'Loading...' : 'Load More Courses'}
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {isFetching && results.length > 0 && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-sm text-gray-600">Loading more courses...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowFilters(false)}
            ></div>
            <div className="relative w-80 h-full bg-white overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                className="border-0 rounded-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;