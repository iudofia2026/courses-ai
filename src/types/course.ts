export interface CourseTime {
  days_of_week: number
  start_time: string
  end_time: string
}

export interface CourseMeeting {
  days_of_week: number
  start_time: string
  end_time: string
  location?: {
    room: string
    building: string
  }
}

export interface Course {
  course_id: string
  course_code: string
  title: string
  description: string
  credits: number
  season_code: string
  crn: string
  course_meetings: CourseMeeting[]
  course_professors: string[]
  requirements: string[]
  areas: string[]
  course_flags: string[]
  school: string
  final_exam: string
  prerequisites?: string
  same_course_id?: string
}

export interface UserPreferences {
  desiredCourses: string[]
  courseLoad: number // Number of courses (4-5 typical)
  totalCredits: number // Total Yale credits (4-5.5 typical)
  timeConstraints: {
    earliestStart: string
    latestEnd: string
    unavailableTimes: CourseTime[]
  }
  major: string
  majorRequirements: string[]
  courseTypes: string[]
  additionalPrefs: string
}

export interface GeneratedSchedule {
  id: string
  courses: Course[]
  totalCredits: number
  conflicts: string[]
  reasoning: string
  score: number
}