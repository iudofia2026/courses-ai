import { Course } from '@/types/course'

const COURSETABLE_API_BASE = process.env.COURSETABLE_API_BASE || 'https://api.coursetable.com/api/catalog'

/**
 * Get the current Yale semester code (YYYYSS format)
 * 01 = Spring, 02 = Summer, 03 = Fall
 */
function getCurrentSemesterCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // JavaScript months are 0-indexed

  // Determine semester based on current month
  let semester: string
  if (month >= 1 && month <= 5) {
    semester = '01' // Spring
  } else if (month >= 6 && month <= 8) {
    semester = '02' // Summer
  } else {
    semester = '03' // Fall
  }

  return `${year}${semester}`
}

/**
 * Fetch all courses for the current semester from Yale's CourseTable API
 */
export async function fetchYaleCourses(): Promise<Course[]> {
  try {
    const semesterCode = getCurrentSemesterCode()
    const url = `${COURSETABLE_API_BASE}/public/${semesterCode}`

    console.log(`Fetching Yale courses from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`)
    }

    const courses: Course[] = await response.json()

    console.log(`Successfully fetched ${courses.length} courses`)

    // Filter to only include courses that are actually offered (have meetings)
    const activeCourses = courses.filter(course =>
      course.course_meetings && course.course_meetings.length > 0
    )

    console.log(`${activeCourses.length} courses have scheduled meetings`)

    return activeCourses
  } catch (error) {
    console.error('Error fetching Yale courses:', error)
    throw error
  }
}

/**
 * Search for courses by title, code, or description
 */
export function searchCourses(courses: Course[], searchTerm: string): Course[] {
  const term = searchTerm.toLowerCase()

  return courses.filter(course =>
    course.title.toLowerCase().includes(term) ||
    course.course_code.toLowerCase().includes(term) ||
    course.description.toLowerCase().includes(term) ||
    course.course_professors.some(prof => prof.toLowerCase().includes(term))
  )
}

/**
 * Filter courses by requirements/areas
 */
export function filterByRequirements(courses: Course[], requirements: string[]): Course[] {
  return courses.filter(course =>
    requirements.some(req =>
      course.areas.includes(req) ||
      course.course_flags.includes(req) ||
      course.requirements.includes(req)
    )
  )
}

/**
 * Check if two courses have time conflicts
 */
export function hasTimeConflict(course1: Course, course2: Course): boolean {
  for (const meeting1 of course1.course_meetings) {
    for (const meeting2 of course2.course_meetings) {
      // Check if they meet on the same day
      const commonDays = meeting1.days_of_week.filter(day =>
        meeting2.days_of_week.includes(day)
      )

      if (commonDays.length > 0) {
        // Check if times overlap
        const start1 = timeToMinutes(meeting1.start_time)
        const end1 = timeToMinutes(meeting1.end_time)
        const start2 = timeToMinutes(meeting2.start_time)
        const end2 = timeToMinutes(meeting2.end_time)

        // Check for overlap: (start1 < end2) && (start2 < end1)
        if (start1 < end2 && start2 < end1) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get semester code for a specific semester
 */
export function getSemesterCode(year: number, semester: 'spring' | 'summer' | 'fall'): string {
  const semesterCodes = {
    spring: '01',
    summer: '02',
    fall: '03'
  }

  return `${year}${semesterCodes[semester]}`
}