/**
 * LoadingStates component provides skeleton loaders and loading animations
 * for different parts of the application to improve perceived performance.
 */

import React from 'react';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children || <div className="bg-gray-200 rounded"></div>}
    </div>
  );
}

// Course card skeleton
export function CourseCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-start space-x-3 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2 rounded" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        </div>
      </div>

      <Skeleton className="h-4 w-full mb-2 rounded" />
      <Skeleton className="h-4 w-5/6 mb-3 rounded" />

      <div className="flex items-center space-x-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Search bar skeleton
export function SearchBarSkeleton() {
  return (
    <div className="relative">
      <div className="flex items-center">
        <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-gray-400" />
        <Skeleton className="h-10 w-full pl-10 rounded-lg" />
        <div className="absolute right-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        </div>
      </div>
      <Skeleton className="absolute w-full h-32 mt-0 rounded-b-lg" />
    </div>
  );
}

// Schedule options skeleton
export function ScheduleOptionSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-32 mb-2 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Schedule calendar skeleton
export function ScheduleCalendarSkeleton() {
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-6 w-48 rounded" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-6 gap-4">
          {/* Day headers */}
          {['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}

          {/* Time slots and courses */}
          {timeSlots.map((hour) => (
            <React.Fragment key={hour}>
              <div className="text-xs text-gray-500">
                {hour}:00
              </div>
              {[1, 2, 3, 4, 5].map((day) => (
                <div key={day} className="border border-gray-100 rounded p-1 h-12">
                  <Skeleton className="h-full w-full rounded" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// Filter panel skeleton
export function FilterPanelSkeleton() {
  return (
    <div className="card">
      <div className="mb-4">
        <Skeleton className="h-6 w-24 mb-3 rounded" />
        <Skeleton className="h-10 w-full rounded" />
      </div>

      <div className="mb-4">
        <Skeleton className="h-6 w-20 mb-3 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <Skeleton className="h-6 w-28 mb-3 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded" />
    </div>
  );
}

// Course detail page skeleton
export function CourseDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Skeleton className="h-8 w-96 mb-2 rounded" />
        <Skeleton className="h-6 w-48 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <Skeleton className="h-6 w-32 mb-4 rounded" />
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
          </div>

          <div className="card">
            <Skeleton className="h-6 w-40 mb-4 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <Skeleton className="h-6 w-24 mb-4 rounded" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mt-6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full page loader
export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Inline spinner loader
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]} ${className}`}></div>
  );
}

// Loading button
export function LoadingButton({
  loading,
  children,
  disabled,
  ...props
}: {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`btn-primary relative ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

// Export all loading states as a namespace
export const LoadingStates = {
  Skeleton,
  CourseCardSkeleton,
  SearchBarSkeleton,
  ScheduleOptionSkeleton,
  ScheduleCalendarSkeleton,
  FilterPanelSkeleton,
  CourseDetailSkeleton,
  FullPageLoader,
  Spinner,
  LoadingButton,
};