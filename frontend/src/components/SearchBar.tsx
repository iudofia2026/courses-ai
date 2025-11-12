/**
 * SearchBar component for course search with natural language input,
 * suggestions, and debounced search functionality.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SearchRequest, SearchSuggestion, SuggestionRequest } from '../types';
import { apiClient } from '../services/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  seasonCode?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search for courses, professors, or topics...',
  disabled = false,
  className = '',
  autoFocus = false,
  showSuggestions = true,
  seasonCode,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Debounced search suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!showSuggestions || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const request: SuggestionRequest = {
        partial_query: searchQuery,
        season_code: seasonCode,
        limit: 8,
      };

      const response = await apiClient.getSearchSuggestions(request);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [showSuggestions, seasonCode]);

  // Debounce the suggestions fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestionsList(true);
    setSelectedSuggestionIndex(-1);

    // Trigger search when user presses Enter (handled in handleKeyDown)
  };

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestionsList(false);
    }
  }, [query, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestionsList || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion.text);
          handleSearch(selectedSuggestion.text);
        } else {
          handleSearch();
        }
        break;

      case 'Escape':
        setShowSuggestionsList(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  // Handle clear button
  const handleClear = () => {
    setQuery('');
    setShowSuggestionsList(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    if (showSuggestions && query.length >= 2) {
      setShowSuggestionsList(true);
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow click events on suggestions
    setTimeout(() => {
      setShowSuggestionsList(false);
    }, 200);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon
            className={`h-5 w-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
            aria-hidden="true"
          />
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            input-field pl-10 pr-10
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${showSuggestionsList ? 'rounded-b-none' : ''}
          `}
          aria-label="Search courses"
          aria-expanded={showSuggestionsList}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Clear button */}
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestionsList && showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-0 bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-lg"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            <ul className="py-1 max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index} role="option">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`
                      w-full px-4 py-2 text-left flex items-center justify-between
                      hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                      ${selectedSuggestionIndex === index ? 'bg-gray-100' : ''}
                    `}
                  >
                    <span className="flex items-center space-x-2">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{suggestion.text}</span>
                    </span>
                    {suggestion.type && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {suggestion.type}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No suggestions found
            </div>
          ) : null}
        </div>
      )}

      {/* Search hints */}
      {showSuggestionsList && suggestions.length === 0 && query.length < 2 && (
        <div className="absolute z-10 w-full mt-0 bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-lg">
          <div className="px-4 py-3">
            <p className="text-sm text-gray-600 mb-2">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {['Computer Science', 'Mathematics', 'Psychology', 'Professor Smith', 'AI courses'].map(
                (hint, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(hint);
                      handleSearch(hint);
                    }}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    {hint}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}