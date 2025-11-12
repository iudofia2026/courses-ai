/**
 * TypeScript interfaces matching backend Pydantic models.
 * These types ensure type safety between the frontend and backend.
 */

// Course Types
export interface Timeslot {
  start_time: string; // ISO time string "14:00:00"
  end_time: string;
}

export interface Meeting {
  timeslots: Timeslot[];
  days: string; // e.g., 'MW', 'TTH', 'MWF'
  location?: string;
  start_date?: string;
  end_date?: string;
}

export interface Evaluation {
  workload?: number; // 0-5 scale
  rating?: number; // 0-5 scale
  [key: string]: any;
}

export interface Professor {
  id?: number;
  name: string;
  email?: string;
  rating?: number; // 0-5 scale
  workload?: number; // 0-5 scale
  evaluations?: Evaluation;
  oci?: number;
  [key: string]: any;
}

export interface Season {
  code: string; // e.g., '202401'
  year: number;
  term: string; // 'Fall', 'Spring', or 'Summer'
  [key: string]: any;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  credits?: number;
  department?: Record<string, any>;
  areas?: string[];
  skills?: string[];
  professors?: Professor[];
  requirements?: string[];
  syllabus_url?: string;
  [key: string]: any;
}

export interface Section {
  id: string;
  course_id: string;
  section: string; // e.g., '01', '02'
  crn?: number;
  season_code: string;
  teaching_method?: string;
  capacity?: number;
  enrolled?: number;
  waitlist?: number;
  meetings?: Meeting[];
  professors?: Professor[];
  notes?: string;
  syllabus_url?: string;
  final_exam?: Record<string, any>;
  [key: string]: any;
}

export interface CourseWithSections {
  course: Course;
  sections: Section[];
}

export interface CourseSearchResult {
  courses: CourseWithSections[];
  total_count: number;
  has_more: boolean;
  next_offset?: number;
}

export interface PageInfo {
  has_next_page: boolean;
  has_previous_page: boolean;
  start_cursor?: string;
  end_cursor?: string;
}

// Search Types
export interface SearchFilter {
  field: string; // e.g., 'department', 'areas'
  operator: string; // '=', 'in', 'contains', 'regex'
  value: string | string[] | number | float | boolean;
  [key: string]: any;
}

export interface CourseSearchQuery {
  query?: string;
  filters: SearchFilter[];
  season_code?: string;
  limit: number;
  offset: number;
  sort_by?: string;
  sort_direction: 'asc' | 'desc';
  include_full_sections: boolean;
  [key: string]: any;
}

export interface ParsedQuery {
  original_query: string;
  intent: string; // 'course', 'professor', 'area', etc.
  keywords: string[];
  filters: SearchFilter[];
  entities: Record<string, any>;
  confidence: number; // 0-1
  suggestions: string[];
  [key: string]: any;
}

export interface SearchRequest {
  user_query?: string;
  structured_query?: CourseSearchQuery;
  use_ai_parsing: boolean;
  season_code?: string;
  max_results: number;
  [key: string]: any;
}

export interface SearchResult {
  course_with_sections: CourseWithSections;
  relevance_score: number; // 0-1
  match_reasons: string[];
  highlights: Record<string, string[]>;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  has_more: boolean;
  next_offset?: number;
  parsed_query?: ParsedQuery;
  query_time_ms: number;
  metadata: Record<string, any>;
}

export interface SuggestionRequest {
  partial_query: string;
  season_code?: string;
  limit: number;
  [key: string]: any;
}

export interface SearchSuggestion {
  text: string;
  type: string; // 'course', 'professor', 'area', 'keyword'
  count?: number;
  metadata: Record<string, any>;
}

export interface SuggestionResponse {
  suggestions: SearchSuggestion[];
  query_time_ms: number;
  metadata: Record<string, any>;
}

export interface CourseDetailRequest {
  course_id: string;
  season_code?: string;
  include_sections: boolean;
  include_evaluations: boolean;
  [key: string]: any;
}

