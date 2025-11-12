"""
Search API routes for course search functionality.

This module provides FastAPI routes for course search, query parsing,
suggestions, and detailed course information retrieval.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from fastapi.responses import JSONResponse

from models.search import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    CourseDetailRequest,
    CourseDetailResponse,
    SuggestionRequest,
    SuggestionResponse,
    SearchSuggestion,
    CourseSearchQuery,
    ParsedQuery
)
from models.course import CourseWithSections, Section, PageInfo
from services import course_table_client, ai_service, CourseTableError, AIServiceError
from utils.helpers import parse_course_data, parse_search_response, error_handler
from config import settings

logger = logging.getLogger(__name__)

# Create router instance
router = APIRouter(
    prefix="/search",
    tags=["search"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)


@router.post("/", response_model=SearchResponse)
async def search_courses(
    request: SearchRequest,
    background_tasks: BackgroundTasks
):
    """
    Search for courses with AI-powered query parsing and ranking.
    
    Args:
        request: Search request with query or structured parameters
        background_tasks: FastAPI background tasks for analytics
        
    Returns:
        SearchResponse: Search results with pagination and metadata
        
    Raises:
        HTTPException: For API errors
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Course search request: {request.json() if hasattr(request, 'json') else str(request)}")
        
        # Initialize search query
        search_query = request.structured_query
        
        # Use AI parsing if user query provided and enabled
        if request.user_query and request.use_ai_parsing and settings.ai_search_enabled:
            try:
                parsed_query = await ai_service.parse_query(request.user_query)
                logger.info(f"AI parsed query: {parsed_query.json()}")
                
                # Convert parsed query to structured query
                search_query = _convert_parsed_query_to_search(parsed_query, request.season_code)
                
            except AIServiceError as e:
                logger.warning(f"AI query parsing failed: {str(e)}")
                # Fall back to basic search
                search_query = CourseSearchQuery(
                    query=request.user_query,
                    season_code=request.season_code or "202401",
                    limit=request.max_results
                )
        
        # If no structured query, create basic one
        if not search_query:
            search_query = CourseSearchQuery(
                query=request.user_query,
                season_code=request.season_code or "202401",
                limit=request.max_results
            )
        
        # Execute search via CourseTable client
        search_result = await course_table_client.search_courses(
            query=search_query.query,
            season_code=search_query.season_code,
            limit=search_query.limit,
            offset=search_query.offset,
            filters=search_query.filters
        )
        
        # Parse and convert results
        courses_data = search_result["data"]
        
        # Extract course information from GraphQL response
        courses_with_sections = []
        if "courses" in courses_data:
            courses_edges = courses_data["courses"].get("edges", [])
            
            for edge in courses_edges:
                course_node = edge.get("node", {})
                course_with_sections = parse_course_data(course_node)
                if course_with_sections:
                    courses_with_sections.append(course_with_sections)
        
        # Create search results
        search_results = []
        for course_with_sections in courses_with_sections:
            search_result_item = SearchResult(
                course_with_sections=course_with_sections,
                relevance_score=1.0,  # Will be updated by AI ranking
                match_reasons=[],
                highlights={}
            )
            search_results.append(search_result_item)
        
        # AI-powered ranking if enabled
        if settings.ai_search_enabled and search_results:
            try:
                # Prepare user preferences for ranking
                user_preferences = {
                    "query_type": "course_search",
                    "original_query": request.user_query,
                    "season_code": request.season_code
                }
                
                ranked_results = await ai_service.rank_search_results(
                    search_results,
                    user_preferences
                )
                search_results = ranked_results
                
            except AIServiceError as e:
                logger.warning(f"AI ranking failed: {str(e)}")
                # Continue with unranked results
        
        # Build pagination info
        page_info = PageInfo()
        if "courses" in courses_data and "pageInfo" in courses_data["courses"]:
            page_data = courses_data["courses"]["pageInfo"]
            page_info = PageInfo(
                has_next_page=page_data.get("hasNextPage", False),
                has_previous_page=page_data.get("hasPreviousPage", False),
                start_cursor=page_data.get("startCursor"),
                end_cursor=page_data.get("endCursor")
            )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        response = SearchResponse(
            results=search_results,
            total_count=len(search_results),
            has_more=page_info.has_next_page,
            next_offset=search_query.offset + len(search_results) if page_info.has_next_page else None,
            parsed_query=parsed_query if 'parsed_query' in locals() else None,
            query_time_ms=int(processing_time),
            metadata={
                "season_code": search_query.season_code,
                "filters_count": len(search_query.filters) if search_query.filters else 0,
                "ai_enabled": settings.ai_search_enabled,
                "api_response_time": search_result.get("processing_time_ms", 0)
            }
        )
        
        # Log analytics in background
        background_tasks.add_task(
            log_search_analytics,
            request.user_query or "structured_search",
            len(search_results),
            int(processing_time)
        )
        
        logger.info(f"Search completed: {len(search_results)} results in {processing_time:.2f}ms")
        return response
        
    except CourseTableError as e:
        logger.error(f"CourseTable API error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Course search service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in course search: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during course search"
        )


