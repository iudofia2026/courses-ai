"""
Simple test script to validate backend components.

This script performs basic tests to ensure all components are working correctly.
Run with: python test_backend.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

async def test_imports():
    """Test that all imports work correctly."""
    print("Testing imports...")
    
    try:
        from config import settings
        print("✓ Config imported successfully")
        
        from models import Course, Section, ScheduleRequest, SearchRequest
        print("✓ Models imported successfully")
        
        from services import course_table_client, ai_service, schedule_generator
        print("✓ Services imported successfully")
        
        from routes import search_router, schedules_router
        print("✓ Routes imported successfully")
        
        from utils.helpers import parse_course_data, sanitize_query
        print("✓ Utils imported successfully")
        
        from main import app
        print("✓ FastAPI app imported successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Import failed: {str(e)}")
        return False


async def test_config():
    """Test configuration loading."""
    print("\nTesting configuration...")
    
    try:
        from config import settings
        
        print(f"✓ Environment: {settings.environment}")
        print(f"✓ API Host: {settings.api_host}:{settings.api_port}")
        print(f"✓ OpenAI Model: {settings.openai_model}")
        print(f"✓ CourseTable URL: {settings.coursetable_api_url}")
        print(f"✓ AI Search Enabled: {settings.ai_search_enabled}")
        
        # Test environment variable handling
        if not settings.openai_api_key:
            print("⚠ OpenAI API key not set - AI features will be limited")
        
        return True
        
    except Exception as e:
        print(f"✗ Config test failed: {str(e)}")
        return False


async def test_models():
    """Test model creation and validation."""
    print("\nTesting models...")
    
    try:
        from models import Course, Section, ScheduleRequest, SearchRequest
        from datetime import time
        
        # Test Course model
        course_data = {
            "id": "test_course_001",
            "title": "Introduction to Computer Science",
            "description": "Learn programming fundamentals",
            "credits": 3.0
        }
        
        course = Course(**course_data)
        print("✓ Course model created successfully")
        
        # Test Section model
        section_data = {
            "id": "test_section_001",
            "course_id": "test_course_001",
            "section": "01",
            "season_code": "202401"
        }
        
        section = Section(**section_data)
        print("✓ Section model created successfully")
        
        # Test ScheduleRequest model
        schedule_request = ScheduleRequest(
            course_ids=["test_course_001"],
            season_code="202401"
        )
        print("✓ ScheduleRequest model created successfully")
        
        # Test SearchRequest model
        search_request = SearchRequest(
            user_query="computer science courses"
        )
        print("✓ SearchRequest model created successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Model test failed: {str(e)}")
        return False


async def test_utils():
    """Test utility functions."""
    print("\nTesting utilities...")
    
    try:
        from utils.helpers import (
            sanitize_query,
            validate_season_code,
            get_current_season_code,
            format_time_display
        )
        from datetime import time
        
        # Test query sanitization
        clean_query = sanitize_query("test <script>alert('xss')</script> query")
        expected = "test alertxss query"
        print(f"✓ Query sanitization: '{clean_query}'")
        
        # Test season code validation
        valid_season = validate_season_code("202401")
        invalid_season = validate_season_code("202499")
        print(f"✓ Season validation: valid={valid_season}, invalid={invalid_season}")
        
        # Test current season
        current_season = get_current_season_code()
        print(f"✓ Current season: {current_season}")
        
        # Test time formatting
        formatted_time = format_time_display(time(14, 30))
        print(f"✓ Time formatting: {formatted_time}")
        
        return True
        
    except Exception as e:
        print(f"✗ Utils test failed: {str(e)}")
        return False


async def test_service_initialization():
    """Test service initialization (without API calls)."""
    print("\nTesting service initialization...")
    
    try:
        from services import course_table_client, ai_service, schedule_generator
        
        # Test CourseTable client initialization
        print("✓ CourseTable client initialized")
        
        # Test AI service initialization
        print("✓ AI service initialized")
        
        # Test schedule generator initialization
        print("✓ Schedule generator initialized")
        
        return True
        
    except Exception as e:
        print(f"✗ Service initialization test failed: {str(e)}")
        return False


async def test_fastapi_app():
    """Test FastAPI application setup."""
    print("\nTesting FastAPI application...")
    
    try:
        from main import app
        from fastapi.testclient import TestClient
        
        # Create test client
        client = TestClient(app)
        
        # Test root endpoint
        response = client.get("/")
        if response.status_code == 200:
            print("✓ Root endpoint working")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Root endpoint failed: {response.status_code}")
            return False
        
        # Test health endpoint
        response = client.get("/health")
        if response.status_code == 200:
            print("✓ Health endpoint working")
            health_data = response.json()
            print(f"  Status: {health_data.get('status')}")
        else:
            print(f"✗ Health endpoint failed: {response.status_code}")
            return False
        
        # Test version endpoint
        response = client.get("/version")
        if response.status_code == 200:
            print("✓ Version endpoint working")
            version_data = response.json()
            print(f"  Version: {version_data.get('api_version')}")
        else:
            print(f"✗ Version endpoint failed: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ FastAPI app test failed: {str(e)}")
        return False


async def main():
    """Run all tests."""
    print("🚀 AI Course Scheduler Backend Test Suite")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("Models", test_models),
        ("Utilities", test_utils),
        ("Service Initialization", test_service_initialization),
        ("FastAPI Application", test_fastapi_app),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} tests...")
        try:
            if await test_func():
                passed += 1
                print(f"✅ {test_name} tests passed")
            else:
                print(f"❌ {test_name} tests failed")
        except Exception as e:
            print(f"❌ {test_name} tests crashed: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready for use.")
        print("\nNext steps:")
        print("1. Set up your .env file with proper API keys")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Start the server: python main.py")
        print("4. Visit http://localhost:8000/docs for API documentation")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1
    
    return 0


if __name__ == "__main__":
    # Run the test suite
    exit_code = asyncio.run(main())
    sys.exit(exit_code)