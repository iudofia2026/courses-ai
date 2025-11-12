const fs = require('fs')
const path = require('path')

/**
 * Validate data quality for LLM usage
 */
function validateDataQuality() {
  console.log('🔍 Validating Yale Course Data Quality for LLM Usage\n')

  const dataDir = path.join(__dirname, '..', 'data')
  const manifestPath = path.join(dataDir, 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest file not found!')
    return
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  console.log(`📊 Total Semesters: ${manifest.semesters}`)
  console.log(`📚 Total Courses: ${manifest.totalCourses.toLocaleString()}`)
  console.log(`💾 Download Date: ${new Date(manifest.downloadDate).toLocaleDateString()}\n`)

  // Sample analysis from recent semester
  const recentSemester = '202503' // Fall 2025
  const recentFile = path.join(dataDir, `yale-courses-${recentSemester}.json`)

  if (!fs.existsSync(recentFile)) {
    console.error(`❌ Recent semester file not found: ${recentSemester}`)
    return
  }

  const courses = JSON.parse(fs.readFileSync(recentFile, 'utf8'))
  console.log(`🔍 Analyzing ${recentSemester} (${courses.length} courses)...\n`)

  // Data quality metrics
  let stats = {
    total: courses.length,
    withMeetings: 0,
    withDescriptions: 0,
    withProfessors: 0,
    withCRN: 0,
    withCredits: 0,
    withAreas: 0,
    schools: new Set(),
    sampleCourses: []
  }

  courses.forEach((course, index) => {
    // Collect stats
    if (course.course_meetings && course.course_meetings.length > 0) stats.withMeetings++
    if (course.description && course.description.trim()) stats.withDescriptions++
    if (course.course_professors && course.course_professors.length > 0) stats.withProfessors++
    if (course.crn) stats.withCRN++
    if (course.credits && course.credits > 0) stats.withCredits++
    if (course.areas && course.areas.length > 0) stats.withAreas++
    if (course.school) stats.schools.add(course.school)

    // Collect sample courses for different subjects
    if (index < 10 ||
        course.course_code?.includes('CPSC') ||
        course.course_code?.includes('MATH') ||
        course.course_code?.includes('PHIL')) {
      stats.sampleCourses.push({
        code: course.course_code,
        title: course.title,
        crn: course.crn,
        credits: course.credits,
        meetings: course.course_meetings?.length || 0,
        hasDescription: Boolean(course.description?.trim()),
        professors: course.course_professors?.length || 0
      })
    }
  })

  // Print quality report
  console.log('📈 DATA QUALITY REPORT')
  console.log('=' .repeat(50))
  console.log(`✅ Courses with CRN: ${stats.withCRN.toLocaleString()} (${(stats.withCRN/stats.total*100).toFixed(1)}%)`)
  console.log(`✅ Courses with meetings: ${stats.withMeetings.toLocaleString()} (${(stats.withMeetings/stats.total*100).toFixed(1)}%)`)
  console.log(`✅ Courses with descriptions: ${stats.withDescriptions.toLocaleString()} (${(stats.withDescriptions/stats.total*100).toFixed(1)}%)`)
  console.log(`✅ Courses with professors: ${stats.withProfessors.toLocaleString()} (${(stats.withProfessors/stats.total*100).toFixed(1)}%)`)
  console.log(`✅ Courses with credits: ${stats.withCredits.toLocaleString()} (${(stats.withCredits/stats.total*100).toFixed(1)}%)`)
  console.log(`✅ Courses with areas: ${stats.withAreas.toLocaleString()} (${(stats.withAreas/stats.total*100).toFixed(1)}%)`)

  console.log(`\n🏫 Schools: ${Array.from(stats.schools).join(', ')}`)

  console.log('\n🔍 SAMPLE COURSES FOR LLM ANALYSIS')
  console.log('=' .repeat(50))
  stats.sampleCourses.slice(0, 5).forEach(course => {
    console.log(`📚 ${course.code}: ${course.title}`)
    console.log(`   CRN: ${course.crn || 'N/A'} | Credits: ${course.credits || 'N/A'} | Meetings: ${course.meetings} | Profs: ${course.professors}`)
    console.log(`   Has Description: ${course.hasDescription ? '✅' : '❌'}`)
    console.log('')
  })

  // LLM readiness assessment
  console.log('🤖 LLM READINESS ASSESSMENT')
  console.log('=' .repeat(50))

  const readiness = {
    searchable: stats.withDescriptions > stats.total * 0.8,
    schedulable: stats.withMeetings > stats.total * 0.6,
    mappable: stats.withCRN > stats.total * 0.9,
    credited: stats.withCredits > stats.total * 0.8,
    identified: stats.total > 3000
  }

  Object.entries(readiness).forEach(([key, value]) => {
    const label = {
      searchable: 'Text search capability',
      schedulable: 'Time scheduling capability',
      mappable: 'CRN mapping capability',
      credited: 'Credit calculation capability',
      identified: 'Sufficient data volume'
    }[key]

    console.log(`${value ? '✅' : '❌'} ${label}`)
  })

  const overallReady = Object.values(readiness).every(Boolean)
  console.log(`\n${overallReady ? '🎉' : '⚠️'} Overall LLM Readiness: ${overallReady ? 'READY' : 'NEEDS IMPROVEMENT'}`)

  if (!overallReady) {
    console.log('\n🔧 IMPROVEMENT RECOMMENDATIONS:')
    if (!readiness.searchable) console.log('- Improve description coverage')
    if (!readiness.schedulable) console.log('- Add more meeting time data')
    if (!readiness.mappable) console.log('- Ensure all courses have CRNs')
    if (!readiness.credited) console.log('- Validate credit hour data')
    if (!readiness.identified) console.log('- Expand course dataset')
  }

  console.log('\n📋 SUMMARY FOR README UPDATE:')
  console.log(`- Data Volume: ${stats.total.toLocaleString()} courses (${recentSemester})`)
  console.log(`- Searchability: ${(stats.withDescriptions/stats.total*100).toFixed(1)}% have descriptions`)
  console.log(`- Schedulability: ${(stats.withMeetings/stats.total*100).toFixed(1)}% have meeting times`)
  console.log(`- CRN Coverage: ${(stats.withCRN/stats.total*100).toFixed(1)}% have CRNs`)
  console.log(`- LLM Ready: ${overallReady ? 'YES' : 'NEEDS WORK'}`)
}

// Run if called directly
if (require.main === module) {
  validateDataQuality()
}

module.exports = { validateDataQuality }