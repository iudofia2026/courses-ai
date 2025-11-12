#!/bin/bash

# AI Course Scheduler - Development Startup Script
# This script starts both backend and frontend development servers

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
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PORT=8000
FRONTEND_PORT=5173
BACKEND_HOST="127.0.0.1"
FRONTEND_HOST="localhost"

# PID files for tracking processes
BACKEND_PID_FILE=".backend_dev.pid"
FRONTEND_PID_FILE=".frontend_dev.pid"

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

print_server() {
    echo -e "${PURPLE}[SERVER]${NC} $1"
}

print_frontend() {
    echo -e "${CYAN}[FRONTEND]${NC} $1"
}

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    local host=$2
    if command_exists lsof; then
        lsof -i :"$port" >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep ":$port " >/dev/null 2>&1
    else
        return 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill existing processes
cleanup_processes() {
    print_status "Cleaning up existing processes..."

    # Kill backend process if running
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p "$backend_pid" > /dev/null 2>&1; then
            print_status "Stopping existing backend server (PID: $backend_pid)..."
            kill "$backend_pid" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            ps -p "$backend_pid" > /dev/null 2>&1 && kill -9 "$backend_pid" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # Kill frontend process if running
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$frontend_pid" > /dev/null 2>&1; then
            print_status "Stopping existing frontend server (PID: $frontend_pid)..."
            kill "$frontend_pid" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            ps -p "$frontend_pid" > /dev/null 2>&1 && kill -9 "$frontend_pid" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    # Kill any processes using the ports
    if command_exists lsof; then
        # Kill backend port users
        local backend_pids=$(lsof -t -i:"$BACKEND_PORT" 2>/dev/null || true)
        if [ -n "$backend_pids" ]; then
            print_status "Killing processes using backend port $BACKEND_PORT..."
            echo "$backend_pids" | xargs kill -9 2>/dev/null || true
        fi

        # Kill frontend port users
        local frontend_pids=$(lsof -t -i:"$FRONTEND_PORT" 2>/dev/null || true)
        if [ -n "$frontend_pids" ]; then
            print_status "Killing processes using frontend port $FRONTEND_PORT..."
            echo "$frontend_pids" | xargs kill -9 2>/dev/null || true
        fi
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Expected to find 'backend' and 'frontend' directories"
        exit 1
    fi

    # Check Python virtual environment
    cd "$BACKEND_DIR"
    if [ ! -d "venv" ]; then
        print_error "Python virtual environment not found"
        print_error "Please run './scripts/setup.sh' first"
        exit 1
    fi

    # Check if requirements are installed
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    if ! python -c "import fastapi" 2>/dev/null; then
        print_error "Python dependencies not installed"
        print_error "Please run './scripts/setup.sh' first"
        exit 1
    fi
    cd ..

    # Check Node.js dependencies
    cd "$FRONTEND_DIR"
    if [ ! -d "node_modules" ]; then
        print_error "Node.js dependencies not installed"
        print_error "Please run './scripts/setup.sh' first"
        exit 1
    fi
    cd ..

    # Check environment files
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_warning "Backend .env file not found"
        print_status "Creating from template..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env" 2>/dev/null || true
    fi

    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_warning "Frontend .env file not found"
        print_status "Creating from template..."
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env" 2>/dev/null || true
    fi
}

# Function to start backend server
start_backend() {
    print_server "Starting backend development server..."

    cd "$BACKEND_DIR"

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    # Start the backend server in background
    print_server "Starting FastAPI server on $BACKEND_HOST:$BACKEND_PORT"
    python main.py > ../logs/backend.log 2>&1 &
    local backend_pid=$!

    # Save PID
    echo "$backend_pid" > "../$BACKEND_PID_FILE"

    # Wait a moment and check if server started successfully
    sleep 3

    if ps -p "$backend_pid" > /dev/null 2>&1; then
        print_success "Backend server started successfully (PID: $backend_pid)"
        print_server "Backend URL: http://$BACKEND_HOST:$BACKEND_PORT"
        print_server "API Docs: http://$BACKEND_HOST:$BACKEND_PORT/docs"
    else
        print_error "Backend server failed to start"
        if [ -f "../logs/backend.log" ]; then
            print_error "Backend logs:"
            tail -n 20 "../logs/backend.log"
        fi
        exit 1
    fi

    cd ..
}

