// Quick test script to check Yale course data
const fetch = require('node-fetch')

async function testYaleCourseData() {
  const currentSemester = '202503' // Fall 2025
  const url = `https://api.coursetable.com/api/catalog/public/${currentSemester}`

  console.log(`Testing Yale course data from: ${url}`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`)
      return
    }

    const courses = await response.json()
    console.log(`Found ${courses.length} courses`)

    // Show a sample course
    const sampleCourse = courses.find(course => course.course_meetings && course.course_meetings.length > 0)
    if (sampleCourse) {
      console.log('\nSample course:')
      console.log(`${sampleCourse.course_code}: ${sampleCourse.title}`)
      console.log(`Credits: ${sampleCourse.credits}`)
      console.log(`Meetings:`, sampleCourse.course_meetings)
    }

    // Count courses with meetings
    const withMeetings = courses.filter(course => course.course_meetings && course.course_meetings.length > 0)
    console.log(`${withMeetings.length} courses have scheduled meetings`)

  } catch (error) {
    console.error('Error fetching data:', error.message)
  }
}

testYaleCourseData()