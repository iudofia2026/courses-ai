# Developer Setup Guide

🛠️ **Step-by-step guide for setting up the AI Course Scheduler development environment**

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Operating System Setup](#operating-system-setup)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Installation](#project-installation)
5. [IDE Configuration](#ide-configuration)
6. [Git Workflow](#git-workflow)
7. [Running Tests](#running-tests)
8. [Debugging Setup](#debugging-setup)
9. [Common Development Tasks](#common-development-tasks)
10. [Troubleshooting Development Issues](#troubleshooting-development-issues)

## System Requirements

### Minimum Requirements
- **RAM**: 8GB (16GB recommended)
- **Storage**: 5GB free disk space
- **Processor**: 64-bit processor with 2+ cores
- **Internet**: Stable connection for API calls

### Required Software

#### Python
- **Version**: Python 3.11 or higher
- **Package Manager**: pip (included with Python)
- **Virtual Environment**: venv (included with Python)

#### Node.js
- **Version**: Node.js 18.0 or higher
- **Package Manager**: npm 9.0 or higher
- **Alternative**: yarn 1.22 or higher

#### Optional but Recommended
- **Git**: 2.30 or higher
- **Docker**: 20.10 or higher (for containerized development)
- **Redis**: 6.0 or higher (for caching)

## Operating System Setup

### macOS

#### Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Python 3.11+
```bash
# Install Python 3.11
brew install python@3.11

# Verify installation
python3.11 --version
```

#### Install Node.js
```bash
# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

#### Install Git
```bash
# Install Git
brew install git

# Configure Git (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Install Redis (optional)
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis
```

### Windows

#### Install Python 3.11+
1. Download from [python.org](https://www.python.org/downloads/windows/)
2. Run the installer and check "Add Python to PATH"
3. Verify installation:
```powershell
python --version
pip --version
```

#### Install Node.js
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify installation:
```powershell
node --version
npm --version
```

#### Install Git for Windows
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer with recommended settings
3. Configure Git:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Install WSL2 (recommended for better development experience)
```powershell
# Enable WSL
wsl --install

# After restart, install Ubuntu from Microsoft Store
```

### Linux (Ubuntu/Debian)

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Python 3.11+
```bash
# Add deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3.11-dev

# Verify installation
python3.11 --version
```

#### Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Verify installation
node --version
npm --version
```

#### Install Git
```bash
sudo apt install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Install Redis (optional)
```bash
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Development Environment Setup

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-username/courses-ai.git
cd courses-ai

# Verify the repository structure
ls -la
```

### 2. Automated Setup (Recommended)
```bash
# Make the setup script executable
chmod +x scripts/setup.sh

# Run the automated setup
./scripts/setup.sh
```

### 3. Manual Setup

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python main.py --help
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install

# Verify installation
npm run --version
```

### 4. Environment Configuration

#### Backend Environment
```bash
# Copy example environment file
cd backend
cp .env.example .env

# Edit .env with your configuration
nano .env
# or use your preferred editor
```

**Required Environment Variables:**
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
```

#### Frontend Environment
```bash
# Copy example environment file
cd ../frontend
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```bash
# API Configuration
VITE_API_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false

# Development Settings
VITE_DEV_MODE=true
```

## IDE Configuration

### Visual Studio Code

#### Recommended Extensions
Install these extensions from the VS Code marketplace:

1. **Python Extension Pack** (ms-python.python)
   - Python IntelliSense
   - Linting (pylint, flake8)
   - Debugging
   - Jupyter Notebook support

2. **JavaScript/TypeScript Extension Pack** (ms-vscode.vscode-typescript-next)
   - TypeScript IntelliSense
   - ESLint integration
   - Prettier formatter

3. **ESLint** (dbaeumer.vscode-eslint)
4. **Prettier** (esbenp.prettier-vscode)
5. **GitLens** (eamodio.gitlens)
6. **Docker** (ms-azuretools.vscode-docker)
7. **Thunder Client** (rangav.vscode-thunder-client) - for API testing

#### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/node_modules": true,
    "**/venv": true,
    "**/.git": true,
    "**/.DS_Store": true
  }
}
```

#### Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/main.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

### PyCharm

#### Project Setup
1. Open the project directory
2. Configure Python interpreter:
   - File → Settings → Project → Python Interpreter
   - Add existing interpreter: `backend/venv/bin/python`

#### Code Style
1. Configure Black formatter:
   - Settings → Tools → External Tools → Black
   - Add Black with path to executable

#### Run Configuration
1. Create FastAPI run configuration:
   - Script path: `backend/main.py`
   - Python interpreter: `backend/venv/bin/python`
   - Working directory: `backend/`

### Vim/Neovim

#### Configuration
```vim
" vimrc or init.vim

" Python configuration
let g:python3_host_prog = '/path/to/project/backend/venv/bin/python3'

" TypeScript/JavaScript configuration
autocmd FileType typescript,typescriptreact setlocal ts=2 sts=2 sw=2 expandtab

" LSP configuration (using nvim-lsp)
lua << EOF
require'lspconfig'.pyright.setup{}
require'lspconfig'.tsserver.setup{}
EOF
```

## Git Workflow

### Branching Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches
feature/search-improvements
feature/schedule-optimization
bugfix/cors-issues
hotfix/security-patch
```

### Daily Workflow
```bash
# 1. Update your local repository
git fetch origin
git checkout develop
git pull origin develop

# 2. Create a new feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# ... work on your feature ...

# 4. Commit your changes
git add .
git commit -m "feat: add AI-powered course search"

# 5. Push to remote
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
```

### Commit Message Format
Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): implement AI-powered course search

Add natural language processing for course discovery using OpenAI API.
The new search understands user intent and provides relevant results.

Closes #123
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        files: backend/

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        files: backend/

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        files: backend/

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.34.0
    hooks:
      - id: eslint
        files: frontend/
        additional_dependencies:
          - eslint@8.34.0
          - "@typescript-eslint/eslint-plugin@5.52.0"
          - "@typescript-eslint/parser@5.52.0"
```

## Running Tests

### Backend Testing
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_search.py

# Run with verbose output
pytest -v

# Run with specific markers
pytest -m "unit"
pytest -m "integration"
```

#### Backend Test Configuration
Create `backend/pytest.ini`:
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --tb=short
    --strict-markers
    --disable-warnings
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests
```

### Frontend Testing
```bash
# Navigate to frontend directory
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for specific file
npm test -- CourseSearch.test.tsx
```

### End-to-End Testing
```bash
# Install Playwright (if not already installed)
npm install -g @playwright/test

# Run E2E tests
npx playwright test

# Run tests with UI
npx playwright test --ui
```

### Integration Testing
```bash
# Run both backend and frontend tests
npm run test:all

# Or use the development script
./scripts/test-all.sh
```

## Debugging Setup

### Backend Debugging

#### VS Code Debugging
1. Set breakpoints in your code
2. Press F5 or use the Debug panel
3. Use the "Python: FastAPI" configuration

#### Console Debugging
```python
import pdb

# Set breakpoints
pdb.set_trace()

# Or use ipdb (better experience)
pip install ipdb
import ipdb; ipdb.set_trace()
```

#### Logging Configuration
The backend uses structured logging with `structlog`. Configure logging levels in `.env`:
```bash
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Frontend Debugging

#### Browser DevTools
1. Open Developer Tools (F12)
2. Use Console tab for JavaScript debugging
3. Use Network tab for API debugging
4. Use React DevTools extension for React debugging

#### VS Code Debugging
Install the "JavaScript Debugger" extension and create `launch.json` configuration:
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome against localhost",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/frontend/src"
}
```

### API Debugging

#### Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create collections for API requests
3. Save environment variables for different environments

#### Using curl
```bash
# Debug API requests
curl -v -X GET "http://localhost:8000/api/search/?q=test" \
     -H "Accept: application/json"
```

#### Using Postman
1. Import API collection from `docs/postman_collection.json`
2. Configure environment variables
3. Save request examples for documentation

## Common Development Tasks

### Adding New API Endpoints

#### Backend
1. Create Pydantic models in `backend/models/`
2. Implement business logic in `backend/services/`
3. Add routes in `backend/routes/`
4. Add tests in `backend/tests/`
5. Update API documentation

```python
# Example: backend/routes/example.py
from fastapi import APIRouter, Depends
from models.example import ExampleRequest, ExampleResponse
from services.example_service import ExampleService

router = APIRouter(prefix="/example", tags=["example"])

@router.post("/", response_model=ExampleResponse)
async def example_endpoint(request: ExampleRequest):
    service = ExampleService()
    return await service.process_request(request)
```

#### Frontend
1. Define TypeScript types in `frontend/src/types/`
2. Create API service in `frontend/src/services/`
3. Create React hooks in `frontend/src/hooks/`
4. Build UI components in `frontend/src/components/`

```typescript
// Example: frontend/src/services/exampleService.ts
import axios from 'axios';
import { ExampleRequest, ExampleResponse } from '../types/example';

export class ExampleService {
  static async createExample(request: ExampleRequest): Promise<ExampleResponse> {
    const response = await axios.post('/api/example/', request);
    return response.data;
  }
}
```

### Adding New UI Components

#### Component Structure
```
frontend/src/components/
├── common/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
├── search/
│   ├── SearchForm/
│   └── SearchResults/
└── layout/
    ├── Header/
    └── Footer/
```

#### Component Template
```typescript
// frontend/src/components/example/Example.tsx
import React from 'react';
import styles from './Example.module.css';

interface ExampleProps {
  title: string;
  onAction: () => void;
}

export const Example: React.FC<ExampleProps> = ({ title, onAction }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <button onClick={onAction} className={styles.button}>
        Action
      </button>
    </div>
  );
};

export default Example;
```

### Database Migrations (if using database)
```bash
# Install Alembic (if using SQLAlchemy)
pip install alembic

# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Create users table"

# Apply migrations
alembic upgrade head
```

### Performance Optimization

#### Backend
```python
# Add caching
from functools import lru_cache

@lru_cache(maxsize=128)
async def get_course_data(course_id: str):
    # Cache expensive operations
    pass

# Add rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/search/")
@limiter.limit("10/minute")
async def search_courses():
    pass
```

#### Frontend
```typescript
// Implement React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  // handle click
}, [dependency]);
```

## Troubleshooting Development Issues

### Common Backend Issues

#### Python Virtual Environment Issues
```bash
# Symptoms: Module not found errors
# Solution: Ensure venv is activated
which python
# Should show: /path/to/project/backend/venv/bin/python