@router.get("/course/{course_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    course_id: str,
    season_code: Optional[str] = Query(None, description="Season code for sections"),
    include_sections: bool = Query(True, description="Include course sections"),
    include_evaluations: bool = Query(True, description="Include course evaluations")
):
    """
    Get detailed information for a specific course.
    
    Args:
        course_id: Course identifier
        season_code: Academic season code
        include_sections: Whether to include section information
        include_evaluations: Whether to include evaluation data
        
    Returns:
        CourseDetailResponse: Detailed course information
        
    Raises:
        HTTPException: For API errors
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Getting course detail: {course_id}, season: {season_code}")
        
        # Get course detail from CourseTable
        result = await course_table_client.get_course_detail(
            course_id=course_id,
            season_code=season_code
        )
        
        course_data = result["data"]
        
        # Parse course data
        if "course" not in course_data:
            raise HTTPException(
                status_code=404,
                detail=f"Course with ID {course_id} not found"
            )
        
        course_node = course_data["course"]
        course_with_sections = parse_course_data(course_node)
        
        if not course_with_sections:
            raise HTTPException(
                status_code=404,
                detail=f"Could not parse course data for ID {course_id}"
            )
        
        # Generate similar courses (placeholder implementation)
        similar_courses = []
        # TODO: Implement similar course finding logic
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        response = CourseDetailResponse(
            course_with_sections=course_with_sections,
            section_details=[],
            similar_courses=similar_courses,
            prerequisite_info=None,
            query_time_ms=int(processing_time)
        )
        
        logger.info(f"Course detail retrieved in {processing_time:.2f}ms")
        return response
        
    except CourseTableError as e:
        if e.error_code == "COURSE_NOT_FOUND":
            raise HTTPException(
                status_code=404,
                detail=f"Course with ID {course_id} not found"
            )
        else:
            logger.error(f"CourseTable API error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Course service error: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting course detail: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while getting course detail"
        )


@router.post("/suggestions", response_model=SuggestionResponse)
async def get_search_suggestions(request: SuggestionRequest):
    """
    Get search suggestions based on partial query.
    
    Args:
        request: Suggestion request with partial query
        
    Returns:
        SuggestionResponse: List of search suggestions
        
    Raises:
        HTTPException: For API errors
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Getting suggestions for: '{request.partial_query}'")
        
        suggestions = []
        
        # Use AI for suggestions if enabled
        if settings.ai_search_enabled:
            try:
                ai_suggestions = await ai_service.generate_search_suggestions(
                    partial_query=request.partial_query,
                    limit=request.limit
                )
                
                # Convert to SearchSuggestion objects
                for suggestion_text in ai_suggestions:
                    suggestion = SearchSuggestion(
                        text=suggestion_text,
                        type="keyword",
                        metadata={"source": "ai_generated"}
                    )
                    suggestions.append(suggestion)
                    
            except AIServiceError as e:
                logger.warning(f"AI suggestion generation failed: {str(e)}")
        
        # If no AI suggestions, provide basic suggestions
        if not suggestions:
            basic_suggestions = [
                SearchSuggestion(text=f"{request.partial_query} computer science", type="course"),
                SearchSuggestion(text=f"{request.partial_query} mathematics", type="course"),
                SearchSuggestion(text=f"{request.partial_query} engineering", type="course"),
            ]
            suggestions.extend(basic_suggestions[:request.limit])
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        response = SuggestionResponse(
            suggestions=suggestions[:request.limit],
            query_time_ms=int(processing_time),
            metadata={
                "ai_enabled": settings.ai_search_enabled,
                "partial_query": request.partial_query
            }
        )
        
        logger.info(f"Generated {len(suggestions)} suggestions in {processing_time:.2f}ms")
        return response
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating suggestions"
        )


