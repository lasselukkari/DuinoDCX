#!/bin/bash
# dev.sh - Development workflow script for DuinoDCX
# Usage: ./dev.sh [command]
#   build     - Build UI and generate StaticFiles.h
#   restart   - Rebuild backend and restart server
#   full      - Full rebuild (UI + backend) and restart
#   wine      - Start Serial Proxy and DCX-Remote in Wine
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


# Run Wine with Serial Proxy

# Run Wine with Serial Proxy

# Run Wine with Serial Proxy
run_wine() {
    # Disable monitor mode to suppress "Terminated" messages
    set +m
    
    log_info "Starting Serial Proxy and Wine..."
    
    # Check for venv
    if [ ! -d "$PROJECT_ROOT/venv" ]; then
        log_error "Python venv not found at $PROJECT_ROOT/venv"
        log_info "Please set it up first (see README.md)"
        exit 1
    fi

    # Cleanup previous instances
    pkill -f serial_proxy.py || true
    pkill -f "DCX-Remote.exe" || true

    # Define cleanup function
    cleanup() {
        log_info "Shutting down..."
        trap - SIGINT SIGTERM EXIT # Disable trap to prevent recursion
        
        if [ -n "$PROXY_PID" ]; then
            log_info "Killing Serial Proxy (PID: $PROXY_PID)..."
            kill $PROXY_PID 2>/dev/null || true
        fi
        
        if [ -n "$WINE_PID" ]; then
             log_info "Killing Wine (PID: $WINE_PID)..."
             kill $WINE_PID 2>/dev/null || true
        fi
        
        # Fallback force kill
        pkill -P $$ || true
        pkill -f serial_proxy.py || true
        pkill -f "DCX-Remote.exe" || true
    }
    
    # Set trap for cleanup on exit or interrupt
    trap cleanup EXIT INT TERM

    # Start Proxy
    log_info "Starting serial_proxy.py..."
    PROXY_LOG="$PROJECT_ROOT/proxy_init.log"
    rm -f "$PROXY_LOG"
    
    cd "$PROJECT_ROOT"
    ./venv/bin/python3 -u serial_proxy.py "$SERIAL_PORT" --log capture.log > "$PROXY_LOG" 2>&1 &
    PROXY_PID=$!

    # Wait for virtual port
    log_info "Waiting for virtual port..."
    start_time=$(date +%s)
    VIRTUAL_PORT=""
    
    while [ -z "$VIRTUAL_PORT" ]; do
        if [ ! -d "/proc/$PROXY_PID" ] && ! kill -0 $PROXY_PID 2>/dev/null; then
            log_error "Serial proxy died unexpectedly:"
            cat "$PROXY_LOG"
            exit 1
        fi
        
        # Check timeout (10s)
        current_time=$(date +%s)
        if [ $((current_time - start_time)) -gt 10 ]; then
             log_error "Timeout waiting for virtual port."
             cat "$PROXY_LOG"
             exit 1
        fi

        # Try to grep the port
        if grep -q "Virtual port created:" "$PROXY_LOG"; then
            VIRTUAL_PORT=$(grep "Virtual port created:" "$PROXY_LOG" | awk '{print $NF}')
        fi
        sleep 0.5
    done
    
    log_success "Virtual port detected: $VIRTUAL_PORT"

    # Create Symlink
    mkdir -p ~/.wine/dosdevices
    ln -sf "$VIRTUAL_PORT" ~/.wine/dosdevices/com1
    log_success "Linked $VIRTUAL_PORT to ~/.wine/dosdevices/com1"

    # Start Wine (Backgrounded)
    log_info "Launching DCX-Remote.exe..."
    log_info "Press Ctrl+C to stop everything."
    wine "$PROJECT_ROOT/DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe" > "$PROJECT_ROOT/wine.out" 2>&1 &
    WINE_PID=$!
    
    # Wait for Wine process
    wait $WINE_PID
    
    log_success "DCX-Remote exited."
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
    echo "  wine      Start Serial Proxy and DCX-Remote in Wine"
    echo "  help      Show this help"
    echo ""
    echo "Environment:"
    echo "  DCX_SERIAL_PORT  Serial port path (default: /dev/cu.usbserial-1430)"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh full                    # Full rebuild and start"
    echo "  ./dev.sh restart                 # Quick backend rebuild"
    echo "  ./dev.sh wine                    # Run DCX-Remote via Wine"
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
    wine)
        run_wine
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