# Recreate venv if needed
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Dependency Conflicts
```bash
# Symptoms: Installation errors, version conflicts
# Solution: Clean install
pip uninstall -r requirements.txt -y
pip install --upgrade pip
pip install -r requirements.txt

# Or use pip-tools for dependency resolution
pip install pip-tools
pip-compile requirements.in
```

#### Port Conflicts
```bash
# Symptoms: "Address already in use" error
# Solution: Find and kill process or change port
lsof -i :8000
kill -9 <PID>

# Or change port in .env
API_PORT=8001
```

### Common Frontend Issues

#### Node Modules Issues
```bash
# Symptoms: Build errors, dependency conflicts
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
```

#### TypeScript Errors
```bash
# Symptoms: Type errors, compilation failures
# Solution: Check TypeScript configuration
npx tsc --noEmit

# Update types if needed
npm update
```

#### CORS Issues
```bash
# Symptoms: Browser CORS errors
# Solution: Check backend CORS configuration
# In backend/.env:
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### Development Environment Issues

#### Docker Issues (if using)
```bash
# Clean up Docker resources
docker system prune -a
docker volume prune

# Rebuild containers
docker-compose down
docker-compose up --build
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Start Redis service
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Performance Issues

#### Slow Development Server
```bash
# Backend: Enable hot reload
export FASTAPI_ENV=development

# Frontend: Enable fast refresh
# Vite automatically enables this in development
```

#### Memory Issues
```bash
# Check memory usage
htop  # Linux/macOS
tasklist  # Windows

# Restart services if memory is high
./scripts/restart-dev.sh
```

---

## 🎯 Development Best Practices

1. **Always run tests before committing**
2. **Follow the established code style and patterns**
3. **Write meaningful commit messages**
4. **Update documentation when making changes**
5. **Use environment variables for configuration**
6. **Implement proper error handling**
7. **Add logging for debugging**
8. **Keep dependencies up to date**
9. **Use meaningful variable and function names**
10. **Write tests for new features**

Your development environment is now ready! Check our [troubleshooting guide](TROUBLESHOOTING.md) for common issues and solutions.