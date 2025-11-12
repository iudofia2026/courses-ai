import { NextRequest, NextResponse } from 'next/server'
import { fetchYaleCourses, searchYaleCoursesEnhanced, searchCourses } from '@/lib/course-fetcher'
import { generateSchedules } from '@/lib/ai-scheduler'
import { UserPreferences } from '@/types/course'

export async function POST(request: NextRequest) {
  try {
    const preferences: UserPreferences = await request.json()

    console.log('Received schedule generation request:', preferences)

    // Fetch Yale course data
    console.log('Fetching Yale courses...')
    const allCourses = await fetchYaleCourses()

    // Filter courses based on user preferences
    let relevantCourses = allCourses

    // If user specified desired courses, search for them using enhanced search
    if (preferences.desiredCourses.length > 0) {
      const searchResults = await Promise.all(
        preferences.desiredCourses.map(searchTerm =>
          searchYaleCoursesEnhanced(searchTerm)
        )
      )

      // Flatten and remove duplicates
      const flatResults = searchResults.flat()
      const uniqueCourses = Array.from(
        new Map(flatResults.map(course => [course.crn, course])).values()
      )

      if (uniqueCourses.length > 0) {
        relevantCourses = uniqueCourses
      }
    }

    console.log(`Found ${relevantCourses.length} relevant courses`)

    // Generate schedules using AI
    const schedules = await generateSchedules(relevantCourses, preferences)

    return NextResponse.json({
      success: true,
      schedules,
      totalCoursesConsidered: relevantCourses.length,
    })
  } catch (error) {
    console.error('Error in schedule generation API:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate schedules. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}