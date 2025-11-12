# AI Course Scheduler

🎓 **AI-Powered Course Search and Scheduling Platform**

A comprehensive course discovery and scheduling application that leverages artificial intelligence to help students find optimal course combinations and generate conflict-free schedules. Built with modern web technologies and integrated with Yale University's CourseTable API.

## ✨ Features

### 🔍 **Smart Course Search**
- AI-powered natural language search using OpenAI GPT-4
- Advanced filtering by department, requirements, skills, and professors
- Semantic search that understands course content and relationships
- Real-time search suggestions and auto-completion

### 📅 **Intelligent Schedule Generation**
- Automated schedule optimization based on student preferences
- Conflict detection and resolution
- Multiple schedule options with quality scoring
- Time distribution and balance optimization

### 🎯 **Personalized Recommendations**
- Course recommendations based on academic interests
- Skill-based course matching
- Career path alignment suggestions
- Prerequisite tracking and planning

### 📊 **Comprehensive Course Information**
- Detailed course descriptions and syllabi
- Professor information and ratings
- Course requirements and prerequisites
- Class times, locations, and availability

### 🚀 **Modern Technology Stack**
- **Backend**: FastAPI with Python 3.11+
- **Frontend**: React 19 with TypeScript
- **AI/ML**: OpenAI GPT-4 API
- **Data Source**: Yale CourseTable GraphQL API
- **Styling**: Tailwind CSS
- **Development**: Vite, ESLint, Prettier

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  External APIs  │
│   (React + TS)  │◄──►│   (FastAPI)     │◄──►│  • CourseTable  │
│                 │    │                 │    │  • OpenAI API   │
│ • Search UI     │    │ • AI Service    │    │  • Redis Cache  │
│ • Schedule View │    │ • API Gateway   │    │                 │
│ • Filters       │    │ • Rate Limiting │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.11+
- **AI/ML**: OpenAI API (GPT-4 Turbo)
- **GraphQL**: gql 3.4.1
- **HTTP Client**: httpx 2.1.0
- **Validation**: Pydantic 2.5.0
- **Caching**: Redis 5.0.1
- **Logging**: structlog 23.2.0
- **Testing**: pytest 7.4.3

### Frontend
- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Bundler**: Vite 7.2.2
- **Styling**: Tailwind CSS 4.1.17
- **Routing**: React Router DOM 7.9.5
- **HTTP Client**: Axios 1.13.2
- **State Management**: TanStack Query 5.90.7
- **UI Components**: Headless UI 2.2.9, Heroicons 2.2.0

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/courses-ai.git
   cd courses-ai
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   # Copy example environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Update with your API keys and configuration
   # backend/.env
   OPENAI_API_KEY=your_openai_api_key_here
   ENVIRONMENT=development
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Start the Application**

   **Option 1: Using the development script**
   ```bash
   chmod +x scripts/start-dev.sh
   ./scripts/start-dev.sh
   ```

   **Option 2: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd backend
   source venv/bin/activate
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📝 Environment Variables

### Backend Environment (.env)
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# FastAPI Configuration
ENVIRONMENT=development
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]

# CourseTable API Configuration
COURSETABLE_API_URL=https://graph.coursetable.com/api/v1/graphql

# Optional: Redis Configuration
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

### Frontend Environment (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false

# Development Settings
VITE_DEV_MODE=true
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/ -v
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Integration Testing
```bash
# Run both backend and frontend tests
npm run test:all
```

## 📚 API Documentation

The API documentation is available at `http://localhost:8000/docs` when running the development server.

### Main Endpoints
- **GET /**: API information and status
- **GET /health**: Health check for all services
- **GET /api/search/**: Search courses with AI-powered filters
- **GET /api/schedules/**: Generate optimized schedules
- **POST /api/schedules/**: Create custom schedules

For detailed API documentation, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## 🚀 Deployment

### Development
- Use the provided development scripts for local development
- Hot reload enabled for both frontend and backend
- Debug mode with detailed error messages

### Production
- Frontend: Deploy to Vercel, Netlify, or any static hosting
- Backend: Deploy to Railway, Heroku, AWS, or DigitalOcean
- Database: Redis for caching (optional)
- Monitoring: Structured logging with JSON output

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/TypeScript
- Write comprehensive tests for new features
- Update documentation as needed

## 📋 Project Structure

```
courses-ai/
├── backend/                 # Python FastAPI backend
│   ├── models/             # Pydantic models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utilities
│   ├── main.py             # Application entry point
│   ├── config.py           # Configuration management
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── scripts/                # Utility scripts
│   ├── setup.sh           # Automated setup script
│   ├── start-dev.sh       # Development start script
│   └── build-deploy.sh    # Build and deployment script
├── docs/                   # Documentation
│   ├── SETUP.md           # Developer setup guide
│   ├── API_DOCUMENTATION.md  # API reference
│   └── TROUBLESHOOTING.md     # Common issues
├── docker-compose.yml      # Docker development environment
├── README.md              # This file
└── .gitignore             # Git ignore rules
```

## 🔧 Configuration

### Backend Configuration
The backend uses Pydantic Settings for configuration management. All settings can be overridden via environment variables. See `backend/config.py` for available options.

### Frontend Configuration
Frontend configuration is handled through Vite environment variables. All variables must be prefixed with `VITE_` to be exposed to the browser.

## 🐛 Troubleshooting

### Common Issues
1. **OpenAI API Key Not Found**: Make sure your `.env` file is properly configured
2. **CORS Errors**: Check that your frontend URL is in the CORS origins list
3. **Redis Connection Failed**: Redis is optional - the app will work without it
4. **Port Conflicts**: Change the API_HOST or API_PORT in your environment

For more troubleshooting tips, see [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Yale University** - CourseTable API for course data
- **OpenAI** - GPT-4 API for AI-powered search and recommendations
- **FastAPI** - Modern, fast web framework for building APIs
- **React** - JavaScript library for building user interfaces

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/courses-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/courses-ai/discussions)
- **Email**: support@courses-ai.example.com

---

## 🎯 Future Roadmap

### Upcoming Features
- [ ] User authentication and personal accounts
- [ ] Course ratings and reviews system
- [ ] Advanced schedule visualization
- [ ] Mobile application (React Native)
- [ ] Integration with other universities' course catalogs
- [ ] AI-powered career path recommendations
- [ ] Real-time collaboration features
- [ ] Offline mode support

### Technical Improvements
- [ ] GraphQL API for frontend
- [ ] WebSocket support for real-time updates
- [ ] Advanced caching strategies
- [ ] Performance monitoring and analytics
- [ ] Automated testing in CI/CD
- [ ] Container orchestration with Kubernetes

---

**Built with ❤️ for students everywhere**