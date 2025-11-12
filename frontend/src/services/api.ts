/**
 * API client for the AI Course Scheduler backend.
 * Provides typed methods for all backend endpoints with proper error handling.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SearchRequest,
  SearchResponse,
  CourseDetailRequest,
  CourseDetailResponse,
  SuggestionRequest,
  SuggestionResponse,
  ScheduleRequest,
  GeneratedSchedule,
  CourseWithSections,
  ApiResponse
} from '../types';

// API base URL - change this to match your backend deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth headers here if needed
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        console.error(`API Error ${status}:`, data?.detail || data?.message || 'Unknown error');

        switch (status) {
          case 400:
            throw new Error(data?.detail || 'Invalid request parameters');
          case 401:
            throw new Error('Authentication required');
          case 403:
            throw new Error('Access forbidden');
          case 404:
            throw new Error('Resource not found');
          case 429:
            throw new Error('Too many requests - please try again later');
          case 500:
            throw new Error('Server error - please try again later');
          default:
            throw new Error(data?.detail || `Server error (${status})`);
        }
      } else if (axiosError.request) {
        // Network error
        console.error('Network Error:', axiosError.message);
        throw new Error('Network error - please check your connection');
      } else {
        // Other error
        console.error('Request Error:', axiosError.message);
        throw new Error('Request failed');
      }
    } else {
      console.error('Unknown Error:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Search courses with AI-powered natural language processing
   */
  async searchCourses(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await this.client.post<SearchResponse>('/api/search/', request);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get detailed information about a specific course
   */
  async getCourseDetail(request: CourseDetailRequest): Promise<CourseDetailResponse> {
    try {
      const response = await this.client.post<CourseDetailResponse>(
        `/api/courses/${request.course_id}/detail`,
        request
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    try {
      const response = await this.client.post<SuggestionResponse>('/api/search/suggestions', request);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate schedule options based on selected courses
   */
  async generateSchedules(request: ScheduleRequest): Promise<GeneratedSchedule> {
    try {
      const response = await this.client.post<GeneratedSchedule>('/api/schedules/generate', request);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Evaluate a specific schedule configuration
   */
  async evaluateSchedule(scheduleId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/schedules/${scheduleId}/evaluate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available seasons/terms
   */
  async getSeasons(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/seasons');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by ID (simplified version of getCourseDetail)
   */
  async getCourseById(courseId: string, seasonCode?: string): Promise<CourseWithSections> {
    try {
      const request: CourseDetailRequest = {
        course_id: courseId,
        season_code: seasonCode,
        include_sections: true,
        include_evaluations: true,
      };

      const response = await this.client.post<CourseDetailResponse>(
        `/api/courses/${courseId}/detail`,
        request
      );
      return response.data.course_with_sections;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic GET request for other endpoints
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic POST request for other endpoints
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PUT request for other endpoints
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic DELETE request for other endpoints
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };

// Export convenience functions for common operations
export const api = {
  search: apiClient.searchCourses.bind(apiClient),
  getCourse: apiClient.getCourseDetail.bind(apiClient),
  getSuggestions: apiClient.getSearchSuggestions.bind(apiClient),
  generateSchedule: apiClient.generateSchedules.bind(apiClient),
  evaluateSchedule: apiClient.evaluateSchedule.bind(apiClient),
  getSeasons: apiClient.getSeasons.bind(apiClient),
  health: apiClient.healthCheck.bind(apiClient),
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
};

