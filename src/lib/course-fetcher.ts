import { Course } from '@/types/course'
import { YaleDataManager } from './data-manager'

/**
 * Fetch Yale courses using local data cache
 */
export async function fetchYaleCourses(): Promise<Course[]> {
  try {
    const dataManager = YaleDataManager.getInstance()

    console.log('Loading Yale courses from local data cache...')

    // Get current semester courses
    const courses = dataManager.getCurrentSemesterCourses()

    console.log(`Successfully loaded ${courses.length} courses`)

    // Filter to only include courses that are actually offered (have meetings)
    const activeCourses = courses.filter(course =>
      course.course_meetings && course.course_meetings.length > 0
    )

    console.log(`${activeCourses.length} courses have scheduled meetings`)

    return activeCourses
  } catch (error) {
    console.error('Error loading Yale courses:', error)
    throw error
  }
}

/**
 * Enhanced search that looks across recent semesters for more comprehensive results
 */
export async function searchYaleCoursesEnhanced(searchTerm: string): Promise<Course[]> {
  try {
    const dataManager = YaleDataManager.getInstance()

    console.log(`Searching for "${searchTerm}" across recent semesters...`)

    const courses = dataManager.searchAcrossRecentSemesters(searchTerm, 3)

    console.log(`Found ${courses.length} courses matching "${searchTerm}"`)

    return courses
  } catch (error) {
    console.error('Error searching Yale courses:', error)
    throw error
  }
}

/**
 * Search for courses by title, code, or description
 */
export function searchCourses(courses: Course[], searchTerm: string): Course[] {
  const term = searchTerm.toLowerCase()

  return courses.filter(course =>
    (course.title && course.title.toLowerCase().includes(term)) ||
    (course.course_code && course.course_code.toLowerCase().includes(term)) ||
    (course.description && course.description.toLowerCase().includes(term)) ||
    (course.course_professors && course.course_professors.some(prof => prof && prof.toLowerCase().includes(term)))
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
      // Check if they meet on the same day using bitfield encoding
      // days_of_week is a number where each bit represents a day
      const daysOverlap = (meeting1.days_of_week & meeting2.days_of_week) > 0

      if (daysOverlap) {
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