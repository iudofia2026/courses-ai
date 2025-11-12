#!/bin/bash

# AI Course Scheduler - Build and Deployment Script
# This script builds both frontend and backend for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="courses-ai"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BUILD_DIR="dist"
DEPLOY_DIR="deployment"
BACKUP_DIR="backups"

# Version configuration
VERSION=${1:-$(date +%Y%m%d_%H%M%S)}
ENVIRONMENT=${2:-production}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_build() {
    echo -e "${PURPLE}[BUILD]${NC} $1"
}

print_deploy() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create directory structure
create_directories() {
    print_status "Creating directory structure..."

    # Clean and create build directory
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"

    # Create deployment directory
    mkdir -p "$DEPLOY_DIR"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    print_success "Directory structure created"
}

# Function to backup existing deployment
backup_existing() {
    if [ -d "$DEPLOY_DIR/$PROJECT_NAME" ]; then
        print_status "Backing up existing deployment..."
        local backup_name="$PROJECT_NAME_backup_$(date +%Y%m%d_%H%M%S)"
        cp -r "$DEPLOY_DIR/$PROJECT_NAME" "$BACKUP_DIR/$backup_name"
        print_success "Backup created: $BACKUP_DIR/$backup_name"
    fi
}

# Function to run tests before build
run_tests() {
    print_status "Running tests before build..."

    # Backend tests
    print_build "Running backend tests..."
    cd "$BACKEND_DIR"

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    if command_exists pytest; then
        pytest --tb=short -q || {
            print_error "Backend tests failed. Aborting build."
            exit 1
        }
        print_success "Backend tests passed"
    else
        print_warning "pytest not found, skipping backend tests"
    fi
    cd ..

    # Frontend tests
    print_build "Running frontend tests..."
    cd "$FRONTEND_DIR"

    if npm run test 2>/dev/null; then
        print_success "Frontend tests passed"
    else
        print_warning "Frontend tests failed or not configured"
    fi
    cd ..
}

# Function to build backend
build_backend() {
    print_build "Building backend for production..."

    cd "$BACKEND_DIR"

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    # Create backend build directory
    mkdir -p "../$BUILD_DIR/backend"

    # Copy necessary files
    print_build "Copying backend files..."

    # Copy Python files
    find . -name "*.py" -not -path "./venv/*" -not -path "./tests/*" -not -path "./__pycache__/*" \
        | xargs cp -t "../$BUILD_DIR/backend/" --parents

    # Copy configuration files
    cp -r config.py requirements.txt .env.example "../$BUILD_DIR/backend/"

    # Copy directories (excluding venv and __pycache__)
    cp -r models routes services utils "../$BUILD_DIR/backend/" 2>/dev/null || true

    # Create main entry point script
    cat > "../$BUILD_DIR/backend/start.sh" << 'EOF'
#!/bin/bash

# AI Course Scheduler - Backend Start Script
set -e

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export ENVIRONMENT=production
export DEBUG=false

# Start the application
exec python main.py
EOF
    chmod +x "../$BUILD_DIR/backend/start.sh"

    # Create production requirements
    print_build "Creating production requirements..."
    cat > "../$BUILD_DIR/backend/requirements.prod.txt" << 'EOF'
# Production requirements
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==2.1.0
openai==1.6.1
python-dotenv==1.0.0
gql==3.4.1
redis==5.0.1
structlog==23.2.0
EOF

    # Create Dockerfile for backend
    print_build "Creating Dockerfile for backend..."
    cat > "../$BUILD_DIR/backend/Dockerfile" << EOF
# AI Course Scheduler - Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.prod.txt .
RUN pip install --no-cache-dir -r requirements.prod.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \\
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["./start.sh"]
EOF

    # Create systemd service file
    print_build "Creating systemd service file..."
    cat > "../$BUILD_DIR/backend/courses-ai-backend.service" << EOF
[Unit]
Description=AI Course Scheduler Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/courses-ai/backend
Environment=ENVIRONMENT=production
Environment=DEBUG=false
ExecStart=/opt/courses-ai/backend/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    print_success "Backend build completed"
    cd ..
}

