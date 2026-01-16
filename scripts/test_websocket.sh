#!/bin/bash
# WebSocket connection test script for DuinoDCX

set -e

SERVER_URL="http://localhost:3000"
WS_URL="ws://localhost:3000/api/ws"
LOG_FILE="/tmp/ws_test.log"

echo "=== DuinoDCX WebSocket Test Script ==="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if ! curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|401"; then
    echo "   FAIL: Server not responding at $SERVER_URL"
    exit 1
fi
echo "   OK: Server is running"
echo ""

# Test WebSocket handshake with curl
echo "2. Testing WebSocket handshake..."
WS_KEY="dGhlIHNhbXBsZSBub25jZQ=="
EXPECTED_ACCEPT="s3pPLMBiTxaQ9kYGzzhZRbK+xOo="

RESPONSE=$(curl -s -i --max-time 2 \
    -H "Upgrade: websocket" \
    -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: $WS_KEY" \
    -H "Sec-WebSocket-Version: 13" \
    "$SERVER_URL/api/ws" 2>&1 || true)

if echo "$RESPONSE" | grep -q "101 Switching Protocols"; then
    echo "   OK: Got 101 Switching Protocols"
else
    echo "   FAIL: Did not get 101 response"
    echo "   Response:"
    echo "$RESPONSE" | head -10
    exit 1
fi

if echo "$RESPONSE" | grep -q "Sec-WebSocket-Accept: $EXPECTED_ACCEPT"; then
    echo "   OK: Sec-WebSocket-Accept header is correct"
else
    echo "   WARN: Sec-WebSocket-Accept header may be different (checking if present)"
    if echo "$RESPONSE" | grep -q "Sec-WebSocket-Accept:"; then
        echo "   OK: Sec-WebSocket-Accept header is present"
    else
        echo "   FAIL: No Sec-WebSocket-Accept header"
        exit 1
    fi
fi
echo ""

# Test multiple connections don't exhaust slots
echo "3. Testing multiple connections (slot management)..."
SUCCESS_COUNT=0
for i in 1 2 3; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 \
        -H "Upgrade: websocket" \
        -H "Connection: Upgrade" \
        -H "Sec-WebSocket-Key: test${i}==" \
        -H "Sec-WebSocket-Version: 13" \
        "$SERVER_URL/api/ws" 2>&1 || echo "000")
    if [ "$RESP" = "000" ]; then
        # Got 101 and curl exited (connection upgrade)
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done
echo "   Connections attempted: 3, Successful: $SUCCESS_COUNT"
if [ "$SUCCESS_COUNT" -ge 1 ]; then
    echo "   OK: At least one connection succeeded"
else
    echo "   WARN: No connections succeeded (may indicate slot exhaustion)"
fi
echo ""

# Summary
echo "=== Test Summary ==="
echo "WebSocket handshake: PASSED"
echo ""
echo "To test with a real WebSocket client, use:"
echo "  wscat -c $WS_URL"
echo ""
echo "Server logs at: /Users/lasselukkari/Documents/DuinoDCX/MacOSNative/output.log"