export interface SectionDetail {
  section_id: string;
  enrollment_history: Record<string, any>[];
  waitlist_trend?: string;
  typical_enrollment?: number;
  popularity_score?: number;
  [key: string]: any;
}

export interface CourseDetailResponse {
  course_with_sections: CourseWithSections;
  section_details: SectionDetail[];
  similar_courses: Record<string, any>[];
  prerequisite_info?: Record<string, any>;
  query_time_ms: number;
}

// Schedule Types
export interface ScheduleConflict {
  section1_id: string;
  section2_id: string;
  conflict_type: string; // 'time', 'overlap', 'same_exam'
  details: string;
  severity: string; // 'error', 'warning'
}

export interface ScheduleConstraints {
  min_credits?: number;
  max_credits?: number;
  max_gap_minutes?: number;
  no_early_morning: boolean;
  no_late_evening: boolean;
  preferred_days?: string[];
  avoid_times?: string[];
  break_hours: string[];
  [key: string]: any;
}

export interface SchedulePreferences {
  workload_weight: number; // 0-1
  rating_weight: number; // 0-1
  time_preference_weight: number; // 0-1
  professor_weight: number; // 0-1
  preferred_professors?: string[];
  avoided_professors?: string[];
  preferred_time_blocks?: string[];
  avoid_time_blocks?: string[];
}

export interface ScheduleRequest {
  course_ids: string[];
  season_code: string;
  constraints?: ScheduleConstraints;
  preferences?: SchedulePreferences;
  max_options: number;
  include_full_sections: boolean;
  [key: string]: any;
}

export interface ScheduleOption {
  sections: Section[];
  total_credits: number;
  quality_score: number; // 0-100
  conflicts: string[];
  metadata: Record<string, any>;
}

export interface GeneratedSchedule {
  request_id: string;
  season_code: string;
  options: ScheduleOption[];
  total_options_generated: number;
  processing_time_ms: number;
  metadata: Record<string, any>;
}

export interface ScheduleQuality {
  workload_score: number; // 0-100
  professor_score: number; // 0-100
  time_distribution_score: number; // 0-100
  balance_score: number; // 0-100
  overall_score: number; // 0-100
}

export interface ScheduleStats {
  total_schedules: number;
  schedules_with_conflicts: number;
  schedules_without_conflicts: number;
  average_quality_score: number;
  best_quality_score: number;
  worst_quality_score: number;
  common_conflicts: string[];
}

export interface TimeBlock {
  day: string; // 'M', 'T', 'W', 'TH', 'F', 'SAT', 'SUN'
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface WeeklySchedule {
  time_blocks: TimeBlock[];
  total_weekly_hours: number;
  daily_hours: Record<string, number>;
  busiest_day?: string;
  free_days: string[];
}

// UI/Utility Types
export interface CourseSelection {
  course_id: string;
  selected: boolean;
  course?: CourseWithSections;
}

export interface ScheduleViewOption {
  id: string;
  name: string;
  option: ScheduleOption;
  selected: boolean;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  filters: SearchFilter[];
}

export interface ScheduleState {
  selectedCourses: CourseSelection[];
  generatedSchedules: ScheduleOption[];
  selectedSchedule: ScheduleOption | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  isLoading?: boolean;
  status?: number;
}

// Common type guards and utilities
export function isCourse(obj: any): obj is Course {
  return obj && typeof obj === 'object' && 'id' in obj && 'title' in obj;
}

export function isSection(obj: any): obj is Section {
  return obj && typeof obj === 'object' && 'id' in obj && 'course_id' in obj;
}

export function isSearchResult(obj: any): obj is SearchResult {
  return obj && typeof obj === 'object' && 'course_with_sections' in obj;
}

export function isScheduleOption(obj: any): obj is ScheduleOption {
  return obj && typeof obj === 'object' && 'sections' in obj && 'quality_score' in obj;
}