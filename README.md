# Yale Schedule Builder 🎓

An AI-powered schedule builder for Yale students that creates optimized class schedules based on personal preferences, major requirements, and Yale's unique course system.

## 🎯 Project Vision

**The Problem**: Yale students spend hours manually building schedules, trying to balance course interests, major requirements, time preferences, and avoiding conflicts. With 3,000+ courses available each semester, finding the optimal combination is overwhelming.

**Our Solution**: An intelligent chat-based interface that understands Yale's unique academic system and uses AI to generate multiple optimized schedule options tailored to each student's needs.

## 🚀 What We're Building

### Core User Experience
1. **Conversational Input**: Students describe their preferences through natural chat
   - "I need to take Computer Science courses and fulfill my Writing requirement"
   - "I can't have classes before 10 AM or after 4 PM"
   - "I'm a CS major and need 4 courses this semester"

2. **Intelligent Processing**: AI analyzes preferences against Yale's course catalog
   - Understands Yale's unique 1-credit-per-course system (4-5 courses = normal load)
   - Considers major requirements and distribution requirements
   - Respects time constraints and prevents scheduling conflicts

3. **Optimized Results**: Multiple schedule options with clear explanations
   - 3-5 different schedule combinations
   - Reasoning for each recommendation
   - Conflict detection and alternative suggestions

### Key Features We Want
- **Yale-Specific**: Built for Yale's unique credit system and academic calendar
- **Smart Search**: Finds courses across subjects, professors, and requirements
- **Conflict Prevention**: Automatic time conflict detection
- **Requirement Tracking**: Helps fulfill major and distribution requirements
- **Export Options**: Calendar integration and printable formats
- **Mobile Friendly**: Works seamlessly on phones and tablets

## 🎓 Understanding Yale's System

**Credits**: Most courses = 1 credit (not semester hours like other schools)
- Normal load: 4-5 courses (4-5.5 credits total)
- Language/intensive courses: 1.5 credits
- Students need 36 credits total to graduate

**Semesters**: Fall, Spring, Summer with unique course codes
- Format: CPSC 201, MATH 120, etc.
- Each course has a CRN (Course Registration Number)

**Requirements**: Complex major requirements + distributional requirements

## 🛠️ Technical Approach

### Architecture
- **Frontend**: Next.js with React for the chat interface
- **AI**: Google Gemini for natural language understanding and schedule optimization
- **Data**: Yale's public CourseTable API (3,000+ courses per semester)
- **Deployment**: Vercel for easy hosting and updates

### Data Sources
- **Yale CourseTable API**: `https://api.coursetable.com/api/catalog/public/{semester}`
- **Course Evaluations**: Student reviews and ratings
- **Prerequisites**: Course dependency mapping
- **Historical Data**: Multi-semester availability patterns

## 🎯 Success Metrics

A successful Yale Schedule Builder will:
1. Generate valid, conflict-free schedules in under 30 seconds
2. Understand natural language preferences without complex forms
3. Produce schedules that students actually want to register for
4. Save students hours of manual schedule planning
5. Help students discover relevant courses they might have missed

## 🚦 Getting Started

This project is starting fresh with a clear vision. The next steps are:

1. **MVP Development**: Chat interface + basic AI integration
2. **Yale Integration**: Course data fetching and parsing
3. **Schedule Generation**: Core algorithm development
4. **User Testing**: Feedback from Yale students
5. **Polish & Deploy**: Production-ready application

## 🤝 Contributing

This project is designed to help Yale students and the broader Yale community. Contributions welcome for:
- Yale-specific features and requirements
- AI prompt optimization
- User interface improvements
- Performance enhancements
- Testing and feedback

---

**Goal**: Make course planning effortless for every Yale student 🐾
