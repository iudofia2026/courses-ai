import { GoogleGenerativeAI } from '@google/generative-ai'
import { Course, UserPreferences, GeneratedSchedule } from '@/types/course'
import { hasTimeConflict } from './course-fetcher'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function generateSchedules(
  courses: Course[],
  preferences: UserPreferences
): Promise<GeneratedSchedule[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = createSchedulingPrompt(courses, preferences)

    console.log('Generating schedules with Gemini...')

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('Gemini response received:', text)

    // Parse the AI response into schedule objects
    const schedules = parseScheduleResponse(text, courses)

    // Validate and score the schedules
    const validatedSchedules = validateAndScoreSchedules(schedules, preferences)

    return validatedSchedules.slice(0, 3) // Return top 3 schedules
  } catch (error) {
    console.error('Error generating schedules:', error)
    throw error
  }
}

function createSchedulingPrompt(courses: Course[], preferences: UserPreferences): string {
  const coursesJson = JSON.stringify(courses.slice(0, 100), null, 2) // Limit to first 100 for token limits

  return `
You are an expert Yale academic advisor. Your task is to create optimal course schedules based on student preferences and Yale's course offerings.

IMPORTANT: YALE CREDIT SYSTEM
- Yale uses a unique credit system where each course is worth 1 credit (not semester hours)
- Students typically take 4-5 courses per semester (4-5 credits total)
- A "normal" course load is 4.5 credits (4.5 courses), not 12-18 credits
- Language and lab courses sometimes have 1.5 credits, but most courses are exactly 1 credit

STUDENT PREFERENCES:
- Desired courses/subjects: ${preferences.desiredCourses.join(', ')}
- Target course load: ${preferences.courseLoad} courses (${preferences.totalCredits} Yale credits)
- Major: ${preferences.major}
- Major requirements to fulfill: ${preferences.majorRequirements.join(', ')}
- Preferred course types: ${preferences.courseTypes.join(', ')}
- Time constraints:
  - Earliest start: ${preferences.timeConstraints.earliestStart}
  - Latest end: ${preferences.timeConstraints.latestEnd}
  - Unavailable times: ${JSON.stringify(preferences.timeConstraints.unavailableTimes)}
- Additional preferences: ${preferences.additionalPrefs}

AVAILABLE COURSES (JSON format):
${coursesJson}

TASK:
Generate 3 different optimal course schedules. For each schedule, select ${preferences.courseLoad} courses that total approximately ${preferences.totalCredits} Yale credits.

For each schedule, provide:
1. A list of CRNs (course registration numbers) to include
2. Total Yale credits (should be around ${preferences.totalCredits})
3. A brief explanation of why this schedule works well
4. Any potential concerns or trade-offs

Consider these factors:
- No time conflicts between courses
- Match student's interests and major requirements
- Respect time constraints
- Target ${preferences.courseLoad} courses total (most Yale courses = 1 credit each)
- Balance course difficulty and workload
- Consider course prerequisites if mentioned
- Use ONLY the CRNs from the provided course data

Respond in this exact JSON format:
{
  "schedules": [
    {
      "crns": ["12345", "67890", "54321", "11111"],
      "totalCredits": 4.0,
      "reasoning": "This schedule balances your interest in [subjects] with your [major] requirements. The timing works well with your preferences, and the workload is manageable.",
      "concerns": "Chemistry lab extends slightly past your preferred end time."
    }
  ]
}

CRITICAL: Use only CRNs that exist in the provided course data. Do not invent CRNs.
`
}

function parseScheduleResponse(response: string, availableCourses: Course[]): GeneratedSchedule[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.schedules || !Array.isArray(parsed.schedules)) {
      throw new Error('Invalid schedule format')
    }

    return parsed.schedules.map((schedule: any, index: number): GeneratedSchedule => {
      const scheduleCourses = schedule.crns
        .map((crn: string) => availableCourses.find(course => course.crn === crn))
        .filter((course: Course | undefined): course is Course => course !== undefined)

      const totalCredits = scheduleCourses.reduce((sum, course) => sum + course.credits, 0)

      return {
        id: `schedule-${index + 1}`,
        courses: scheduleCourses,
        totalCredits,
        conflicts: [], // Will be populated during validation
        reasoning: schedule.reasoning || 'AI-generated schedule based on your preferences.',
        score: 0, // Will be calculated during validation
      }
    })
  } catch (error) {
    console.error('Error parsing AI response:', error)

    // Fallback: create a simple schedule based on preferences
    return createFallbackSchedule(availableCourses)
  }
}

function createFallbackSchedule(availableCourses: Course[]): GeneratedSchedule[] {
  // Simple fallback that just picks the first few courses
  const fallbackCourses = availableCourses.slice(0, 4)
  const totalCredits = fallbackCourses.reduce((sum, course) => sum + course.credits, 0)

  return [
    {
      id: 'fallback-schedule',
      courses: fallbackCourses,
      totalCredits,
      conflicts: [],
      reasoning: 'Fallback schedule created when AI generation failed.',
      score: 50,
    },
  ]
}

function validateAndScoreSchedules(
  schedules: GeneratedSchedule[],
  preferences: UserPreferences
): GeneratedSchedule[] {
  return schedules.map(schedule => {
    const conflicts: string[] = []
    let score = 100

    // Check for time conflicts
    for (let i = 0; i < schedule.courses.length; i++) {
      for (let j = i + 1; j < schedule.courses.length; j++) {
        if (hasTimeConflict(schedule.courses[i], schedule.courses[j])) {
          conflicts.push(
            `Time conflict between ${schedule.courses[i].course_code} and ${schedule.courses[j].course_code}`
          )
          score -= 20
        }
      }
    }

    // Check credit load match
    const creditDiff = Math.abs(schedule.totalCredits - preferences.creditLoad)
    score -= creditDiff * 5

    // Check for desired course matches
    const desiredCourseMatches = schedule.courses.filter(course =>
      preferences.desiredCourses.some(desired =>
        course.title.toLowerCase().includes(desired.toLowerCase()) ||
        course.course_code.toLowerCase().includes(desired.toLowerCase()) ||
        course.description.toLowerCase().includes(desired.toLowerCase())
      )
    ).length

    score += desiredCourseMatches * 10

    return {
      ...schedule,
      conflicts,
      score: Math.max(0, score),
    }
  })
}