@router.get("/seasons")
async def get_available_seasons():
    """
    Get available academic seasons.
    
    Returns:
        Dict: Available seasons information
        
    Raises:
        HTTPException: For API errors
    """
    try:
        logger.info("Getting available seasons")
        
        result = await course_table_client.get_seasons()
        
        return {
            "seasons": result["data"],
            "processing_time_ms": result.get("processing_time_ms", 0),
            "current_season": "202401"  # TODO: Get from API response
        }
        
    except CourseTableError as e:
        logger.error(f"Error getting seasons: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Season service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error getting seasons: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while getting seasons"
        )


@router.get("/filters")
async def get_search_filters():
    """
    Get available search filters and options.
    
    Returns:
        Dict: Available filters and their options
    """
    # Return static filter configuration
    # In a real implementation, this could be dynamic based on available data
    filters = {
        "departments": [
            {"code": "CPSC", "name": "Computer Science"},
            {"code": "MATH", "name": "Mathematics"},
            {"code": "ENGL", "name": "English"},
            {"code": "HIST", "name": "History"},
            {"code": "ECON", "name": "Economics"},
        ],
        "areas": [
            {"code": "QR", "name": "Quantitative Reasoning"},
            {"code": "WR", "name": "Writing"},
            {"code": "SC", "name": "Science"},
            {"code": "HU", "name": "Humanities"},
            {"code": "SO", "name": "Social Science"},
        ],
        "skills": [
            {"code": "PROG", "name": "Programming"},
            {"code": "DATA", "name": "Data Analysis"},
            {"code": "RES", "name": "Research"},
            {"code": "COMM", "name": "Communication"},
        ],
        "teaching_methods": [
            "In Person",
            "Online",
            "Hybrid",
            "Seminar",
            "Lecture"
        ]
    }
    
    return {
        "filters": filters,
        "metadata": {
            "last_updated": datetime.now().isoformat(),
            "version": "1.0"
        }
    }


def _convert_parsed_query_to_search(
    parsed_query: ParsedQuery, 
    season_code: Optional[str]
) -> CourseSearchQuery:
    """
    Convert AI-parsed query to structured search query.
    
    Args:
        parsed_query: AI-parsed query object
        season_code: Academic season code
        
    Returns:
        CourseSearchQuery: Structured search query
    """
    # Build search text from keywords and original query
    search_text = " ".join(parsed_query.keywords) if parsed_query.keywords else parsed_query.original_query
    
    return CourseSearchQuery(
        query=search_text,
        season_code=season_code or "202401",
        limit=50,
        filters=parsed_query.filters
    )


async def log_search_analytics(
    query: str,
    result_count: int,
    processing_time_ms: int
):
    """
    Log search analytics in background.
    
    Args:
        query: Search query
        result_count: Number of results
        processing_time_ms: Processing time in milliseconds
    """
    try:
        # In a real implementation, this would log to analytics service
        logger.info(f"Analytics: query='{query}', results={result_count}, time={processing_time_ms}ms")
        
        # TODO: Implement actual analytics logging
        # - Store in database
        # - Update popular searches
        # - Track search trends
        
    except Exception as e:
        logger.error(f"Error logging search analytics: {str(e)}")


@router.get("/health")
async def search_health_check():
    """
    Health check for search functionality.
    
    Returns:
        Dict: Health status of search components
    """
    health_status = {
        "status": "healthy",
        "components": {},
        "timestamp": datetime.now().isoformat()
    }
    
    # Check CourseTable client
    try:
        coursetable_health = await course_table_client.health_check()
        health_status["components"]["coursetable"] = coursetable_health
    except Exception as e:
        health_status["components"]["coursetable"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check AI service
    try:
        ai_health = await ai_service.health_check()
        health_status["components"]["ai_service"] = ai_health
    except Exception as e:
        health_status["components"]["ai_service"] = {
            "status": "unhealthy", 
            "error": str(e)
        }
        if settings.ai_search_enabled:
            health_status["status"] = "degraded"
    
    return health_status