# AI Course Scheduler Backend

A robust, scalable backend API for AI-powered course search and scheduling, built with FastAPI and integrated with the CourseTable API.

## Features

### Core Functionality
- **AI-Powered Course Search**: Natural language query parsing using OpenAI
- **Intelligent Schedule Generation**: Automated schedule creation with conflict detection
- **CourseTable Integration**: Real-time course data from Yale's CourseTable API
- **Conflict Detection**: Advanced algorithms for time conflicts, exam conflicts, and professor conflicts
- **Quality Scoring**: Schedule optimization based on user preferences

### Technical Features
- **FastAPI**: Modern, high-performance web framework
- **GraphQL Client**: Efficient data fetching from CourseTable
- **Pydantic Models**: Type-safe data validation and serialization
- **OpenAI Integration**: GPT-4 for query parsing and intelligent ranking
- **Structured Logging**: Comprehensive error handling and monitoring
- **Health Checks**: Service health monitoring
- **CORS Support**: Ready for frontend integration

## Architecture

```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Application configuration and settings
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variables template
├── models/                # Pydantic data models
│   ├── course.py         # Course, Section, Professor models
│   ├── schedule.py       # Schedule generation models
│   ├── search.py         # Search and query models
│   └── __init__.py
├── services/             # Business logic and external integrations
│   ├── graphql_client.py # CourseTable API client
│   ├── ai_service.py     # OpenAI integration
│   ├── schedule_generator.py # Schedule optimization
│   └── __init__.py
├── routes/               # API endpoint handlers
│   ├── search.py         # Course search endpoints
│   ├── schedules.py      # Schedule generation endpoints
│   └── __init__.py
├── utils/                # Helper functions and utilities
│   ├── helpers.py        # Common utility functions
│   └── __init__.py
└── README.md            # This file
```

## API Endpoints

### Course Search
- `POST /api/search/` - AI-powered course search
- `GET /api/search/course/{course_id}` - Get detailed course information
- `POST /api/search/suggestions` - Get search suggestions
- `GET /api/search/seasons` - Get available academic seasons
- `GET /api/search/filters` - Get available search filters

### Schedule Generation
- `POST /api/schedules/generate` - Generate optimized schedules
- `GET /api/schedules/courses/{course_id}/sections` - Get course sections
- `POST /api/schedules/conflicts` - Check schedule conflicts
- `GET /api/schedules/preferences` - Get available preferences
- `POST /api/schedules/optimize` - Optimize existing schedule

### System
- `GET /` - API information
- `GET /health` - Health check for all services
- `GET /version` - API version and feature status
- `GET /docs` - Interactive API documentation (development only)

## Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key (for AI features)
- Access to CourseTable API

### Installation

1. **Clone and setup**:
```bash
cd backend
pip3 install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Set required environment variables**:
```bash
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Basic configuration
ENVIRONMENT=development
API_HOST=127.0.0.1
API_PORT=8000
```

4. **Run the application**:
```bash
python3 main.py
```

5. **Access the API**:
- API: `http://localhost:8000`
- Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Required |
| `ENVIRONMENT` | Environment (development/staging/production) | `development` |
| `API_HOST` | API server host | `0.0.0.0` |
| `API_PORT` | API server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `AI_SEARCH_ENABLED` | Enable AI-powered search | `true` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |

### Features Configuration

- **AI Features**: Set `AI_SEARCH_ENABLED=false` to run without OpenAI API
- **Rate Limiting**: Configure `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW`
- **Caching**: Optional Redis support for performance optimization

## Usage Examples

### Course Search

```python
import requests

# AI-powered search
response = requests.post("http://localhost:8000/api/search/", json={
    "user_query": "computer science courses with machine learning",
    "season_code": "202401",
    "max_results": 20
})

data = response.json()
courses = data["results"]
```

### Schedule Generation

```python
import requests

# Generate schedule for specific courses
response = requests.post("http://localhost:8000/api/schedules/generate", json={
    "course_ids": ["CPSC_201", "CPSC_323", "MATH_120"],
    "season_code": "202401",
    "constraints": {
        "no_early_morning": true,
        "max_credits": 18
    },
    "preferences": {
        "preferred_professors": ["Julia Hockenmaier"],
        "time_preference_weight": 0.4
    },
    "max_options": 5
})

schedule_options = response.json()["options"]
```

### Course Details

```python
import requests

# Get detailed course information
response = requests.get("http://localhost:8000/api/search/course/CPSC_201", params={
    "season_code": "202401",
    "include_sections": True
})

course_detail = response.json()
```

## Data Models

### Core Models

#### Course
- `id`: Course identifier
- `title`: Course title
- `description`: Course description
- `credits`: Credit hours
- `department`: Department information
- `areas`: Areas of study
- `skills`: Skills covered
- `professors`: Teaching faculty

#### Section
- `id`: Section identifier
- `course_id`: Parent course ID
- `section`: Section number
- `crn`: Course registration number
- `meetings`: Class meeting times and locations
- `capacity`: Enrollment capacity
- `enrolled`: Current enrollment

#### ScheduleOption
- `sections`: Selected course sections
- `total_credits`: Total credit hours
- `quality_score`: Schedule quality rating (0-100)
- `conflicts`: List of detected conflicts

## Integration

### CourseTable API
The backend integrates with Yale's CourseTable API using GraphQL queries:
- Real-time course data
- Section schedules and availability
- Professor information and evaluations
- Academic terms and seasons

### OpenAI Integration
AI features powered by GPT-4:
- Natural language query parsing
- Course ranking and recommendations
- Search suggestions
- Semantic matching

## Development

### Testing

Run the built-in test suite:
```bash
python3 test_backend.py
```

### Code Quality

The project includes comprehensive error handling and logging:
- Structured logging with detailed context
- Custom exception classes for better error handling
- Input validation and sanitization
- Request/response logging

### Performance

Optimizations include:
- GraphQL queries with specific field selection
- Connection pooling and retries
- Optional Redis caching
- Efficient conflict detection algorithms

## Production Deployment

### Environment Setup
```bash
ENVIRONMENT=production
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["https://your-domain.com"]
LOG_LEVEL=INFO
```

### Security Features
- CORS configuration
- Trusted host middleware
- Rate limiting
- Input validation
- Error message sanitization

### Monitoring
- Health check endpoints
- Structured logging
- Request/response timing
- Error tracking
- Performance metrics

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation with:
- Detailed endpoint descriptions
- Request/response schemas
- Example requests
- Try-it-out functionality

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Run `pip3 install -r requirements.txt`
2. **OpenAI API Key**: Set `OPENAI_API_KEY` in `.env`
3. **Import Errors**: Ensure running from the `backend/` directory
4. **CourseTable API**: Check network connectivity and API availability

### Health Check

Monitor service health:
```bash
curl http://localhost:8000/health
```

This returns status for:
- CourseTable API connectivity
- AI service availability
- Overall application health

## License

This project is licensed under the MIT License.

## Contributing

1. Follow the existing code style
2. Add comprehensive tests
3. Update documentation
4. Use structured logging
5. Handle errors gracefully

## Support

For issues and questions:
- Check the health endpoints first
- Review logs for detailed error information
- Verify environment configuration
- Test with known good inputs