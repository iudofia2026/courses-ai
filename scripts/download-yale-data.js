const fs = require('fs')
const path = require('path')

// Generate semester codes from 2015 to 2025
function generateSemesterCodes() {
  const codes = []

  for (let year = 2015; year <= 2025; year++) {
    codes.push(`${year}01`) // Spring
    codes.push(`${year}02`) // Summer
    codes.push(`${year}03`) // Fall
  }

  return codes
}

async function downloadSemesterData(semesterCode) {
  const url = `https://api.coursetable.com/api/catalog/public/${semesterCode}`

  try {
    console.log(`Downloading ${semesterCode}...`)

    const response = await fetch(url)

    if (!response.ok) {
      console.log(`❌ ${semesterCode}: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Save to JSON file
    const filename = path.join(dataDir, `yale-courses-${semesterCode}.json`)
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))

    console.log(`✅ ${semesterCode}: ${data.length} courses saved to ${filename}`)
    return data.length

  } catch (error) {
    console.error(`❌ Error downloading ${semesterCode}:`, error.message)
    return null
  }
}

async function downloadAllData() {
  const semesterCodes = generateSemesterCodes()
  console.log(`Will download data for ${semesterCodes.length} semesters (2015-2025)`)

  let totalCourses = 0
  let successfulDownloads = 0

  for (const semester of semesterCodes) {
    const courseCount = await downloadSemesterData(semester)

    if (courseCount !== null) {
      totalCourses += courseCount
      successfulDownloads++
    }

    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\\n📊 Summary:`)
  console.log(`✅ Successfully downloaded: ${successfulDownloads}/${semesterCodes.length} semesters`)
  console.log(`📚 Total courses downloaded: ${totalCourses}`)

  // Create a manifest file
  const manifest = {
    downloadDate: new Date().toISOString(),
    semesters: semesterCodes.length,
    successfulDownloads,
    totalCourses,
    dataFiles: semesterCodes.map(code => `yale-courses-${code}.json`)
  }

  const manifestPath = path.join(__dirname, '..', 'data', 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`📄 Manifest saved to ${manifestPath}`)
}

// Run if called directly
if (require.main === module) {
  downloadAllData().catch(console.error)
}

module.exports = { downloadAllData, downloadSemesterData }