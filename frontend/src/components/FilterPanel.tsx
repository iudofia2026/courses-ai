/**
 * FilterPanel component for advanced course search filtering.
 * Provides filters for departments, credits, times, professors, and more.
 */

import React, { useState, useEffect } from 'react';
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { SearchFilter } from '../types';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'multiselect' | 'range' | 'select' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  defaultValue?: any;
}

interface FilterPanelProps {
  filters: SearchFilter[];
  onFiltersChange: (filters: SearchFilter[]) => void;
  className?: string;
  availableFilters?: {
    departments?: FilterOption[];
    areas?: FilterOption[];
    skills?: FilterOption[];
    credits?: { min: number; max: number };
    times?: FilterOption[];
    professors?: FilterOption[];
  };
}

export function FilterPanel({
  filters,
  onFiltersChange,
  className = '',
  availableFilters = {},
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['departments', 'credits', 'time'])
  );
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  // Initialize temp values from current filters
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    filters.forEach(filter => {
      switch (filter.field) {
        case 'department':
          if (!initialValues.departments) initialValues.departments = [];
          initialValues.departments.push(filter.value);
          break;
        case 'areas':
          if (!initialValues.areas) initialValues.areas = [];
          initialValues.areas.push(filter.value);
          break;
        case 'credits':
          initialValues.credits = { min: 0, max: 21 }; // Default values
          break;
        case 'time_preference':
          if (!initialValues.time_preference) initialValues.time_preference = [];
          initialValues.time_preference.push(filter.value);
          break;
        case 'professor':
          if (!initialValues.professors) initialValues.professors = [];
          initialValues.professors.push(filter.value);
          break;
      }
    });
    setTempValues(initialValues);
  }, []);

  // Filter groups configuration
  const filterGroups: FilterGroup[] = [
    {
      id: 'departments',
      label: 'Departments',
      type: 'multiselect',
      options: availableFilters.departments || [],
    },
    {
      id: 'areas',
      label: 'Areas of Study',
      type: 'multiselect',
      options: availableFilters.areas || [],
    },
    {
      id: 'skills',
      label: 'Skills',
      type: 'multiselect',
      options: availableFilters.skills || [],
    },
    {
      id: 'credits',
      label: 'Credits',
      type: 'range',
      min: availableFilters.credits?.min || 0,
      max: availableFilters.credits?.max || 21,
      defaultValue: { min: 0, max: 21 },
    },
    {
      id: 'time_preference',
      label: 'Time Preferences',
      type: 'multiselect',
      options: availableFilters.times || [
        { value: 'morning', label: 'Morning (8AM - 12PM)' },
        { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
        { value: 'evening', label: 'Evening (5PM - 9PM)' },
      ],
    },
    {
      id: 'professors',
      label: 'Professors',
      type: 'multiselect',
      options: availableFilters.professors || [],
    },
  ];

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle multiselect change
  const handleMultiselectChange = (groupId: string, value: string) => {
    setTempValues(prev => {
      const currentValues = prev[groupId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];
      return { ...prev, [groupId]: newValues };
    });
  };

  // Handle range change
  const handleRangeChange = (groupId: string, type: 'min' | 'max', value: number) => {
    setTempValues(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [type]: value,
      },
    }));
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters: SearchFilter[] = [];

    Object.entries(tempValues).forEach(([groupId, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      switch (groupId) {
        case 'departments':
          value.forEach((dept: string) => {
            newFilters.push({
              field: 'department',
              operator: '=',
              value: dept,
            });
          });
          break;

        case 'areas':
          newFilters.push({
            field: 'areas',
            operator: 'contains',
            value: value,
          });
          break;

        case 'skills':
          newFilters.push({
            field: 'skills',
            operator: 'contains',
            value: value,
          });
          break;

        case 'credits':
          if (value.min > 0 || value.max < 21) {
            newFilters.push({
              field: 'credits',
              operator: 'between',
              value: [value.min, value.max],
            });
          }
          break;

        case 'time_preference':
          value.forEach((time: string) => {
            newFilters.push({
              field: 'time_preference',
              operator: '=',
              value: time,
            });
          });
          break;

        case 'professors':
          value.forEach((prof: string) => {
            newFilters.push({
              field: 'professor',
              operator: 'contains',
              value: prof,
            });
          });
          break;
      }
    });

    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptyValues: Record<string, any> = {};
    filterGroups.forEach(group => {
      if (group.type === 'multiselect') {
        emptyValues[group.id] = [];
      } else if (group.type === 'range') {
        emptyValues[group.id] = { min: group.min || 0, max: group.max || 21 };
      }
    });
    setTempValues(emptyValues);
    onFiltersChange([]);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(tempValues).forEach(value => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object' && value !== null) {
        if (value.min > 0 || value.max < 21) count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Render filter group
  const renderFilterGroup = (group: FilterGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const value = tempValues[group.id];

    return (
      <div key={group.id} className="border-b border-gray-200 last:border-b-0">
        {/* Group header */}
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">{group.label}</span>
            {Array.isArray(value) && value.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {value.length}
              </span>
            )}
            {typeof value === 'object' && value !== null && !Array.isArray(value) &&
             ((value.min > 0) || (value.max < 21)) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Active
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Group content */}
        {isExpanded && (
          <div className="px-4 pb-3">
            {group.type === 'multiselect' && group.options && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {group.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={Array.isArray(value) && value.includes(option.value)}
                      onChange={() => handleMultiselectChange(group.id, option.value)}
                    />
                    <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                    {option.count && (
                      <span className="text-xs text-gray-500">({option.count})</span>
                    )}
                  </label>
                ))}
                {(!group.options || group.options.length === 0) && (
                  <p className="text-sm text-gray-500 italic">No options available</p>
                )}
              </div>
            )}

            {group.type === 'range' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Credits: {value?.min || group.min}
                  </label>
                  <input
                    type="range"
                    min={group.min}
                    max={group.max}
                    value={value?.min || group.min}
                    onChange={(e) => handleRangeChange(group.id, 'min', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Credits: {value?.max || group.max}
                  </label>
                  <input
                    type="range"
                    min={group.min}
                    max={group.max}
                    value={value?.max || group.max}
                    onChange={(e) => handleRangeChange(group.id, 'max', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
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
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter groups */}
      <div className="divide-y divide-gray-200">
        {filterGroups.map(renderFilterGroup)}
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={applyFilters}
          className="w-full btn-primary"
        >
          Apply Filters
        </button>
      </div>

      {/* Quick filters */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTempValues(prev => ({
                ...prev,
                credits: { min: 12, max: 15 },
              }));
            }}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            Full-time (12-15 credits)
          </button>
          <button
            onClick={() => {
              setTempValues(prev => ({
                ...prev,
                time_preference: ['morning', 'afternoon'],
              }));
            }}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            Daytime Classes
          </button>
          <button
            onClick={() => {
              setTempValues(prev => ({
                ...prev,
                time_preference: ['evening'],
              }));
            }}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            Evening Classes
          </button>
          <button
            onClick={() => {
              setTempValues(prev => ({
                ...prev,
                credits: { min: 0, max: 6 },
              }));
            }}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            Light Load (≤6 credits)
          </button>
        </div>
      </div>
    </div>
  );
}