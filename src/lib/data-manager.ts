import fs from 'fs'
import path from 'path'
import { Course } from '@/types/course'

/**
 * Data manager for Yale course data
 * Uses local cached data files for fast access
 */
export class YaleDataManager {
  private static instance: YaleDataManager
  private dataPath: string
  private manifestCache: any
  private semesterCaches: Map<string, Course[]> = new Map()

  private constructor() {
    this.dataPath = path.join(process.cwd(), 'data')
  }

  static getInstance(): YaleDataManager {
    if (!YaleDataManager.instance) {
      YaleDataManager.instance = new YaleDataManager()
    }
    return YaleDataManager.instance
  }

  /**
   * Load the data manifest
   */
  private loadManifest() {
    if (this.manifestCache) return this.manifestCache

    try {
      const manifestPath = path.join(this.dataPath, 'manifest.json')
      const manifestData = fs.readFileSync(manifestPath, 'utf8')
      this.manifestCache = JSON.parse(manifestData)
      return this.manifestCache
    } catch (error) {
      console.error('Error loading data manifest:', error)
      return null
    }
  }

  /**
   * Get available semester codes
   */
  getAvailableSemesters(): string[] {
    const manifest = this.loadManifest()
    if (!manifest) return []

    return manifest.dataFiles
      .map((filename: string) => filename.replace('yale-courses-', '').replace('.json', ''))
      .sort()
  }

  /**
   * Load courses for a specific semester
   */
  loadSemesterCourses(semesterCode: string): Course[] {
    // Check cache first
    if (this.semesterCaches.has(semesterCode)) {
      return this.semesterCaches.get(semesterCode)!
    }

    try {
      const filename = `yale-courses-${semesterCode}.json`
      const filePath = path.join(this.dataPath, filename)

      if (!fs.existsSync(filePath)) {
        console.warn(`Course data file not found: ${filePath}`)
        return []
      }

      const courseData = fs.readFileSync(filePath, 'utf8')
      const courses: Course[] = JSON.parse(courseData)

      // Cache the data
      this.semesterCaches.set(semesterCode, courses)

      console.log(`Loaded ${courses.length} courses for semester ${semesterCode}`)
      return courses
    } catch (error) {
      console.error(`Error loading semester ${semesterCode}:`, error)
      return []
    }
  }

  /**
   * Get the current semester code based on the date
   */
  getCurrentSemesterCode(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

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
   * Get courses for the current semester
   */
  getCurrentSemesterCourses(): Course[] {
    const currentSemester = this.getCurrentSemesterCode()
    return this.loadSemesterCourses(currentSemester)
  }

  /**
   * Search across multiple semesters for more comprehensive results
   */
  searchAcrossRecentSemesters(searchTerm: string, semesterCount: number = 3): Course[] {
    const availableSemesters = this.getAvailableSemesters()
    const recentSemesters = availableSemesters.slice(-semesterCount)

    const allCourses: Course[] = []

    for (const semester of recentSemesters) {
      const semesterCourses = this.loadSemesterCourses(semester)
      allCourses.push(...semesterCourses)
    }

    // Remove duplicates based on course_code (keep most recent)
    const uniqueCourses = new Map<string, Course>()

    // Process in reverse order so newer courses overwrite older ones
    for (let i = allCourses.length - 1; i >= 0; i--) {
      const course = allCourses[i]
      if (!uniqueCourses.has(course.course_code)) {
        uniqueCourses.set(course.course_code, course)
      }
    }

    const courses = Array.from(uniqueCourses.values())

    // Filter by search term
    const term = searchTerm.toLowerCase()
    return courses.filter(course =>
      course.title.toLowerCase().includes(term) ||
      course.course_code.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term) ||
      course.course_professors.some(prof => prof.toLowerCase().includes(term))
    )
  }

  /**
   * Get comprehensive statistics about the data
   */
  getDataStatistics(): {
    totalSemesters: number
    totalCourses: number
    availableSemesters: string[]
    dataSize: string
  } {
    const manifest = this.loadManifest()
    const availableSemesters = this.getAvailableSemesters()

    // Calculate approximate data size
    let totalSize = 0
    try {
      const stats = fs.statSync(this.dataPath)
      // Rough estimate based on directory
      totalSize = manifest?.totalCourses * 500 || 0 // ~500 bytes per course estimate
    } catch (error) {
      // Ignore errors
    }

    return {
      totalSemesters: availableSemesters.length,
      totalCourses: manifest?.totalCourses || 0,
      availableSemesters,
      dataSize: totalSize > 1024 * 1024
        ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
        : `${(totalSize / 1024).toFixed(1)} KB`
    }
  }

  /**
   * Filter courses by various criteria
   */
  filterCourses(courses: Course[], filters: {
    school?: string
    areas?: string[]
    creditRange?: [number, number]
    hasTimeSlots?: boolean
  }): Course[] {
    return courses.filter(course => {
      if (filters.school && course.school !== filters.school) {
        return false
      }

      if (filters.areas && filters.areas.length > 0) {
        const hasMatchingArea = filters.areas.some(area =>
          course.areas.some(courseArea => courseArea.includes(area))
        )
        if (!hasMatchingArea) return false
      }

      if (filters.creditRange) {
        const [minCredits, maxCredits] = filters.creditRange
        if (course.credits < minCredits || course.credits > maxCredits) {
          return false
        }
      }

      if (filters.hasTimeSlots && (!course.course_meetings || course.course_meetings.length === 0)) {
        return false
      }

      return true
    })
  }
}