# Troubleshooting Guide

🔧 **Comprehensive troubleshooting guide for the AI Course Scheduler**

## Table of Contents
1. [Common Issues](#common-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [API and Integration Issues](#api-and-integration-issues)
5. [Development Environment Issues](#development-environment-issues)
6. [Docker Issues](#docker-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)
9. [Database Issues](#database-issues)
10. [Security Issues](#security-issues)
11. [FAQ](#faq)
12. [Getting Help](#getting-help)

## Common Issues

### Quick Checklist
Before diving into specific issues, run through this quick checklist:

```bash
# 1. Check if all services are running
./scripts/health-check.sh

# 2. Verify environment variables
cat backend/.env
cat frontend/.env

# 3. Check logs
tail -f logs/backend.log
tail -f logs/frontend.log

# 4. Test API connectivity
curl http://localhost:8000/health
```

### Application Won't Start

**Symptoms:**
- Frontend or backend servers fail to start
- Port already in use errors
- Connection refused errors

**Solutions:**

1. **Check for port conflicts:**
```bash
# Find processes using ports 8000 and 5173
lsof -i :8000
lsof -i :5173

# Kill conflicting processes
kill -9 <PID>
```

2. **Use the start script with cleanup:**
```bash
./scripts/start-dev.sh
# This automatically handles port conflicts
```

3. **Check environment files:**
```bash
# Ensure .env files exist and are properly configured
ls -la backend/.env frontend/.env
```

### CORS Errors

**Symptoms:**
- Browser shows CORS policy errors
- API requests blocked by browser

**Solutions:**

1. **Update CORS configuration in backend/.env:**
```bash
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
```

2. **Check if frontend URL is included:**
```bash
# Make sure your frontend URL is in the allowed origins
# If using different port, add it to CORS_ORIGINS
```

3. **Verify API URL in frontend/.env:**
```bash
VITE_API_URL=http://localhost:8000
```

## Backend Issues

### Python Environment Issues

**Symptoms:**
- Module not found errors
- Python version conflicts
- Virtual environment problems

**Solutions:**

1. **Recreate virtual environment:**
```bash
cd backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Check Python version:**
```bash
python3 --version  # Should be 3.11+
```

3. **Verify dependencies:**
```bash
pip list
# Check that all required packages are installed
```

### OpenAI API Issues

**Symptoms:**
- AI search not working
- OpenAI API errors
- Rate limiting errors

**Solutions:**

1. **Verify API key:**
```bash
# Check if API key is set in backend/.env
grep OPENAI_API_KEY backend/.env
```

2. **Test API key:**
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

3. **Check billing and usage:**
- Visit [OpenAI Dashboard](https://platform.openai.com/account/usage)
- Verify billing is active
- Check usage limits

4. **Handle rate limits:**
```bash
# Update rate limiting in backend/.env
AI_MAX_CONCURRENT_REQUESTS=5
AI_SERVICE_TIMEOUT=60
```

### CourseTable API Issues

**Symptoms:**
- Course data not loading
- GraphQL errors
- Connection timeouts

**Solutions:**

1. **Test CourseTable API:**
```bash
curl -X POST https://graph.coursetable.com/api/v1/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
```

2. **Check network connectivity:**
```bash
ping graph.coursetable.com
```

3. **Update API configuration:**
```bash
# In backend/.env
COURSETABLE_TIMEOUT=30
COURSETABLE_RETRIES=5
```

### Redis Connection Issues

**Symptoms:**
- Cache not working
- Connection timeouts
- Performance issues

**Solutions:**

1. **Check if Redis is running:**
```bash
redis-cli ping
# Should return "PONG"
```

2. **Start Redis service:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

3. **Verify Redis URL:**
```bash
# Check backend/.env
REDIS_URL=redis://localhost:6379
```

4. **Test Redis connection from Python:**
```python
# In backend directory
python -c "import redis; r=redis.from_url('redis://localhost:6379'); print(r.ping())"
```

### Database Connection Issues (if using PostgreSQL)

**Symptoms:**
- Database connection errors
- Migration failures
- Data persistence issues

**Solutions:**

1. **Check PostgreSQL service:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

2. **Test connection:**
```bash
psql -h localhost -U courses_user -d courses_ai
```

3. **Verify connection string:**
```bash
# In backend/.env
DATABASE_URL=postgresql://courses_user:password@localhost:5432/courses_ai
```

## Frontend Issues

### Node.js and npm Issues

**Symptoms:**
- Module installation failures
- Version conflicts
- Build errors

**Solutions:**

1. **Clean node modules:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node.js version:**
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

3. **Clear npm cache:**
```bash
npm cache clean --force
```

### Build Failures

**Symptoms:**
- TypeScript compilation errors
- Vite build failures
- Missing dependencies

**Solutions:**

1. **Check for TypeScript errors:**
```bash
npm run type-check
```

2. **Run linting:**
```bash
npm run lint
```

3. **Check environment variables:**
```bash
cat frontend/.env
# Verify all required variables are set
```

### Development Server Issues

**Symptoms:**
- Vite dev server won't start
- Hot reload not working
- Proxy errors

**Solutions:**

1. **Check Vite configuration:**
```bash
cat vite.config.ts
# Verify proxy settings and configuration
```

2. **Clear Vite cache:**
```bash
rm -rf .vite
npm run dev
```

3. **Check port availability:**
```bash
lsof -i :5173
# Kill process if port is in use
```

### State Management Issues

**Symptoms:**
- Component state not updating
- API calls not working
- Query caching issues

**Solutions:**

1. **Clear React Query cache:**
```javascript
// In browser console
localStorage.clear();
```

2. **Check API calls in Network tab:**
- Open Developer Tools
- Go to Network tab
- Reload page and check for failed requests

3. **Verify query configuration:**
```javascript
// Check useQuery usage
const { data, error, isLoading } = useQuery({
  queryKey: ['courses', query],
  queryFn: () => searchCourses(query),
  retry: 3,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## API and Integration Issues

### API Request Failures

**Symptoms:**
- HTTP 4xx/5xx errors
- Timeout errors
- Malformed responses

**Solutions:**

1. **Test API endpoints directly:**
```bash
# Health check
curl http://localhost:8000/health

# Search endpoint
curl "http://localhost:8000/api/search/?q=test&limit=5"
```

2. **Check request format:**
```bash
curl -X POST http://localhost:8000/api/schedules/generate/ \
     -H "Content-Type: application/json" \
     -d '{"courses": ["CPSC-201-01"]}'
```

3. **Monitor logs:**
```bash
tail -f logs/backend.log
# Look for error messages and stack traces
```

### Authentication Issues

**Symptoms:**
- 401 Unauthorized errors
- Authentication middleware blocking requests
- JWT token issues

**Solutions:**

1. **Check authentication configuration:**
```bash
# In backend/.env
JWT_AUTH_ENABLED=false  # Set to false if not using auth
API_KEY_AUTH_ENABLED=false
```

2. **Verify CORS headers:**
```bash
curl -I http://localhost:8000/api/search/
# Check for proper CORS headers
```

### Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests errors
- API calls being blocked
- Throttling behavior

**Solutions:**

1. **Adjust rate limiting:**
```bash
# In backend/.env
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_ENABLED=false  # Temporarily disable for testing
```

2. **Check current limits:**
```bash
curl -I http://localhost:8000/api/search/
# Look for X-RateLimit headers
```

## Development Environment Issues

### Git Issues

**Symptoms:**
- Git commands failing
- Branch conflicts
- Permission issues

**Solutions:**

1. **Check Git configuration:**
```bash
git config --list
git remote -v
```

2. **Resolve merge conflicts:**
```bash
git status
git pull origin main
# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
```

3. **Reset to clean state:**
```bash
git clean -fd
git reset --hard HEAD
```

### IDE Configuration Issues

**Symptoms:**
- Intellisense not working
- Linting errors
- Debugging not working

**Solutions:**

1. **VS Code:**
```bash
# Install recommended extensions
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension dbaeumer.vscode-eslint
```

2. **Check workspace settings:**
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Environment Variable Issues

**Symptoms:**
- Configuration not loading
- Missing API keys
- Incorrect settings

**Solutions:**

1. **Verify environment files:**
```bash
# Check that .env files exist and are readable
ls -la backend/.env frontend/.env
cat backend/.env | head -n 20
```

2. **Test variable loading:**
```python
# In backend
python -c "from config import settings; print(f'API key set: {bool(settings.openai_api_key)}')"
```

3. **Check for syntax errors:**
```bash
# Look for malformed lines
grep -n "=" backend/.env | grep -v "#"
```

## Docker Issues

### Container Build Failures

**Symptoms:**
- Docker build errors
- Missing dependencies
- Permission denied errors

**Solutions:**

1. **Check Dockerfile syntax:**
```bash
cd backend
docker build -t courses-ai-backend .
# Look for build errors
```

2. **Clear Docker cache:**
```bash
docker system prune -a
docker builder prune -a
```

3. **Check base images:**
```bash
docker pull python:3.11-slim
docker pull node:18-alpine
```

### Container Runtime Issues

**Symptoms:**
- Containers not starting
- Health checks failing
- Port binding issues

**Solutions:**

1. **Check container status:**
```bash
docker ps -a
# Look for exited containers
```

2. **View container logs:**
```bash
docker logs courses-ai-backend
docker logs courses-ai-frontend
```

3. **Debug with interactive shell:**
```bash
docker run -it courses-ai-backend /bin/bash
```

### Docker Compose Issues

**Symptoms:**
- Services not starting
- Network connection issues
- Volume mounting problems

**Solutions:**

1. **Check service dependencies:**
```bash
docker-compose config
# Verify configuration is valid
```

2. **Start services individually:**
```bash
docker-compose up redis
# Start dependent services first
```

3. **Recreate all services:**
```bash
docker-compose down -v
docker-compose up --build
```

## Performance Issues

### Slow API Responses

**Symptoms:**
- High response times
- Timeouts
- Poor user experience

**Solutions:**

1. **Enable Redis caching:**
```bash
# In backend/.env
REDIS_URL=redis://localhost:6379
SEARCH_CACHE_ENABLED=true
RESPONSE_CACHE_ENABLED=true
```

2. **Monitor performance:**
```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:8000/api/search/?q=test
```

3. **Optimize database queries:**
```python
# Add indexes, use query optimization
# Check query execution plans
```

### Memory Issues

**Symptoms:**
- High memory usage
- Out of memory errors
- System slowdowns

**Solutions:**

1. **Monitor memory usage:**
```bash
# Check process memory
top
ps aux --sort=-%mem | head -n 10
```

2. **Configure Python memory limits:**
```bash
# In backend/.env
# Adjust worker processes
MAX_POOL_SIZE=50
```

3. **Enable memory profiling:**
```python
# Add memory profiling to identify leaks
import tracemalloc
tracemalloc.start()
```

### Frontend Performance Issues

**Symptoms:**
- Slow page loads
- Large bundle sizes
- Poor rendering performance

**Solutions:**

1. **Analyze bundle size:**
```bash
npm run build -- --analyze
# Look for large bundles
```

2. **Enable code splitting:**
```javascript
// Use dynamic imports
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

3. **Optimize React rendering:**
```javascript
// Use React.memo and useMemo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});
```

## Deployment Issues

### Build Failures

**Symptoms:**
- Production build errors
- Missing dependencies
- Configuration issues

**Solutions:**

1. **Test build locally:**
```bash
./scripts/build-deploy.sh
# Check for build errors
```

2. **Check environment variables:**
```bash
# Verify production environment
grep -E "(ENVIRONMENT|DEBUG)" backend/.env
```

3. **Run tests before build:**
```bash
npm run test
pytest
```

### Production Server Issues

**Symptoms:**
- Application not accessible
- 500 server errors
- SSL certificate issues

**Solutions:**

1. **Check server status:**
```bash
# Systemd service
sudo systemctl status courses-ai-backend

# Nginx status
sudo systemctl status nginx
```

2. **Check logs:**
```bash
# Application logs
sudo journalctl -u courses-ai-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

3. **Test health endpoint:**
```bash
curl http://your-domain.com/health
```

### SSL/HTTPS Issues

**Symptoms:**
- HTTPS not working
- Certificate errors
- Mixed content warnings

**Solutions:**

1. **Install SSL certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

2. **Check Nginx configuration:**
```bash
sudo nginx -t
# Test configuration syntax
```

3. **Update frontend URLs:**
```bash
# In frontend/.env
VITE_API_URL=https://your-domain.com
```

## Database Issues

### Connection Issues

**Symptoms:**
- Database connection refused
- Connection timeouts
- Authentication errors

**Solutions:**

1. **Check database service:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

2. **Test connection:**
```bash
psql -h localhost -U courses_user -d courses_ai
```

3. **Check connection string:**
```bash
# In backend/.env
DATABASE_URL=postgresql://courses_user:password@localhost:5432/courses_ai
```

### Migration Issues

**Symptoms:**
- Migration failures
- Schema conflicts
- Data loss issues

**Solutions:**

1. **Check migration status:**
```bash
alembic current
alembic history
```

2. **Create new migration:**
```bash
alembic revision --autogenerate -m "Description"
```

3. **Apply migrations:**
```bash
alembic upgrade head
```

### Performance Issues

**Symptoms:**
- Slow queries
- High CPU usage
- Lock contention

**Solutions:**

1. **Analyze slow queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_stat_statements_reset();
```

2. **Add indexes:**
```sql
-- Add missing indexes
CREATE INDEX idx_courses_department ON courses(department);
```

3. **Monitor connections:**
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;
```

## Security Issues

### CORS Misconfiguration

**Symptoms:**
- Security warnings
- Unauthorized access
- Cross-origin attacks

**Solutions:**

1. **Review CORS configuration:**
```bash
# In backend/.env
CORS_ORIGINS=["https://your-allowed-domains.com"]
CORS_ALLOW_CREDENTIALS=false  # If not needed
```

2. **Test CORS headers:**
```bash
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS http://localhost:8000/api/search/
```

### API Key Exposure

**Symptoms:**
- API keys in client-side code
- Exposed sensitive information
- Unauthorized API usage

**Solutions:**

1. **Check for exposed keys:**
```bash
# Search for API keys in code
grep -r "sk-" .
grep -r "API_KEY" .
```

2. **Use environment variables:**
```bash
# Never commit API keys
# Use .env files and .gitignore
```

3. **Rotate compromised keys:**
- Go to service dashboards
- Generate new API keys
- Update environment variables

### Injection Vulnerabilities

**Symptoms:**
- SQL injection risks
- XSS vulnerabilities
- Command injection

**Solutions:**

1. **Use parameterized queries:**
```python
# Never use string formatting for SQL
cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
```

2. **Sanitize user input:**
```python
# Validate and sanitize all input
from pydantic import BaseModel

class SearchQuery(BaseModel):
    query: str = Field(..., max_length=1000, regex=r'^[a-zA-Z0-9\s]+$')
```

3. **Enable security headers:**
```python
# Add security middleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)
```

## FAQ

### General Questions

**Q: How do I reset the entire development environment?**
A: Run the setup script to reset everything:
```bash
./scripts/setup.sh
```

**Q: Where can I find application logs?**
A: Logs are stored in the `logs/` directory:
```bash
ls -la logs/
tail -f logs/backend.log
tail -f logs/frontend.log
```

**Q: How do I update dependencies?**
A: Backend:
```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```
Frontend:
```bash
cd frontend
npm update
```

**Q: Can I run the application without Redis?**
A: Yes, Redis is optional. The application will work without caching.

**Q: How do I add a new API endpoint?**
A: Follow these steps:
1. Create Pydantic models in `backend/models/`
2. Add business logic in `backend/services/`
3. Create routes in `backend/routes/`
4. Add tests in `backend/tests/`

### Configuration Questions

**Q: How do I change the port numbers?**
A: Update environment variables:
```bash
# Backend port
API_PORT=8001

# Frontend port (update vite.config.ts)
```

**Q: How do I configure multiple environments?**
A: Create separate .env files:
```bash
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
```

**Q: How do I disable AI features?**
A: Set in backend/.env:
```bash
AI_SEARCH_ENABLED=false
OPENAI_API_KEY=
```

### Development Questions

**Q: How do I debug the backend?**
A: Use VS Code debugging or pdb:
```python
import pdb; pdb.set_trace()
```

**Q: How do I run tests?**
A: Run all tests:
```bash
./scripts/test-all.sh
```

**Q: How do I contribute to the project?**
A: See the Contributing section in README.md or run:
```bash
git checkout -b feature/your-feature-name
# Make changes
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Create pull request
```

## Getting Help

### Debug Mode Checklist

1. **Enable debug logging:**
```bash
# backend/.env
LOG_LEVEL=DEBUG
DEBUG=true

# frontend/.env
VITE_DEBUG=true
```

2. **Check system resources:**
```bash
df -h  # Disk space
free -h  # Memory
top  # CPU usage
```

3. **Network diagnostics:**
```bash
# Check ports
netstat -tulpn | grep :8000
netstat -tulpn | grep :5173

# Test connectivity
curl -v http://localhost:8000/health
```

### Log Analysis

**Backend logs:**
```bash
# Real-time monitoring
tail -f logs/backend.log

# Search for errors
grep -i error logs/backend.log

# Filter by timestamp
grep "2024-01-01" logs/backend.log
```

**Frontend logs:**
- Browser Developer Tools Console
- Network tab for API calls
- React DevTools for component state

### Community Support

1. **GitHub Issues:**
   - Search existing issues
   - Create new issue with detailed information
   - Include logs and environment details

2. **Documentation:**
   - Check this troubleshooting guide
   - Review API documentation
   - Read setup instructions

3. **Debug Information Collection:**
```bash
# Create debug report
echo "=== System Information ===" > debug_report.txt
uname -a >> debug_report.txt
echo "=== Python Version ===" >> debug_report.txt
python --version >> debug_report.txt
echo "=== Node Version ===" >> debug_report.txt
node --version >> debug_report.txt
echo "=== Environment Variables ===" >> debug_report.txt
env | grep -E "(OPENAI|API|ENV)" >> debug_report.txt
```

### When to Ask for Help

- You've tried all troubleshooting steps
- Error messages are unclear
- Performance issues persist
- Security concerns arise

**Include in your help request:**
- Operating system and version
- Steps to reproduce the issue
- Error messages and logs
- What you've already tried
- Expected vs actual behavior

---

## 🚀 Quick Fix Commands

```bash
# Reset everything
./scripts/setup.sh

# Restart services
./scripts/start-dev.sh

# Check health
./scripts/health-check.sh

# Run tests
./scripts/test-all.sh

# Clear caches
rm -rf .vite node_modules backend/venv
./scripts/setup.sh
```

This troubleshooting guide covers the most common issues you'll encounter while developing and deploying the AI Course Scheduler. For additional support, please check our GitHub repository or create an issue.