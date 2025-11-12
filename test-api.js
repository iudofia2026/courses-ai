// Test script to verify our schedule generation API works
async function testScheduleAPI() {
  const testPreferences = {
    desiredCourses: ["Computer Science", "Philosophy", "Math"],
    creditLoad: 15,
    timeConstraints: {
      earliestStart: "09:00",
      latestEnd: "17:00",
      unavailableTimes: []
    },
    major: "Computer Science",
    majorRequirements: ["algorithms", "data structures"],
    courseTypes: ["lecture", "seminar"],
    additionalPrefs: "I prefer smaller classes when possible"
  }

  try {
    console.log("Testing schedule generation API...")
    console.log("Request:", JSON.stringify(testPreferences, null, 2))

    const response = await fetch('http://localhost:3001/api/generate-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPreferences),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("API Response:", JSON.stringify(result, null, 2))

    if (result.success) {
      console.log(`✅ Success! Generated ${result.schedules.length} schedules`)
      console.log(`📊 Considered ${result.totalCoursesConsidered} courses`)

      result.schedules.forEach((schedule, index) => {
        console.log(`\\nSchedule ${index + 1}: ${schedule.totalCredits} credits`)
        console.log(`Score: ${schedule.score}`)
        console.log(`Courses: ${schedule.courses.map(c => c.course_code).join(', ')}`)
        console.log(`Reasoning: ${schedule.reasoning}`)
        if (schedule.conflicts.length > 0) {
          console.log(`Conflicts: ${schedule.conflicts.join(', ')}`)
        }
      })
    } else {
      console.error("❌ API returned error:", result.error)
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

// Run if called directly
if (require.main === module) {
  testScheduleAPI()
}