# Function to start frontend server
start_frontend() {
    print_frontend "Starting frontend development server..."

    cd "$FRONTEND_DIR"

    # Start the frontend development server in background
    print_frontend "Starting Vite dev server on $FRONTEND_HOST:$FRONTEND_PORT"
    npm run dev > ../logs/frontend.log 2>&1 &
    local frontend_pid=$!

    # Save PID
    echo "$frontend_pid" > "../$FRONTEND_PID_FILE"

    # Wait a moment and check if server started successfully
    sleep 5

    if ps -p "$frontend_pid" > /dev/null 2>&1; then
        print_success "Frontend server started successfully (PID: $frontend_pid)"
        print_frontend "Frontend URL: http://$FRONTEND_HOST:$FRONTEND_PORT"
    else
        print_error "Frontend server failed to start"
        if [ -f "../logs/frontend.log" ]; then
            print_error "Frontend logs:"
            tail -n 20 "../logs/frontend.log"
        fi
        exit 1
    fi

    cd ..
}

# Function to wait for servers to be ready
wait_for_servers() {
    print_status "Waiting for servers to be ready..."

    # Wait for backend
    local backend_ready=false
    for i in {1..30}; do
        if curl -s "http://$BACKEND_HOST:$BACKEND_PORT/health" >/dev/null 2>&1; then
            backend_ready=true
            break
        fi
        sleep 1
    done

    if [ "$backend_ready" = true ]; then
        print_success "Backend server is ready"
    else
        print_warning "Backend server might not be fully ready yet"
    fi

    # Wait for frontend
    local frontend_ready=false
    for i in {1..30}; do
        if curl -s "http://$FRONTEND_HOST:$FRONTEND_PORT" >/dev/null 2>&1; then
            frontend_ready=true
            break
        fi
        sleep 1
    done

    if [ "$frontend_ready" = true ]; then
        print_success "Frontend server is ready"
    else
        print_warning "Frontend server might not be fully ready yet"
    fi
}

# Function to display server information
display_info() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Development Servers                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${PURPLE}🐍 Backend Server:${NC}"
    echo -e "   URL:        ${BLUE}http://$BACKEND_HOST:$BACKEND_PORT${NC}"
    echo -e "   API Docs:   ${BLUE}http://$BACKEND_HOST:$BACKEND_PORT/docs${NC}"
    echo -e "   Health:     ${BLUE}http://$BACKEND_HOST:$BACKEND_PORT/health${NC}"
    echo -e "   Logs:       ${BLUE}logs/backend.log${NC}"
    echo ""
    echo -e "${CYAN}⚛️  Frontend Server:${NC}"
    echo -e "   URL:        ${BLUE}http://$FRONTEND_HOST:$FRONTEND_PORT${NC}"
    echo -e "   Logs:       ${BLUE}logs/frontend.log${NC}"
    echo ""
    echo -e "${YELLOW}📋 Useful Commands:${NC}"
    echo -e "   View logs:  ${BLUE}tail -f logs/backend.log${NC}"
    echo -e "   View logs:  ${BLUE}tail -f logs/frontend.log${NC}"
    echo -e "   Stop all:   ${BLUE}./scripts/stop-dev.sh${NC}"
    echo -e "   Restart:    ${BLUE}./scripts/start-dev.sh${NC}"
    echo ""
    echo -e "${GREEN}🎉 Development environment is ready!${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        print_status "Created logs directory"
    fi
}

# Function to handle script interruption
handle_interrupt() {
    print_status "\nReceived interrupt signal, stopping servers..."
    cleanup_processes
    print_success "All servers stopped"
    exit 0
}

# Function to start servers in foreground with monitoring
start_with_monitoring() {
    print_status "Starting servers with monitoring..."

    # Start backend
    start_backend
    local backend_pid=$(cat "$BACKEND_PID_FILE")

    # Start frontend
    start_frontend
    local frontend_pid=$(cat "$FRONTEND_PID_FILE")

    # Wait for servers
    wait_for_servers

    # Display information
    display_info

    # Monitor servers
    print_status "Monitoring servers (Press Ctrl+C to stop)..."

    while true; do
        # Check if backend is still running
        if ! ps -p "$backend_pid" > /dev/null 2>&1; then
            print_error "Backend server has stopped unexpectedly"
            break
        fi

        # Check if frontend is still running
        if ! ps -p "$frontend_pid" > /dev/null 2>&1; then
            print_error "Frontend server has stopped unexpectedly"
            break
        fi

        sleep 5
    done

    cleanup_processes
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              AI Course Scheduler Development                ║"
    echo "║                     Startup Script                          ║"
    echo "║                     Version 1.0.0                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Set up interrupt handling
    trap handle_interrupt INT TERM

    # Check command line arguments
    if [ "$1" = "--stop" ]; then
        cleanup_processes
        print_success "All development servers stopped"
        exit 0
    elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --stop    Stop all development servers"
        echo "  --help    Show this help message"
        echo ""
        echo "Default: Start all development servers"
        exit 0
    fi

    # Run startup sequence
    cleanup_processes
    create_logs_dir
    check_prerequisites
    start_with_monitoring
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi