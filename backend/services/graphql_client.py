"""
GraphQL client for CourseTable API integration.

This module provides a robust client for interacting with the CourseTable
GraphQL API, including proper error handling, retries, and logging.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

import httpx
from gql import gql, Client
from gql.transport.httpx import HTTPXAsyncTransport
from gql.transport.exceptions import (
    TransportQueryError,
    TransportServerError,
    TransportProtocolError,
    TransportClosed
)

from models.course import (
    Course,
    Section,
    CourseWithSections,
    Season,
    PageInfo
)
from models.search import SearchFilter
from config import settings

logger = logging.getLogger(__name__)


class CourseTableError(Exception):
    """Custom exception for CourseTable API errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, details: Optional[Dict] = None):
        super().__init__(message)
        self.error_code = error_code
        self.details = details or {}


class CourseTableClient:
    """
    GraphQL client for CourseTable API.
    
    Provides methods to search courses, get detailed information,
    and retrieve season data from the CourseTable API.
    """
    
    def __init__(self):
        """Initialize the CourseTable GraphQL client."""
        self._client: Optional[Client] = None
        self._transport: Optional[HTTPXAsyncTransport] = None
        self._last_request_time: Optional[datetime] = None
        
        # GraphQL query templates
        self._queries = {
            "search_courses": self._build_search_query(),
            "get_course": self._build_course_detail_query(),
            "get_seasons": self._build_seasons_query(),
            "get_sections": self._build_sections_query(),
        }
    
    def _get_client(self) -> Client:
        """
        Get or create the GraphQL client.
        
        Returns:
            Client: Configured GraphQL client
            
        Raises:
            CourseTableError: If client cannot be created
        """
        if self._client is None or self._transport is None:
            try:
                # Create HTTP transport with timeout and retries
                self._transport = HTTPXAsyncTransport(
                    url=settings.coursetable_api_url,
                    timeout=settings.coursetable_timeout,
                    headers={
                        "User-Agent": "AI-Course-Scheduler/1.0",
                        "Content-Type": "application/json",
                    }
                )
                
                # Create GraphQL client
                self._client = Client(
                    transport=self._transport,
                    fetch_schema_from_transport=True,
                    execute_timeout=settings.coursetable_timeout
                )
                
                logger.info(f"Created CourseTable GraphQL client for {settings.coursetable_api_url}")
                
            except Exception as e:
                logger.error(f"Failed to create CourseTable client: {str(e)}")
                raise CourseTableError(
                    f"Failed to initialize CourseTable client: {str(e)}",
                    error_code="CLIENT_INIT_FAILED"
                )
        
        return self._client
    
    def _build_search_query(self) -> str:
        """Build the GraphQL query for course search."""
        return """
        query SearchCourses($query: String, $seasonCode: String, $limit: Int, $offset: Int) {
          courses(query: $query, seasonCode: $seasonCode, limit: $limit, offset: $offset) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node {
                id
                title
                description
                credits
                courseCode
                department {
                  code
                  name
                }
                areas {
                  code
                  name
                }
                skills {
                  code
                  name
                }
                professors {
                  id
                  name
                  email
                  oci
                }
                requirements {
                  code
                  name
                }
                season {
                  code
                  year
                  term
                }
                sections(seasonCode: $seasonCode) {
                  id
                  section
                  crn
                  seasonCode
                  teachingMethod
                  capacity
                  enrolled
                  waitlist
                  meetings {
                    days
                    location
                    timeslots {
                      startTime
                      endTime
                    }
                    startDate
                    endDate
                  }
                  professors {
                    id
                    name
                    email
                    oci
                  }
                  notes
                  finalExam {
                    date
                    startTime
                    endTime
                    location
                  }
                }
              }
            }
          }
        }
        """
    
    def _build_course_detail_query(self) -> str:
        """Build the GraphQL query for detailed course information."""
        return """
        query GetCourse($courseId: ID!, $seasonCode: String) {
          course(id: $courseId) {
            id
            title
            description
            credits
            courseCode
            department {
              code
              name
            }
            areas {
              code
              name
            }
            skills {
              code
              name
            }
            professors {
              id
              name
              email
              oci
              evaluations {
                workload
                rating
              }
            }
            requirements {
              code
              name
            }
            syllabusUrl
            season {
              code
              year
              term
            }
            sections(seasonCode: $seasonCode) {
              id
              section
              crn
              seasonCode
              teachingMethod
              capacity
              enrolled
              waitlist
              meetings {
                days
                location
                timeslots {
                  startTime
                  endTime
                }
                startDate
                endDate
              }
              professors {
                id
                name
                email
                oci
                evaluations {
                  workload
                  rating
                }
              }
              notes
              syllabusUrl
              finalExam {
                date
                startTime
                endTime
                location
              }
            }
          }
        }
        """
    
    def _build_seasons_query(self) -> str:
        """Build the GraphQL query for available seasons."""
        return """
        query GetSeasons {
          seasons {
            code
            year
            term
            startDate
            endDate
            currentSeason
          }
        }
        """
    
    def _build_sections_query(self) -> str:
        """Build the GraphQL query for course sections."""
        return """
        query GetCourseSections($courseId: ID!, $seasonCode: String) {
          course(id: $courseId) {
            id
            sections(seasonCode: $seasonCode) {
              id
              section
              crn
              seasonCode
              teachingMethod
              capacity
              enrolled
              waitlist
              meetings {
                days
                location
                timeslots {
                  startTime
                  endTime
                }
                startDate
                endDate
              }
              professors {
                id
                name
                email
                oci
              }
              notes
              finalExam {
                date
                startTime
                endTime
                location
              }
            }
          }
        }
        """
    
    async def search_courses(
        self,
        query: Optional[str] = None,
        season_code: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[List[SearchFilter]] = None
    ) -> Dict[str, Any]:
        """
        Search for courses using the CourseTable API.
        
        Args:
            query: Search query string
            season_code: Academic season code
            limit: Maximum number of results
            offset: Pagination offset
            filters: Additional search filters
            
        Returns:
            Dict containing search results and pagination info
            
        Raises:
            CourseTableError: If search fails
        """
        start_time = datetime.now()
        
        try:
            client = self._get_client()
            
            # Prepare GraphQL query
            gql_query = gql(self._queries["search_courses"])
            
            # Build variables
            variables = {
                "query": query,
                "seasonCode": season_code,
                "limit": limit,
                "offset": offset
            }
            
            # Apply filters to query if provided
            if filters:
                query_parts = [query] if query else []
                for filter_obj in filters:
                    if filter_obj.field == "department" and filter_obj.operator == "in":
                        departments = ",".join(filter_obj.value) if isinstance(filter_obj.value, list) else filter_obj.value
                        query_parts.append(f"department:({departments})")
                    elif filter_obj.field == "areas" and filter_obj.operator == "contains":
                        query_parts.append(f"area:{filter_obj.value}")
                    elif filter_obj.field == "skills" and filter_obj.operator == "contains":
                        query_parts.append(f"skill:{filter_obj.value}")
                
                if len(query_parts) > 1:
                    variables["query"] = " ".join(query_parts)
            
            logger.info(f"Searching courses with query: {query}, season: {season_code}")
            
            # Execute query with retries
            for attempt in range(settings.coursetable_retries + 1):
                try:
                    result = await client.execute_async(gql_query, variable_values=variables)
                    break
                except (TransportQueryError, TransportServerError) as e:
                    if attempt == settings.coursetable_retries:
                        raise CourseTableError(
                            f"Course search failed after {settings.coursetable_retries} retries: {str(e)}",
                            error_code="SEARCH_FAILED"
                        )
                    logger.warning(f"Search attempt {attempt + 1} failed, retrying...")
                    continue
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Course search completed in {processing_time:.2f}ms")
            
            return {
                "data": result,
                "processing_time_ms": int(processing_time),
                "query_info": {
                    "query": query,
                    "season_code": season_code,
                    "limit": limit,
                    "offset": offset,
                    "filters": filters
                }
            }
            
        except TransportQueryError as e:
            logger.error(f"GraphQL query error: {str(e)}")
            raise CourseTableError(
                f"Invalid GraphQL query: {str(e)}",
                error_code="INVALID_QUERY",
                details={"query": query, "season_code": season_code}
            )
        except TransportServerError as e:
            logger.error(f"CourseTable API server error: {str(e)}")
            raise CourseTableError(
                f"CourseTable API server error: {str(e)}",
                error_code="SERVER_ERROR"
            )
        except Exception as e:
            logger.error(f"Unexpected error in course search: {str(e)}")
            raise CourseTableError(
                f"Unexpected error in course search: {str(e)}",
                error_code="UNKNOWN_ERROR"
            )
    
    async def get_course_detail(
        self,
        course_id: str,
        season_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get detailed information for a specific course.
        
        Args:
            course_id: Course identifier
            season_code: Academic season code for sections
            
        Returns:
            Dict containing detailed course information
            
        Raises:
            CourseTableError: If course retrieval fails
        """
        start_time = datetime.now()
        
        try:
            client = self._get_client()
            gql_query = gql(self._queries["get_course"])
            
            variables = {
                "courseId": course_id,
                "seasonCode": season_code
            }
            
            logger.info(f"Getting course detail for ID: {course_id}, season: {season_code}")
            
            result = await client.execute_async(gql_query, variable_values=variables)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Course detail retrieved in {processing_time:.2f}ms")
            
            return {
                "data": result,
                "processing_time_ms": int(processing_time),
                "course_id": course_id,
                "season_code": season_code
            }
            
        except TransportQueryError as e:
            logger.error(f"GraphQL query error for course {course_id}: {str(e)}")
            raise CourseTableError(
                f"Course not found or invalid query: {str(e)}",
                error_code="COURSE_NOT_FOUND",
                details={"course_id": course_id}
            )
        except Exception as e:
            logger.error(f"Error getting course detail: {str(e)}")
            raise CourseTableError(
                f"Error getting course detail: {str(e)}",
                error_code="GET_COURSE_FAILED"
            )
    
    async def get_seasons(self) -> Dict[str, Any]:
        """
        Get available academic seasons.
        
        Returns:
            Dict containing season information
            
        Raises:
            CourseTableError: If seasons retrieval fails
        """
        start_time = datetime.now()
        
        try:
            client = self._get_client()
            gql_query = gql(self._queries["get_seasons"])
            
            logger.info("Getting available seasons from CourseTable API")
            
            result = await client.execute_async(gql_query)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Seasons retrieved in {processing_time:.2f}ms")
            
            return {
                "data": result,
                "processing_time_ms": int(processing_time)
            }
            
        except Exception as e:
            logger.error(f"Error getting seasons: {str(e)}")
            raise CourseTableError(
                f"Error getting seasons: {str(e)}",
                error_code="GET_SEASONS_FAILED"
            )
    
    async def get_course_sections(
        self,
        course_id: str,
        season_code: str
    ) -> Dict[str, Any]:
        """
        Get sections for a specific course in a given season.
        
        Args:
            course_id: Course identifier
            season_code: Academic season code
            
        Returns:
            Dict containing course sections
            
        Raises:
            CourseTableError: If sections retrieval fails
        """
        start_time = datetime.now()
        
        try:
            client = self._get_client()
            gql_query = gql(self._queries["get_sections"])
            
            variables = {
                "courseId": course_id,
                "seasonCode": season_code
            }
            
            logger.info(f"Getting sections for course {course_id}, season {season_code}")
            
            result = await client.execute_async(gql_query, variable_values=variables)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Sections retrieved in {processing_time:.2f}ms")
            
            return {
                "data": result,
                "processing_time_ms": int(processing_time),
                "course_id": course_id,
                "season_code": season_code
            }
            
        except Exception as e:
            logger.error(f"Error getting course sections: {str(e)}")
            raise CourseTableError(
                f"Error getting course sections: {str(e)}",
                error_code="GET_SECTIONS_FAILED",
                details={"course_id": course_id, "season_code": season_code}
            )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on CourseTable API.
        
        Returns:
            Dict containing health check results
        """
        start_time = datetime.now()
        
        try:
            # Try to get seasons as a simple health check
            await self.get_seasons()
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                "status": "healthy",
                "api_url": settings.coursetable_api_url,
                "response_time_ms": int(processing_time),
                "timestamp": datetime.now().isoformat()
            }
            
        except CourseTableError as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "error_code": e.error_code,
                "api_url": settings.coursetable_api_url,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "api_url": settings.coursetable_api_url,
                "timestamp": datetime.now().isoformat()
            }
    
    async def close(self):
        """Close the GraphQL client and clean up resources."""
        try:
            if self._client:
                await self._client.close_async()
            if self._transport:
                await self._transport.aclose()
            logger.info("CourseTable client closed")
        except Exception as e:
            logger.warning(f"Error closing CourseTable client: {str(e)}")


# Create a singleton instance
course_table_client = CourseTableClient()