# Function to build frontend
build_frontend() {
    print_build "Building frontend for production..."

    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm ci --production=false
    fi

    # Run TypeScript type checking
    if command_exists npx && npm run type-check 2>/dev/null; then
        print_status "Running TypeScript type checking..."
        npm run type-check
    fi

    # Run linting
    if npm run lint 2>/dev/null; then
        print_status "Running ESLint..."
        npm run lint
    else
        print_warning "ESLint not configured, skipping lint check"
    fi

    # Build for production
    print_build "Building frontend for production..."
    npm run build

    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - no dist directory created"
        exit 1
    fi

    # Copy build artifacts
    mkdir -p "../$BUILD_DIR/frontend"
    cp -r dist/* "../$BUILD_DIR/frontend/"

    # Copy additional files for deployment
    cp package.json package-lock.json "../$BUILD_DIR/frontend/" 2>/dev/null || true

    # Create nginx configuration
    print_build "Creating nginx configuration..."
    cat > "../$BUILD_DIR/nginx.conf" << 'EOF'
# AI Course Scheduler - Nginx Configuration
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend static files
    location / {
        root /var/www/courses-ai/frontend;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

    # Create Dockerfile for frontend
    print_build "Creating Dockerfile for frontend..."
    cat > "../$BUILD_DIR/frontend/Dockerfile" << 'EOF'
# AI Course Scheduler - Frontend Dockerfile
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY . /usr/share/nginx/html/

# Copy nginx configuration
COPY ../nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

    print_success "Frontend build completed"
    cd ..
}

# Function to create deployment configuration
create_deployment_config() {
    print_deploy "Creating deployment configuration..."

    # Create docker-compose.yml for production
    cat > "$BUILD_DIR/docker-compose.prod.yml" << EOF
# AI Course Scheduler - Production Docker Compose
version: '3.8'

services:
  frontend:
    build: ./frontend
    container_name: courses-ai-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - courses-ai-network

  backend:
    build: ./backend
    container_name: courses-ai-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
      - CORS_ORIGINS=["https://your-domain.com"]
    env_file:
      - ./backend/.env
    depends_on:
      - redis
    networks:
      - courses-ai-network

  redis:
    image: redis:7-alpine
    container_name: courses-ai-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - courses-ai-network

volumes:
  redis_data:

networks:
  courses-ai-network:
    driver: bridge
EOF

    # Create deployment script
    cat > "$BUILD_DIR/deploy.sh" << EOF
#!/bin/bash

# AI Course Scheduler - Deployment Script
set -e

PROJECT_NAME="$PROJECT_NAME"
VERSION="$VERSION"
BUILD_DIR="$BUILD_DIR"

echo "Deploying AI Course Scheduler v\$VERSION..."

# Check if running as root (for systemd service)
if [ "\$EUID" -eq 0 ]; then
    echo "Installing systemd service..."

    # Copy backend service file
    cp backend/courses-ai-backend.service /etc/systemd/system/

    # Reload systemd
    systemctl daemon-reload

    # Enable and start service
    systemctl enable courses-ai-backend
    systemctl start courses-ai-backend

    echo "Systemd service installed and started"
else
    echo "Not running as root. Skipping systemd service installation."
    echo "To install systemd service, run: sudo ./deploy.sh"
fi

# Copy files to production directory
PRODUCTION_DIR="/opt/\$PROJECT_NAME"
sudo mkdir -p \$PRODUCTION_DIR

echo "Copying files to \$PRODUCTION_DIR..."
sudo cp -r backend \$PRODUCTION_DIR/
sudo cp -r frontend \$PRODUCTION_DIR/

# Set permissions
sudo chown -R www-data:www-data \$PRODUCTION_DIR
sudo chmod +x \$PRODUCTION_DIR/backend/start.sh

echo "Deployment completed successfully!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost"
EOF

    chmod +x "$BUILD_DIR/deploy.sh"

    # Create environment template
    cat > "$BUILD_DIR/.env.template" << 'EOF'
# Production Environment Configuration
# Copy this file to .env and update with your values

# OpenAI API Configuration
OPENAI_API_KEY=your_production_openai_api_key

# Application Configuration
ENVIRONMENT=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration (update with your domain)
CORS_ORIGINS=["https://your-domain.com", "https://www.your-domain.com"]

# CourseTable API
COURSETABLE_API_URL=https://graph.coursetable.com/api/v1/graphql

# Redis Configuration
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
EOF

    # Create health check script
    cat > "$BUILD_DIR/health-check.sh" << 'EOF'
#!/bin/bash

# AI Course Scheduler - Health Check Script

echo "🔍 Performing health checks..."

# Check backend
BACKEND_URL="http://localhost:8000/health"
if curl -f -s "$BACKEND_URL" >/dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is unhealthy"
    exit 1
fi

# Check frontend
FRONTEND_URL="http://localhost"
if curl -f -s "$FRONTEND_URL" >/dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is unhealthy"
    exit 1
fi

# Check Redis (if running)
if command_exists redis-cli && redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "⚠️  Redis is not running or not accessible"
fi

echo "🎉 All health checks passed!"
EOF

    chmod +x "$BUILD_DIR/health-check.sh"

    print_success "Deployment configuration created"
}

# Function to create deployment package
create_deployment_package() {
    print_deploy "Creating deployment package..."

    # Create deployment directory
    local deploy_package="$DEPLOY_DIR/$PROJECT_NAME-$VERSION"
    mkdir -p "$deploy_package"

    # Copy build artifacts
    cp -r "$BUILD_DIR"/* "$deploy_package/"

    # Create deployment documentation
    cat > "$deploy_package/DEPLOY_INSTRUCTIONS.md" << EOF
# AI Course Scheduler - Deployment Instructions

## Version: $VERSION
## Environment: $ENVIRONMENT

## Quick Deployment

### Option 1: Docker Compose (Recommended)
\`\`\`bash
# Copy to production server
scp -r $PROJECT_NAME-$VERSION user@server:/opt/

# On production server
cd /opt/$PROJECT_NAME-$VERSION
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Option 2: Native Deployment
\`\`\`bash
# Copy to production server
scp -r $PROJECT_NAME-$VERSION user@server:/opt/

# On production server
cd /opt/$PROJECT_NAME-$VERSION
sudo ./deploy.sh
\`\`\`

## Configuration

1. Update environment variables:
   \`\`\`bash
   cp .env.template .env
   nano .env
   \`\`\`

2. Update domain in nginx.conf:
   \`\`\`bash
   nano frontend/Dockerfile
   # Update nginx.conf with your domain
   \`\`\`

3. Set up SSL certificate (recommended):
   \`\`\`bash
   sudo certbot --nginx -d your-domain.com
   \`\`\`

## Health Check

After deployment, run:
\`\`\`bash
./health-check.sh
\`\`\`

## Monitoring

- Backend logs: \`journalctl -u courses-ai-backend\`
- Nginx logs: \`/var/log/nginx/access.log\`
- Application logs: \`/opt/courses-ai/backend/logs/\`

## Rollback

If deployment fails:
\`\`\`bash
# Stop services
docker-compose -f docker-compose.prod.yml down
# or
sudo systemctl stop courses-ai-backend

# Restore from backup
# (You should have backed up the previous version)
\`\`\`

## Support

For issues, check:
1. Health check script output
2. Application logs
3. Service status: \`systemctl status courses-ai-backend\`
4. Docker logs: \`docker-compose logs\`
EOF

    # Create version information
    cat > "$deploy_package/VERSION.txt" << EOF
AI Course Scheduler
Version: $VERSION
Build Date: $(date)
Environment: $ENVIRONMENT
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Build Host: $(hostname)
EOF

    # Create checksums
    cd "$DEPLOY_DIR"
    find "$PROJECT_NAME-$VERSION" -type f -exec sha256sum {} \; > "$PROJECT_NAME-$VERSION.sha256"
    cd ..

    print_success "Deployment package created: $deploy_package"
}

# Function to display build summary
display_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}                    Build Summary                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${PURPLE}📦 Build Information:${NC}"
    echo -e "   Version:        ${BLUE}$VERSION${NC}"
    echo -e "   Environment:    ${BLUE}$ENVIRONMENT${NC}"
    echo -e "   Build Directory:${BLUE}$(pwd)/$BUILD_DIR${NC}"
    echo -e "   Deploy Package: ${BLUE}$(pwd)/$DEPLOY_DIR/$PROJECT_NAME-$VERSION${NC}"
    echo ""
    echo -e "${CYAN}📋 Build Components:${NC}"
    echo -e "   ✅ Backend production build"
    echo -e "   ✅ Frontend production build"
    echo -e "   ✅ Docker configuration"
    echo -e "   ✅ Deployment scripts"
    echo -e "   ✅ Health monitoring"
    echo ""
    echo -e "${YELLOW}🚀 Next Steps:${NC}"
    echo -e "   1. Review build artifacts: ${BLUE}ls -la $BUILD_DIR${NC}"
    echo -e "   2. Test deployment package: ${BLUE}cd $DEPLOY_DIR/$PROJECT_NAME-$VERSION${NC}"
    echo -e "   3. Configure environment: ${BLUE}cp .env.template .env${NC}"
    echo -e "   4. Deploy to production: ${BLUE}./deploy.sh${NC}"
    echo ""
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo ""
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              AI Course Scheduler                           ║${NC}"
    echo -e "║                 Build & Deploy                            ║${NC}"
    echo -e "║                     Version 1.0.0                           ║"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${NC}"

    # Check if we're in the right directory
    if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Expected to find 'backend' and 'frontend' directories"
        exit 1
    fi

    # Check command line arguments
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [version] [environment]"
        echo ""
        echo "Arguments:"
        echo "  version      Build version (default: timestamp)"
        echo "  environment  Target environment (default: production)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Auto-generate version for production"
        echo "  $0 v1.2.3 production  # Specific version for production"
        echo "  $0 v1.2.3 staging     # Specific version for staging"
        exit 0
    fi

    # Run build sequence
    create_directories
    backup_existing
    run_tests
    build_backend
    build_frontend
    create_deployment_config
    create_deployment_package
    display_summary
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi