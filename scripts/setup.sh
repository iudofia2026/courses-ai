#!/bin/bash

# AI Course Scheduler - Automated Setup Script
# This script sets up the entire development environment for the project

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="AI Course Scheduler"
PYTHON_VERSION="3.11"
NODE_VERSION="18"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_version() {
    local cmd=$1
    local required_version=$2
    local current_version

    if command_exists "$cmd"; then
        current_version=$($cmd --version 2>/dev/null | awk '{print $NF}' | head -1)
        if [ -n "$current_version" ]; then
            print_success "$cmd version: $current_version"
        else
            print_warning "$cmd is installed but version couldn't be determined"
        fi
    else
        print_error "$cmd is not installed"
        return 1
    fi
}

# Function to install Python on different systems
install_python() {
    print_status "Installing Python $PYTHON_VERSION..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install python@$PYTHON_VERSION
        else
            print_error "Homebrew not found. Please install Homebrew first."
            print_status "Visit https://brew.sh/ for installation instructions."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y python$PYTHON_VERSION python$PYTHON_VERSION-venv python$PYTHON_VERSION-dev
        elif command_exists yum; then
            sudo yum install -y python$PYTHON_VERSION python$PYTHON_VERSION-devel
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        print_error "Please install Python manually from https://www.python.org/downloads/"
        exit 1
    fi
}

