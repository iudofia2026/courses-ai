# API Documentation

📚 **Complete API reference for the AI Course Scheduler**

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [GraphQL Schema](#graphql-schema)
8. [Integration Examples](#integration-examples)

## Overview

The AI Course Scheduler API provides a comprehensive REST interface for course search, schedule generation, and academic planning. The API leverages AI-powered search and optimization to deliver intelligent course recommendations and conflict-free schedules.

### Key Features
- **AI-Powered Search**: Natural language course discovery using OpenAI GPT-4
- **Intelligent Scheduling**: Automated schedule optimization and conflict resolution
- **Real-time Data**: Live course information from Yale CourseTable
- **Flexible Filtering**: Advanced search by department, requirements, skills, and professors
- **Quality Scoring**: Schedule quality assessment and ranking

## Authentication

### API Key Authentication
Currently, the API does not require authentication for public endpoints. However, API key authentication can be implemented for rate limiting and access control.

```bash
# Example with API Key (future implementation)
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     https://api.courses-ai.com/api/search/
```

### CORS Headers
The API supports cross-origin requests with appropriate CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Base URL

### Development
```
https://localhost:8000
```

### Production
```
https://api.courses-ai.com
```

### Available Documentation
- **Swagger UI**: `/docs` (development only)
- **ReDoc**: `/redoc` (development only)
- **OpenAPI JSON**: `/openapi.json` (development only)

## Endpoints

### System Information

#### GET `/`
Get basic API information and status.

**Response:**
```json
{
  "name": "AI Course Scheduler API",
  "version": "1.0.0",
  "description": "AI-powered course search and scheduling API",
  "status": "running",
  "environment": "development",
  "docs_url": "/docs",
  "health_check_url": "/health",
  "endpoints": {
    "search": "/api/search/",
    "schedules": "/api/schedules/"
  }
}
```

#### GET `/version`
Get detailed version and feature information.

**Response:**
```json
{
  "api_version": "1.0.0",
  "environment": "development",
  "features": {
    "ai_search_enabled": true,
    "search_enabled": true,
    "schedule_generation_enabled": true,
    "rate_limiting_enabled": true
  }
}
```

#### GET `/health`
Comprehensive health check for all services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "environment": "development",
  "components": {
    "coursetable_api": {
      "status": "healthy",
      "response_time_ms": 245
    },
    "ai_service": {
      "status": "healthy",
      "model": "gpt-4-turbo-preview",
      "response_time_ms": 1250
    },
    "redis_cache": {
      "status": "healthy",
      "memory_usage": "45MB"
    }
  }
}
```

### Course Search

#### GET `/api/search/`
Search for courses using AI-powered natural language processing.

**Query Parameters:**
- `q` (string, required): Search query or natural language description
- `season` (string, optional): Season code (e.g., "202401")
- `limit` (integer, optional): Maximum results to return (default: 20, max: 100)
- `offset` (integer, optional): Results offset for pagination (default: 0)
- `ai_search` (boolean, optional): Enable AI-powered search (default: true)
- `filters` (object, optional): Additional search filters

**Filter Object:**
```json
{
  "department": ["CPSC", "MATH"],
  "skills": ["programming", "mathematics"],
  "areas": ["computer_science"],
  "requirements": ["qr"],
  "professors": ["Smith, John"],
  "times": {
    "days": ["MW", "TTh"],
    "start_time": "09:00",
    "end_time": "12:00"
  },
  "credits": {
    "min": 1,
    "max": 4
  }
}
```

**Request Examples:**

1. **Basic Search:**
   ```bash
   curl "https://api.courses-ai.com/api/search/?q=machine learning&limit=10"
   ```

2. **Advanced Search with Filters:**
   ```bash
   curl -X GET "https://api.courses-ai.com/api/search/?q=computer science courses&season=202401&limit=5" \
        -H "Content-Type: application/json" \
        -d '{
          "filters": {
            "department": ["CPSC"],
            "skills": ["python"],
            "credits": {"min": 3, "max": 4}
          }
        }'
   ```

3. **Natural Language Search:**
   ```bash
   curl "https://api.courses-ai.com/api/search/?q=I%27m%20looking%20for%20introductory%20programming%20courses%20that%20teach%20Python%20and%20don%27t%20have%20prerequisites"
   ```

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "CPSC-201-01",
        "title": "Introduction to Computer Science",
        "description": "An introduction to computer science and programming...",
        "department": "CPSC",
        "number": "201",
        "section": "01",
        "season": "202401",
        "credits": 3,
        "professors": [
          {
            "name": "Smith, John",
            "email": "john.smith@yale.edu"
          }
        ],
        "schedule": {
          "days": ["MW"],
          "time": "09:00-10:15",
          "location": "DL 220"
        },
        "requirements": ["qr"],
        "skills": ["python", "programming"],
        "areas": ["computer_science"],
        "prerequisites": [],
        "enrollment": {
          "current": 245,
          "capacity": 300,
          "waitlist": 12
        },
        "ai_relevance_score": 0.95
      }
    ],
    "total": 1,
    "ai_analysis": {
      "query_understanding": "User is looking for introductory Python courses",
      "search_strategy": "Filtered by beginner level and Python programming",
      "confidence": 0.92
    },
    "metadata": {
      "search_time_ms": 342,
      "ai_processing_time_ms": 1250,
      "cache_hit": false
    }
  }
}
```

### Schedule Generation

#### GET `/api/schedules/generate/`
Generate optimized course schedules based on preferences and constraints.

**Query Parameters:**
- `courses` (array, required): List of course IDs to include
- `preferences` (object, optional): Scheduling preferences
- `constraints` (object, optional): Hard constraints
- `max_options` (integer, optional): Maximum schedule options (default: 5, max: 20)

**Preferences Object:**
```json
{
  "time_preferences": {
    "preferred_days": ["MW", "TTh"],
    "avoid_morning": true,
    "avoid_late_evening": true,
    "preferred_start_time": "10:00",
    "preferred_end_time": "16:00"
  },
  "break_preferences": {
    "lunch_break": true,
    "lunch_time": "12:00-13:00",
    "breaks_between_classes": 30
  },
  "balance_preferences": {
    "even_distribution": true,
    "avoid_same_day_back_to_back": false,
    "preferred_credits_per_day": 6
  }
}
```

**Constraints Object:**
```json
{
  "max_credits": 5,
  "min_credits": 3,
  "required_courses": ["CPSC-201-01"],
  "forbidden_times": [
    {
      "day": "F",
      "time": "14:00-16:00"
    }
  ],
  "campus_constraints": {
    "max_distance_between_classes": 15,
    "avoid_certain_buildings": ["HGS"]
  }
}
```

**Request Example:**
```bash
curl -X GET "https://api.courses-ai.com/api/schedules/generate/" \
     -H "Content-Type: application/json" \
     -d '{
       "courses": ["CPSC-201-01", "MATH-120-01", "ENGL-114-01"],
       "preferences": {
         "time_preferences": {
           "avoid_morning": true,
           "preferred_days": ["MW", "TTh"]
         }
       },
       "constraints": {
         "max_credits": 5,
         "min_credits": 3
       },
       "max_options": 3
     }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "schedule_001",
        "quality_score": 92.5,
        "total_credits": 4,
        "courses": [
          {
            "id": "CPSC-201-01",
            "title": "Introduction to Computer Science",
            "schedule": {
              "days": ["MW"],
              "time": "10:30-11:45",
              "location": "DL 220"
            }
          },
          {
            "id": "MATH-120-01",
            "title": "Calculus of Functions of Several Variables",
            "schedule": {
              "days": ["TTh"],
              "time": "09:00-10:15",
              "location": "WLH 201"
            }
          },
          {
            "id": "ENGL-114-01",
            "title": "Writing Seminar",
            "schedule": {
              "days": ["F"],
              "time": "13:00-14:50",
              "location": "LC 102"
            }
          }
        ],
        "conflicts": [],
        "metadata": {
          "total_class_time": "7 hours 40 minutes",
          "days_with_classes": 4,
          "average_daily_gap": "45 minutes",
          "campus_efficiency": 85.2
        }
      }
    ],
    "analysis": {
      "total_options_generated": 3,
      "best_schedule_score": 92.5,
      "average_schedule_score": 87.3,
      "optimization_time_ms": 2340
    },
    "warnings": [
      "One schedule has back-to-back classes with only 10 minutes travel time"
    ]
  }
}
```

#### POST `/api/schedules/`
Create or save a custom schedule.

**Request Body:**
```json
{
  "name": "Fall 2024 Schedule",
  "courses": ["CPSC-201-01", "MATH-120-01"],
  "preferences": {
    "time_preferences": {
      "avoid_morning": true
    }
  },
  "constraints": {
    "max_credits": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule_id": "sched_abc123def456",
    "name": "Fall 2024 Schedule",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

#### GET `/api/schedules/{schedule_id}`
Retrieve a saved schedule by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sched_abc123def456",
    "name": "Fall 2024 Schedule",
    "courses": [...],
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:30:00Z"
  }
}
```

#### PUT `/api/schedules/{schedule_id}`
Update an existing schedule.

**Request Body:**
```json
{
  "name": "Updated Fall 2024 Schedule",
  "courses": ["CPSC-201-01", "MATH-120-01", "ENGL-114-01"]
}
```

#### DELETE `/api/schedules/{schedule_id}`
Delete a saved schedule.

**Response:**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

### Course Details

#### GET `/api/courses/{course_id}`
Get detailed information about a specific course.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "CPSC-201-01",
    "title": "Introduction to Computer Science",
    "description": "This course provides an introduction to computer science...",
    "long_description": "A comprehensive introduction to computer science...",
    "department": "CPSC",
    "number": "201",
    "section": "01",
    "season": "202401",
    "credits": 3,
    "professors": [...],
    "schedule": {...},
    "requirements": ["qr"],
    "skills": ["python", "programming"],
    "areas": ["computer_science"],
    "prerequisites": [],
    "syllabus": {
      "topics": ["Variables and Types", "Control Flow", "Functions"],
      "assignments": 5,
      "exams": 2,
      "final_exam": true
    },
    "enrollment": {...},
    "evaluations": {
      "overall_rating": 4.2,
      "difficulty": 3.1,
      "workload": "medium"
    }
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "limit",
      "issue": "Value must be between 1 and 100"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "request_id": "req_abc123def456"
  }
}
```

### Error Codes

#### HTTP Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

#### API-Specific Error Codes

| Code | Description | Example Scenarios |
|------|-------------|------------------|
| `VALIDATION_ERROR` | Invalid request parameters | Missing required fields, invalid data types |
| `COURSE_NOT_FOUND` | Course ID not found | Invalid or non-existent course ID |
| `SEARCH_ERROR` | Search operation failed | AI service unavailable, invalid query |
| `SCHEDULE_GENERATION_FAILED` | Schedule generation failed | Unresolvable conflicts, invalid constraints |
| `EXTERNAL_SERVICE_ERROR` | Third-party service error | CourseTable API unavailable, OpenAI API error |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Too many requests in time window |
| `INSUFFICIENT_CREDITS` | Invalid credit range | Too many or too few course credits |
| `UNRESOLVABLE_CONFLICTS` | Cannot resolve schedule conflicts | All course times overlap |
| `AI_SERVICE_UNAVAILABLE` | AI service temporarily unavailable | OpenAI API rate limits or downtime |

### Error Response Examples

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid search parameters",
    "details": {
      "limit": "Value must be between 1 and 100",
      "season": "Invalid season code format"
    }
  }
}
```

#### Service Unavailable
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI search service temporarily unavailable",
    "retry_after": 30,
    "suggestion": "Try using basic search without AI enhancement"
  }
}
```

## Rate Limiting

### Rate Limit Configuration
- **Default Limit**: 100 requests per hour per IP address
- **Search Endpoint**: 10 requests per minute
- **Schedule Generation**: 5 requests per minute
- **Burst Limit**: 20 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "retry_after": 3600,
    "details": {
      "limit": 100,
      "window": "1 hour",
      "current_usage": 100
    }
  }
}
```

## GraphQL Schema

The application uses GraphQL to communicate with the CourseTable API. Below are the key types used:

### Course Type
```graphql
type Course {
  id: ID!
  title: String!
  description: String
  department: String!
  number: String!
  section: String!
  season: String!
  credits: Float!
  professors: [Professor!]!
  schedule: Schedule!
  requirements: [String!]!
  skills: [String!]!
  areas: [String!]!
  prerequisites: [String!]!
  enrollment: Enrollment!
}
```

### Professor Type
```graphql
type Professor {
  name: String!
  email: String
  department: String!
  title: String
}
```

### Schedule Type
```graphql
type Schedule {
  days: [String!]!
  time: String!
  location: String!
  building: String!
}
```

### Enrollment Type
```graphql
type Enrollment {
  current: Int!
  capacity: Int!
  waitlist: Int!
  available: Boolean!
}
```

### Query Examples

#### Get Course by ID
```graphql
query GetCourse($id: ID!) {
  course(id: $id) {
    id
    title
    description
    department
    number
    professors {
      name
      email
    }
    schedule {
      days
      time
      location
    }
    enrollment {
      current
      capacity
      available
    }
  }
}
```

#### Search Courses
```graphql
query SearchCourses($season: String!, $department: String) {
  courses(season: $season, department: $department) {
    id
    title
    credits
    professors {
      name
    }
    schedule {
      days
      time
    }
  }
}
```

## Integration Examples

### Python Integration

#### Basic Search
```python
import httpx
import asyncio

async def search_courses(query, season="202401", limit=20):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.courses-ai.com/api/search/",
            params={
                "q": query,
                "season": season,
                "limit": limit,
                "ai_search": True
            }
        )

        if response.status_code == 200:
            data = response.json()
            return data["data"]["courses"]
        else:
            raise Exception(f"Search failed: {response.json()}")

# Usage
courses = await search_courses("machine learning")
for course in courses:
    print(f"{course['title']} - {course['department']} {course['number']}")
```

#### Schedule Generation
```python
async def generate_schedule(course_ids, preferences=None):
    async with httpx.AsyncClient() as client:
        payload = {
            "courses": course_ids,
            "max_options": 5
        }

        if preferences:
            payload["preferences"] = preferences

        response = await client.post(
            "https://api.courses-ai.com/api/schedules/generate/",
            json=payload
        )

        if response.status_code == 200:
            return response.json()["data"]["schedules"]
        else:
            raise Exception(f"Schedule generation failed")

# Usage
schedule_options = await generate_schedule(
    ["CPSC-201-01", "MATH-120-01"],
    preferences={
        "time_preferences": {
            "avoid_morning": True
        }
    }
)
```

### JavaScript Integration

#### Basic Search with Axios
```javascript
import axios from 'axios';

const API_BASE = 'https://api.courses-ai.com';

class CourseSchedulerAPI {
  async searchCourses(query, options = {}) {
    try {
      const response = await axios.get(`${API_BASE}/api/search/`, {
        params: {
          q: query,
          season: options.season || '202401',
          limit: options.limit || 20,
          ai_search: options.aiSearch !== false
        }
      });

      return response.data.data.courses;
    } catch (error) {
      throw new Error(`Search failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateSchedule(courseIds, preferences = {}) {
    try {
      const response = await axios.post(`${API_BASE}/api/schedules/generate/`, {
        courses: courseIds,
        preferences,
        max_options: preferences.maxOptions || 5
      });

      return response.data.data.schedules;
    } catch (error) {
      throw new Error(`Schedule generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getCourseDetails(courseId) {
    try {
      const response = await axios.get(`${API_BASE}/api/courses/${courseId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get course details: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// Usage
const api = new CourseSchedulerAPI();

const courses = await api.searchCourses('computer science', {
  season: '202401',
  limit: 10
});

const schedules = await api.generateSchedule(
  courses.slice(0, 3).map(c => c.id),
  {
    timePreferences: {
      avoidMorning: true,
      preferredDays: ['MW', 'TTh']
    }
  }
);
```

#### React Hook Integration
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useCourseSearch = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchCourses = async (query, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('https://api.courses-ai.com/api/search/', {
        params: { q: query, ...options }
      });

      setCourses(response.data.data.courses);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { courses, loading, error, searchCourses };
};

// Usage in component
function CourseSearchComponent() {
  const { courses, loading, error, searchCourses } = useCourseSearch();

  const handleSearch = (query) => {
    searchCourses(query, { season: '202401', limit: 20 });
  };

  if (loading) return <div>Searching...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <input
        type="text"
        placeholder="Search courses..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {courses.map(course => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.department} {course.number}</p>
        </div>
      ))}
    </div>
  );
}
```

### cURL Examples

#### Health Check
```bash
curl -X GET "https://api.courses-ai.com/health" \
     -H "Accept: application/json"
```

#### Basic Search
```bash
curl -X GET "https://api.courses-ai.com/api/search/?q=machine%20learning&limit=10" \
     -H "Accept: application/json"
```

#### Advanced Search with Filters
```bash
curl -X POST "https://api.courses-ai.com/api/search/" \
     -H "Content-Type: application/json" \
     -d '{
       "q": "computer science courses",
       "filters": {
         "department": ["CPSC"],
         "skills": ["python"],
         "credits": {"min": 3, "max": 4}
       },
       "limit": 15
     }'
```

#### Generate Schedule
```bash
curl -X POST "https://api.courses-ai.com/api/schedules/generate/" \
     -H "Content-Type: application/json" \
     -d '{
       "courses": ["CPSC-201-01", "MATH-120-01", "ENGL-114-01"],
       "preferences": {
         "time_preferences": {
           "avoid_morning": true
         }
       },
       "max_options": 3
     }'
```

### Go Integration

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
)

type Course struct {
    ID          string `json:"id"`
    Title       string `json:"title"`
    Department  string `json:"department"`
    Number      string `json:"number"`
    Credits     float64 `json:"credits"`
}

type SearchResponse struct {
    Success bool `json:"success"`
    Data    struct {
        Courses []Course `json:"courses"`
    } `json:"data"`
}

func searchCourses(query string) ([]Course, error) {
    baseURL := "https://api.courses-ai.com/api/search/"

    params := url.Values{}
    params.Add("q", query)
    params.Add("limit", "10")

    resp, err := http.Get(baseURL + "?" + params.Encode())
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var searchResp SearchResponse
    if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
        return nil, err
    }

    return searchResp.Data.Courses, nil
}

func main() {
    courses, err := searchCourses("machine learning")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    for _, course := range courses {
        fmt.Printf("%s - %s %s\n", course.Title, course.Department, course.Number)
    }
}
```

---

## 🚀 Ready to Integrate

This comprehensive API documentation provides everything you need to integrate the AI Course Scheduler into your applications. For additional support, check our [troubleshooting guide](docs/TROUBLESHOOTING.md) or open an issue on GitHub.