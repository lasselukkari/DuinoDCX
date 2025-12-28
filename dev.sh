#!/bin/bash
# dev.sh - Development workflow script for DuinoDCX
# Usage: ./dev.sh [command]
#   build     - Build UI and generate StaticFiles.h
#   restart   - Rebuild backend and restart server
#   full      - Full rebuild (UI + backend) and restart
#   help      - Show this help

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
SERIAL_PORT="${DCX_SERIAL_PORT:-/dev/cu.usbserial-1430}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Build UI and generate StaticFiles.h
build_ui() {
    log_info "Building UI..."
    cd "$PROJECT_ROOT/dcx-ui"
    npm run build
    log_success "UI built"

    log_info "Generating StaticFiles.h..."
    cd "$PROJECT_ROOT"
    npx awot-static
    log_success "StaticFiles.h generated"
}

# Build the macOS native backend
build_backend() {
    log_info "Building MacOSNative backend..."
    cd "$PROJECT_ROOT/MacOSNative"
    make clean
    make
    log_success "Backend built"
}

# Stop any running DuinoDCXMac process
stop_server() {
    log_info "Stopping existing server..."
    pkill -f DuinoDCXMac 2>/dev/null || true
    sleep 0.5
}

# Start the server
start_server() {
    log_info "Starting server on port 3000..."
    cd "$PROJECT_ROOT/MacOSNative"
    
    if [ ! -e "$SERIAL_PORT" ]; then
        log_warn "Serial port $SERIAL_PORT not found. Server will run without device."
        log_warn "Set DCX_SERIAL_PORT env var to change the port."
    fi
    
    ./DuinoDCXMac "$SERIAL_PORT" > output.log 2>&1 &
    SERVER_PID=$!
    sleep 1
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Server started (PID: $SERVER_PID)"
        log_info "Logs: $PROJECT_ROOT/MacOSNative/output.log"
        log_info "Access: http://localhost:3000"
    else
        log_error "Server failed to start. Check output.log"
        exit 1
    fi
}

# Show usage
show_help() {
    echo "DuinoDCX Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build     Build UI and generate StaticFiles.h"
    echo "  restart   Rebuild backend and restart server (no UI rebuild)"
    echo "  full      Full rebuild (UI + backend) and restart server"
    echo "  help      Show this help"
    echo ""
    echo "Environment:"
    echo "  DCX_SERIAL_PORT  Serial port path (default: /dev/cu.usbserial-1430)"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh full                    # Full rebuild and start"
    echo "  ./dev.sh restart                 # Quick backend rebuild"
    echo "  DCX_SERIAL_PORT=/dev/cu.usbserial-ABC ./dev.sh full"
}

# Main
case "${1:-help}" in
    build)
        build_ui
        ;;
    restart)
        stop_server
        build_backend
        start_server
        ;;
    full)
        build_ui
        stop_server
        build_backend
        start_server
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
