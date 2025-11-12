# Deployment Guide

🚀 **Complete guide for deploying the AI Course Scheduler to production environments**

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Production Deployment Options](#production-deployment-options)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [API Keys and External Services](#api-keys-and-external-services)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup Strategies](#backup-strategies)
9. [Platform-Specific Deployments](#platform-specific-deployments)
10. [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (optional, for caching)
- Git

### Quick Local Setup
```bash
# Clone the repository
git clone https://github.com/your-username/courses-ai.git
cd courses-ai

# Run the automated setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development servers
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Manual Local Setup

#### Backend Setup
```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
python main.py
```

#### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Production Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Frontend Deployment to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod

# Configure environment variables in Vercel dashboard:
# VITE_API_URL=https://your-backend.railway.app
```

#### Backend Deployment to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from backend directory
cd backend
railway init
railway up

# Configure environment variables in Railway dashboard:
# OPENAI_API_KEY=your_openai_api_key
# ENVIRONMENT=production
# CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

### Option 2: Netlify (Frontend) + Heroku (Backend)

#### Frontend Deployment to Netlify
```bash
# Build frontend for production
cd frontend
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist

# Or connect GitHub repository for automatic deployments
```

#### Backend Deployment to Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your_openai_api_key
heroku config:set ENVIRONMENT=production
heroku config:set CORS_ORIGINS=["https://your-frontend.netlify.app"]

# Deploy
git subtree push --prefix backend heroku main
```

### Option 3: DigitalOcean App Platform

```yaml
# .do/app.yaml for DigitalOcean
name: courses-ai
services:
- name: backend
  source_dir: backend
  github:
    repo: your-username/courses-ai
    branch: main
  run_command: python main.py
  environment_slug: python-3.11
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: OPENAI_API_KEY
    value: "${OPENAI_API_KEY}"
  - key: ENVIRONMENT
    value: "production"

- name: frontend
  source_dir: frontend
  github:
    repo: your-username/courses-ai
    branch: main
  build_command: npm run build
  run_command: npm run preview
  environment_slug: node-js-18
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: VITE_API_URL
    value: "${_self.URL}"
```

### Option 4: AWS Deployment

#### Using AWS ECS + CloudFront
```bash
# Build and push Docker images
docker build -t courses-ai-backend ./backend
docker build -t courses-ai-frontend ./frontend

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag courses-ai-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/courses-ai-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/courses-ai-backend:latest
```

## Environment Configuration

### Production Environment Variables

#### Backend (.env)
```bash
# Core Configuration
ENVIRONMENT=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.1
OPENAI_MAX_TOKENS=2000
OPENAI_TIMEOUT=30

# CORS Configuration (Update with your frontend domain)
CORS_ORIGINS=["https://your-domain.com", "https://www.your-domain.com"]

# CourseTable API
COURSETABLE_API_URL=https://graph.coursetable.com/api/v1/graphql
COURSETABLE_TIMEOUT=10
COURSETABLE_RETRIES=3

# Redis Configuration (Optional but recommended)
REDIS_URL=redis://your-redis-host:6379
REDIS_TTL=300

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Search Configuration
SEARCH_MAX_RESULTS=100
SEARCH_CACHE_ENABLED=true
SEARCH_CACHE_TTL=300
AI_SEARCH_ENABLED=true

# Schedule Generation
SCHEDULE_MAX_OPTIONS=20
SCHEDULE_TIMEOUT_SECONDS=30
SCHEDULE_QUALITY_THRESHOLD=50.0
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true

# Development Settings
VITE_DEV_MODE=false

# Analytics Configuration (Optional)
VITE_GA_TRACKING_ID=your_google_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn
```

## Database Setup

### Redis Setup (Recommended for production caching)

#### Option 1: Redis Cloud
```bash
# Sign up at https://redislabs.com/
# Get connection string and update REDIS_URL
REDIS_URL=redis://your-redis-cloud-host:port
```

#### Option 2: AWS ElastiCache
```bash
# Create ElastiCache Redis cluster
# Configure security groups
# Update REDIS_URL with endpoint
REDIS_URL=redis://your-elasticache-endpoint:6379
```

#### Option 3: Railway Redis
```bash
# Add Redis service in Railway dashboard
# Get connection URL and update environment variables
```

### Redis Connection Verification
```python
# Test Redis connection
import redis
from config import settings

if settings.redis_url:
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        print("Redis connection successful")
    except Exception as e:
        print(f"Redis connection failed: {e}")
```

## API Keys and External Services

### OpenAI API Setup
```bash
# Get API key from https://platform.openai.com/
# Add to environment variables:
OPENAI_API_KEY=sk-your-actual-api-key-here

# For production, consider:
# - Setting usage limits
# - Monitoring API costs
# - Using organization accounts
```

### Optional Services

#### Sentry for Error Tracking
```bash
# Backend
pip install sentry-sdk
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Frontend
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Google Analytics
```bash
# Frontend
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=GA-XXXXXXXXX
```

## SSL/HTTPS Setup

### Automatic SSL (Recommended)
Most hosting platforms provide automatic SSL certificates:
- **Vercel**: Automatic SSL for all deployments
- **Netlify**: Automatic SSL with Let's Encrypt
- **Railway**: Automatic SSL for web services
- **DigitalOcean**: Automatic SSL with App Platform

### Custom SSL Setup (If needed)
```bash
# Using Nginx reverse proxy
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Logging

### Backend Monitoring
```python
# Health check endpoint
GET /health

# Example response:
{
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0",
    "environment": "production",
    "components": {
        "coursetable_api": {"status": "healthy"},
        "ai_service": {"status": "healthy"},
        "redis_cache": {"status": "healthy"}
    }
}
```

### Log Analysis with Grafana/Loki
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
```

### Application Performance Monitoring
```bash
# Install monitoring dependencies
pip install prometheus-client

# Add metrics to your application
from prometheus_client import Counter, Histogram, start_http_server

REQUEST_COUNT = Counter('requests_total', 'Total requests')
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')
```

## Backup Strategies

### Environment Variables Backup
```bash
# Create backup script
#!/bin/bash
# backup-env.sh

echo "Creating backup of environment variables..."
mkdir -p backups
date=$(date +%Y%m%d_%H%M%S)

# Backup backend environment
cp backend/.env backups/backend_env_$date.env

# Backup frontend environment
cp frontend/.env backups/frontend_env_$date.env

echo "Backup completed: backups/"
```

### Database Backup (Redis)
```bash
# Redis backup script
#!/bin/bash
# backup-redis.sh

redis-cli --rdb /backups/redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

### Automated Backup with Cron
```bash
# Add to crontab
# Every day at 2 AM
0 2 * * * /path/to/backup-env.sh
0 2 * * * /path/to/backup-redis.sh
```

## Platform-Specific Deployments

### Vercel Deployment Checklist
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up custom domain
- [ ] Enable analytics
- [ ] Configure build settings
- [ ] Test deployment in preview environment

### Railway Deployment Checklist
- [ ] Configure environment variables
- [ ] Set up health checks
- [ ] Configure automatic deploys
- [ ] Set up custom domain
- [ ] Monitor resource usage

### DigitalOcean Checklist
- [ ] Configure app specifications
- [ ] Set up environment variables
- [ ] Configure health checks
- [ ] Set up autoscaling
- [ ] Configure alerts

### AWS Deployment Checklist
- [ ] Set up VPC and security groups
- [ ] Configure ECS clusters
- [ ] Set up load balancers
- [ ] Configure CloudFront CDN
- [ ] Set up CloudWatch alarms

## Troubleshooting Deployment Issues

### Common Problems and Solutions

#### 1. CORS Errors
```bash
# Symptoms: Browser shows CORS policy errors
# Solution: Update CORS_ORIGINS in backend .env
CORS_ORIGINS=["https://your-frontend-domain.com"]
```

#### 2. OpenAI API Errors
```bash
# Symptoms: AI search not working
# Solutions:
# - Check API key validity
# - Verify billing is active
# - Check rate limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### 3. Redis Connection Issues
```bash
# Symptoms: Cache not working, connection timeouts
# Solutions:
# - Verify Redis URL format
# - Check network connectivity
# - Verify authentication
redis-cli -u $REDIS_URL ping
```

#### 4. Frontend Build Errors
```bash
# Symptoms: Build fails with TypeScript errors
# Solutions:
npm run build --verbose
# Check for missing dependencies
npm install
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

#### 5. Backend Startup Issues
```bash
# Symptoms: Backend fails to start
# Solutions:
# - Check Python version (3.11+)
# - Verify all dependencies installed
# - Check environment variables
python -m pip install -r requirements.txt
python main.py
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "Checking application health..."

# Check backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is unhealthy"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is unhealthy"
fi

# Check Redis (if configured)
if [ ! -z "$REDIS_URL" ]; then
    if redis-cli -u $REDIS_URL ping > /dev/null 2>&1; then
        echo "✅ Redis is healthy"
    else
        echo "❌ Redis is unhealthy"
    fi
fi
```

### Performance Optimization

#### Backend Optimization
```python
# Add caching headers
from fastapi import Response

@app.get("/api/search/")
async def search_courses():
    response = Response()
    response.headers["Cache-Control"] = "public, max-age=300"
    return response
```

#### Frontend Optimization
```javascript
// Implement lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});
```

### Security Considerations

#### Backend Security
```python
# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/search/")
@limiter.limit("10/minute")
async def search_courses():
    pass
```

#### Frontend Security
```javascript
// Sanitize user inputs
import DOMPurify from 'dompurify';

const cleanInput = DOMPurify.sanitize(userInput);

// Use Content Security Policy headers
```

### Post-Deployment Verification

#### Automated Tests
```bash
# Run smoke tests after deployment
#!/bin/bash
# smoke-tests.sh

echo "Running post-deployment smoke tests..."

# Test API endpoints
curl -f $API_URL/health || exit 1
curl -f $API_URL/version || exit 1

# Test frontend load
curl -f $FRONTEND_URL || exit 1

echo "✅ All smoke tests passed"
```

#### Manual Verification Checklist
- [ ] Frontend loads properly
- [ ] Search functionality works
- [ ] Schedule generation works
- [ ] No JavaScript errors in console
- [ ] API calls are successful
- [ ] Mobile responsive design works
- [ ] Loading states display correctly
- [ ] Error handling works properly

---

## 🚀 Ready for Production

Follow this guide to successfully deploy your AI Course Scheduler to production. For additional support, check our [troubleshooting guide](docs/TROUBLESHOOTING.md) or open an issue on GitHub.