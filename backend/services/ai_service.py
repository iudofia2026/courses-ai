"""
AI Service for query parsing and course ranking using OpenAI or Gemini.

This module provides AI-powered functionality for parsing user queries,
ranking search results, and generating intelligent course recommendations.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

import openai
from openai import OpenAI, OpenAIError

try:
    import google.generativeai as genai
    from google.generativeai import GenerativeModel, configure
    GOOGLE_AI_AVAILABLE = True
except ImportError:
    GOOGLE_AI_AVAILABLE = False

from models.search import ParsedQuery, SearchFilter, SearchResult
from models.course import CourseWithSections, Professor
from config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Custom exception for AI service errors."""

    def __init__(self, message: str, error_code: Optional[str] = None):
        super().__init__(message)
        self.error_code = error_code


class AIService:
    """
    AI service using OpenAI or Gemini for query parsing and course ranking.

    Provides intelligent parsing of natural language queries and
    ranking of search results based on user preferences.
    """

    def __init__(self):
        """Initialize the AI service with the selected provider."""
        self.provider = settings.ai_provider.lower()
        self.client = None
        self.gemini_model = None

        try:
            if self.provider == "gemini":
                if not GOOGLE_AI_AVAILABLE:
                    raise AIServiceError("Google Generative AI library not installed")
                if not settings.gemini_api_key:
                    raise AIServiceError("Gemini API key not configured")

                genai.configure(api_key=settings.gemini_api_key)
                self.gemini_model = genai.GenerativeModel(settings.gemini_model)
                logger.info(f"AI service initialized with Gemini model: {settings.gemini_model}")
            else:
                if not settings.openai_api_key:
                    raise AIServiceError("OpenAI API key not configured")

                self.client = OpenAI(
                    api_key=settings.openai_api_key,
                    timeout=settings.openai_timeout
                )
                logger.info(f"AI service initialized with OpenAI model: {settings.openai_model}")
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {str(e)}")
            raise AIServiceError(
                f"Failed to initialize AI service: {str(e)}",
                error_code="INIT_FAILED"
            )

    async def parse_search_query(self, query: str, season_code: str) -> ParsedQuery:
        """
        Parse a natural language query into structured search parameters.

        Args:
            query: Natural language search query
            season_code: Academic season code (e.g., "202601")

        Returns:
            ParsedQuery with extracted search parameters

        Raises:
            AIServiceError: If parsing fails
        """
        if not settings.ai_search_enabled:
            logger.info("AI search disabled, returning basic query")
            return ParsedQuery(
                original_query=query,
                subject_codes=[],
                course_codes=[],
                keywords=query.lower().split(),
                filters=SearchFilter()
            )

        system_prompt = """You are a course search assistant for Yale University.
Parse natural language queries into structured search filters.

Output JSON with these fields (all optional):
{
  "subject_codes": ["CPSC", "MATH"],  // Department codes
  "min_rating": 4.0,                   // Minimum average rating (1-5)
  "max_workload": 15.0,                // Maximum hours/week
  "no_final_exam": true,               // Exclude courses with finals
  "no_friday": true,                   // Exclude Friday classes
  "requirements": ["QR", "WR"],        // Distribution requirements
  "keywords": ["intro", "easy"],       // Keywords for description
  "interpretation": "Looking for..."   // Human explanation
}

Common subjects: CPSC (CS), MATH, ECON, PSYC, HIST, ENGL, CHEM, PHYS, BIOL, etc.
Workload: "easy" = <10, "moderate" = 10-15, "challenging" = >15
Rating: "highly rated" = >4.0, "good" = >3.5"""

        try:
            if self.provider == "gemini":
                response = await self._call_gemini(
                    prompt=f"Query: {query}\nSeason: {season_code}",
                    system_prompt=system_prompt
                )
            else:
                response = await self._call_openai(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Query: {query}\nSeason: {season_code}"}
                    ]
                )

            result = json.loads(response)
            logger.info(f"Successfully parsed query: {query} → {result}")

            return ParsedQuery(
                original_query=query,
                subject_codes=result.get("subject_codes", []),
                course_codes=result.get("course_codes", []),
                keywords=result.get("keywords", query.lower().split()),
                min_rating=result.get("min_rating"),
                max_workload=result.get("max_workload"),
                no_final_exam=result.get("no_final_exam", False),
                no_friday=result.get("no_friday", False),
                requirements=result.get("requirements", []),
                interpretation=result.get("interpretation"),
                filters=SearchFilter(
                    min_rating=result.get("min_rating"),
                    max_workload=result.get("max_workload"),
                    no_final_exam=result.get("no_final_exam", False),
                    no_friday=result.get("no_friday", False),
                    requirements=result.get("requirements", [])
                )
            )

        except Exception as e:
            logger.error(f"Failed to parse query: {str(e)}")
            return ParsedQuery(
                original_query=query,
                subject_codes=[],
                course_codes=[],
                keywords=query.lower().split(),
                filters=SearchFilter(),
                interpretation=f"Searching for: {query}"
            )

    async def rank_courses(
        self,
        courses: List[Dict[str, Any]],
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Rank courses by relevance to a query using AI.

        Args:
            courses: List of course dictionaries
            query: Original search query
            limit: Maximum number of courses to return

        Returns:
            Ranked list of courses with relevance scores
        """
        if not settings.ai_search_enabled or not courses:
            return courses[:limit]

        # Create course summaries for ranking
        course_summaries = []
        for i, c in enumerate(courses[:100]):  # Limit to first 100 for performance
            prof_names = [
                cp.get("professor", {}).get("name", "")
                for cp in c.get("course_professors", [])
                if cp.get("professor")
            ]
            course_code = (
                c.get("listings", [{}])[0].get("course_code", "Unknown")
                if c.get("listings") else "Unknown"
            )

            summary = {
                "id": c.get("course_id", i),
                "code": course_code,
                "title": c.get("title", ""),
                "description": c.get("description", "")[:200],
                "professors": prof_names,
                "rating": c.get("average_rating"),
                "workload": c.get("average_workload")
            }
            course_summaries.append(summary)

        system_prompt = """You are ranking courses by relevance to a student's query.
Return JSON array of course_ids in order of relevance with scores.

Output format:
{
  "rankings": [
    {"course_id": 12345, "score": 0.95, "reason": "Perfect match..."},
    {"course_id": 12346, "score": 0.85, "reason": "Good match..."}
  ]
}

Consider:
- Query keywords vs course title/description
- Professor reputation (if mentioned)
- Ratings and workload preferences
- Course level (intro vs advanced)"""

        try:
            if self.provider == "gemini":
                response = await self._call_gemini(
                    prompt=f"Query: {query}\n\nCourses:\n{json.dumps(course_summaries, indent=2)}",
                    system_prompt=system_prompt
                )
            else:
                response = await self._call_openai(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": f"Query: {query}\n\nCourses:\n{json.dumps(course_summaries, indent=2)}"
                        }
                    ]
                )

            result = json.loads(response)
            rankings = result.get("rankings", [])

            # Add scores and explanations to courses
            score_map = {r["course_id"]: r for r in rankings}

            ranked_courses = []
            for c in courses:
                cid = c.get("course_id")
                if cid in score_map:
                    c["relevance_score"] = score_map[cid]["score"]
                    c["relevance_reason"] = score_map[cid].get("reason")
                    ranked_courses.append(c)

            # Sort by score
            ranked_courses.sort(
                key=lambda x: x.get("relevance_score", 0),
                reverse=True
            )

            return ranked_courses[:limit]

        except Exception as e:
            logger.error(f"Failed to rank courses: {str(e)}")
            return courses[:limit]

    async def generate_schedule_explanation(self, schedule: Dict[str, Any]) -> str:
        """Generate a human-readable explanation of a schedule."""
        if not settings.ai_search_enabled:
            return f"Schedule with {len(schedule.get('courses', []))} courses"

        courses = schedule.get("courses", [])
        if not courses:
            return "No courses in schedule"

        course_summaries = []
        for c in courses:
            course_code = (
                c.get("listings", [{}])[0].get("course_code", "Unknown")
                if c.get("listings") else "Unknown"
            )
            course_summaries.append({
                "code": course_code,
                "title": c.get("title", ""),
                "rating": c.get("average_rating"),
                "workload": c.get("average_workload")
            })

        conflicts = schedule.get("conflicts", [])
        quality_score = schedule.get("quality_score", 50)

        prompt = f"""Generate a 2-sentence explanation of this course schedule.
Focus on why it's a good/bad choice and any notable features.

Schedule:
- Courses: {json.dumps(course_summaries)}
- Quality Score: {quality_score}/100
- Conflicts: {len(conflicts)}
- Total Credits: {schedule.get('total_credits')}
- Days on Campus: {', '.join(schedule.get('days_on_campus', []))}

Be concise and helpful."""

        try:
            if self.provider == "gemini":
                response = await self._call_gemini(prompt=prompt)
            else:
                response = await self._call_openai(
                    messages=[{"role": "user", "content": prompt}]
                )

            return response.strip()

        except Exception as e:
            logger.error(f"Failed to generate explanation: {str(e)}")
            return f"Schedule with {len(courses)} courses and quality score {quality_score}/100"

    async def _call_openai(self, messages: List[Dict[str, str]]) -> str:
        """Make an API call to OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                temperature=settings.openai_temperature,
                max_tokens=settings.openai_max_tokens,
                response_format={"type": "json_object"} if any("json" in m.get("content", "").lower() for m in messages) else None
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise AIServiceError(f"OpenAI API error: {str(e)}", error_code="OPENAI_ERROR")

    async def _call_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Make an API call to Gemini."""
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self.gemini_model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.gemini_temperature,
                    max_output_tokens=settings.gemini_max_tokens,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise AIServiceError(f"Gemini API error: {str(e)}", error_code="GEMINI_ERROR")

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of the AI service."""
        try:
            if self.provider == "gemini":
                # Test Gemini with a simple query
                response = self.gemini_model.generate_content(
                    "Respond with JSON: {\"status\": \"healthy\"}",
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,
                        max_output_tokens=50,
                    )
                )
                return {"status": "healthy", "provider": "gemini"}
            else:
                # Test OpenAI with a simple query
                response = self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[{"role": "user", "content": "Respond with JSON: {\"status\": \"healthy\"}"}],
                    temperature=0.1,
                    max_tokens=50
                )
                return {"status": "healthy", "provider": "openai"}
        except Exception as e:
            logger.error(f"AI service health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "provider": self.provider,
                "error": str(e)
            }


# Create a singleton instance
ai_service = AIService()