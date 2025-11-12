# Yale Schedule Builder 🎓

An AI-powered schedule builder for Yale students that uses comprehensive course data and Google Gemini AI to create optimized class schedules based on personal preferences and requirements.

## 🚀 What This Project Does

This application helps Yale students build their perfect academic schedule by:

- **Conversational Interface**: Chat-based UI to collect your preferences, major requirements, time constraints, and course interests
- **Comprehensive Data**: Access to 83,830+ Yale courses from 2015-2025 (33 semesters of data)
- **AI-Powered Optimization**: Google Gemini AI analyzes your requirements and generates multiple optimized schedule options
- **Smart Conflict Detection**: Automatically detects time conflicts and prerequisite issues
- **Historical Analysis**: Searches across recent semesters to find course patterns and availability

## 📊 Current Status

### ✅ **Working Features (MVP Complete)**
- Next.js + TypeScript application with Tailwind CSS
- Interactive chat interface for preference collection
- Complete Yale course database (2015-2025) with local caching
- Google Gemini 2.0 Flash AI integration
- API endpoint that successfully generates 3 schedule options
- Course search across multiple semesters
- Basic conflict detection and scoring

### 🔧 **Known Issues (Actively Being Fixed)**
- Course parsing logic returns 0 credits (AI mentions courses but doesn't map to actual data)
- AI prompt needs refinement to return valid Yale CRNs
- Search precision could be improved

### 🏗️ **In Development Pipeline**
See our [GitHub Issues](https://github.com/iudofia2026/courses-ai/issues) for the complete roadmap, including:
- Enhanced schedule visualization
- PDF/calendar export functionality
- Prerequisites validation
- Advanced filtering (professor, building, time preferences)
- Mobile responsiveness
- Production deployment

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash API
- **Data**: Local JSON cache (83,830 courses)
- **API**: Yale CourseTable public API
- **Deployment**: Vercel-ready

## 📝 Data Sources

This project utilizes Yale's public course data from:
- **Primary**: [CourseTable API](https://api.coursetable.com/api/catalog/public/)
- **Coverage**: Spring 2015 - Fall 2025 (33 semesters)
- **Volume**: 83,830 total course records
- **Update Frequency**: Data can be refreshed via included download scripts

### Data Quality Status
- ✅ **Downloaded**: All historical data successfully cached locally (83,830 courses)
- ✅ **Structured**: Properly parsed course meetings, times, professors, descriptions
- ✅ **Searchable**: 96.3% of courses have full descriptions for search
- ✅ **Schedulable**: 73.2% of courses have meeting times and locations
- ⚠️ **CRN Mapping**: Need to fix field mapping (data uses `primary_crn` and nested `listings[].course_code`)
- ⚠️ **LLM Integration**: AI responses need better mapping to actual course data structure

## 🚀 Quick Start

1. **Clone and Install**:
   ```bash
   git clone https://github.com/iudofia2026/courses-ai.git
   cd courses-ai
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   # Add your Google Gemini API key to .env.local
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3001`

4. **Test API Directly**:
   ```bash
   node test-api.js
   ```

## 🎯 User Flow

1. **Chat Interface**: Tell the AI about your course interests, credit load, major, and time preferences
2. **AI Processing**: Gemini analyzes 83k+ Yale courses to understand your requirements
3. **Schedule Generation**: Receive 3 optimized schedule options with explanations
4. **Review & Refine**: Compare schedules with conflict detection and reasoning

## 🗂️ Project Structure

```
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   │   └── ChatInterface.tsx
│   ├── lib/                # Core logic
│   │   ├── ai-scheduler.ts     # Gemini AI integration
│   │   ├── course-fetcher.ts   # Course data access
│   │   └── data-manager.ts     # Local data caching
│   └── types/              # TypeScript definitions
│       └── course.ts
├── data/                   # Course data cache (83k courses)
├── scripts/                # Data management utilities
└── test-api.js            # API testing script
```

## 🤝 Contributing

1. Check our [Issues](https://github.com/iudofia2026/courses-ai/issues) for current priorities
2. Critical fixes needed: Course parsing (#5), AI prompt refinement (#6), search precision (#7)
3. All issues are labeled with difficulty and importance levels

## 📄 License

MIT License - feel free to use this for academic or personal projects.

## 🙏 Acknowledgments

- **Yale CourseTable**: For providing the comprehensive course API
- **Google Gemini**: For powerful AI capabilities
- **Yale Students**: The intended users who inspired this project

---

*Built with ❤️ for the Yale community. Current status: Functional MVP with active development.*