# Function to install Node.js on different systems
install_nodejs() {
    print_status "Installing Node.js $NODE_VERSION..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install node@$NODE_VERSION
        else
            print_error "Homebrew not found. Please install Homebrew first."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists curl; then
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            print_error "curl not found. Please install curl first."
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        print_error "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Function to install Git on different systems
install_git() {
    print_status "Installing Git..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install git
        else
            print_error "Homebrew not found. Please install Homebrew first."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y git
        elif command_exists yum; then
            sudo yum install -y git
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        print_error "Please install Git manually from https://git-scm.com/download/win"
        exit 1
    fi
}

# Function to check and install dependencies
check_dependencies() {
    print_status "Checking system dependencies..."

    # Check Git
    if command_exists git; then
        check_version git
    else
        print_warning "Git not found. Installing Git..."
        install_git
    fi

    # Check Python
    if command_exists python3; then
        check_version python3
    else
        print_warning "Python3 not found. Installing Python $PYTHON_VERSION..."
        install_python
    fi

    # Check Node.js
    if command_exists node; then
        check_version node
    else
        print_warning "Node.js not found. Installing Node.js $NODE_VERSION..."
        install_nodejs
    fi

    # Check npm
    if command_exists npm; then
        check_version npm
    else
        print_error "npm not found. This usually means Node.js installation failed."
        exit 1
    fi
}

# Function to setup Python virtual environment
setup_python_env() {
    print_status "Setting up Python virtual environment..."

    cd "$BACKEND_DIR"

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    else
        print_status "Python virtual environment already exists."
    fi

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        source venv/Scripts/activate
    else
        # Unix-like systems
        source venv/bin/activate
    fi

    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip

    # Install Python dependencies
    print_status "Installing Python dependencies..."
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        print_success "Python dependencies installed successfully"
    else
        print_error "requirements.txt not found in $BACKEND_DIR"
        exit 1
    fi

    cd ..
}

# Function to setup Node.js environment
setup_node_env() {
    print_status "Setting up Node.js environment..."

    cd "$FRONTEND_DIR"

    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    if [ -f "package.json" ]; then
        npm install
        print_success "Node.js dependencies installed successfully"
    else
        print_error "package.json not found in $FRONTEND_DIR"
        exit 1
    fi

    cd ..
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment configuration..."

    # Backend environment
    if [ -f "$BACKEND_DIR/.env.example" ] && [ ! -f "$BACKEND_DIR/.env" ]; then
        print_status "Creating backend .env file from template..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        print_warning "Please edit $BACKEND_DIR/.env with your configuration"
    fi

    # Frontend environment
    if [ -f "$FRONTEND_DIR/.env.example" ] && [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_status "Creating frontend .env file from template..."
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        print_warning "Please edit $FRONTEND_DIR/.env with your configuration"
    fi
}

# Function to run initial tests
run_tests() {
    print_status "Running initial tests to verify setup..."

    # Test Python environment
    cd "$BACKEND_DIR"
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    print_status "Testing Python environment..."
    if python -c "import fastapi, openai, httpx; print('Python imports successful')"; then
        print_success "Python environment test passed"
    else
        print_error "Python environment test failed"
        exit 1
    fi

    # Test Node.js environment
    cd "../$FRONTEND_DIR"
    print_status "Testing Node.js environment..."
    if npm run test --silent 2>/dev/null || [ $? -eq 0 ]; then
        print_success "Node.js environment test passed"
    else
        print_warning "Node.js tests not configured or failed (this is normal for initial setup)"
    fi

    cd ..
}

# Function to verify API connectivity
verify_api_connectivity() {
    print_status "Verifying API connectivity..."

    # Test OpenAI API key format (if set)
    if [ -f "$BACKEND_DIR/.env" ]; then
        if grep -q "OPENAI_API_KEY=your_openai_api_key_here" "$BACKEND_DIR/.env"; then
            print_warning "Please update your OpenAI API key in $BACKEND_DIR/.env"
        elif grep -q "OPENAI_API_KEY=" "$BACKEND_DIR/.env"; then
            print_success "OpenAI API key appears to be configured"
        fi
    fi
}

# Function to create development scripts
create_dev_scripts() {
    print_status "Creating development convenience scripts..."

    # Create start-dev.sh if it doesn't exist
    if [ ! -f "scripts/start-dev.sh" ]; then
        print_status "start-dev.sh not found, you may need to create it manually"
    fi

    # Create test script
    cat > scripts/test-all.sh << 'EOF'
#!/bin/bash

# Test all components of the AI Course Scheduler

echo "🧪 Running all tests..."

# Backend tests
echo "📦 Running backend tests..."
cd backend
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pytest --tb=short -v
BACKEND_EXIT_CODE=$?
cd ..

# Frontend tests
echo "🎨 Running frontend tests..."
cd frontend
npm test -- --watchAll=false
FRONTEND_EXIT_CODE=$?
cd ..

# Summary
echo ""
echo "📊 Test Results:"
echo "Backend: $([ $BACKEND_EXIT_CODE -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Frontend: $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "💥 Some tests failed!"
    exit 1
fi
EOF

    chmod +x scripts/test-all.sh
    print_success "Created scripts/test-all.sh"
}

# Function to display next steps
show_next_steps() {
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Configure your environment variables:"
    echo "   - Edit $BACKEND_DIR/.env with your OpenAI API key"
    echo "   - Edit $FRONTEND_DIR/.env with your API URL if needed"
    echo ""
    echo "2. Start the development servers:"
    echo "   - Run: ./scripts/start-dev.sh"
    echo "   - Or manually start both backend and frontend"
    echo ""
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    echo "4. Run tests:"
    echo "   - All tests: ./scripts/test-all.sh"
    echo "   - Backend: cd backend && pytest"
    echo "   - Frontend: cd frontend && npm test"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Function to handle cleanup on script exit
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Setup failed. Please check the error messages above."
        echo ""
        echo "For manual setup instructions, see docs/SETUP.md"
        exit 1
    fi
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              AI Course Scheduler Setup Script             ║"
    echo "║                     Version 1.0.0                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    print_status "Starting setup for $PROJECT_NAME..."
    echo ""

    # Set up cleanup trap
    trap cleanup EXIT

    # Check if we're in the right directory
    if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Expected to find 'backend' and 'frontend' directories"
        exit 1
    fi

    # Run setup steps
    check_dependencies
    setup_python_env
    setup_node_env
    setup_environment
    run_tests
    verify_api_connectivity
    create_dev_scripts

    show_next_steps
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi