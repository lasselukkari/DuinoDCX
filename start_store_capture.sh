pkill -f "python3 serial_proxy.py"
pkill -f "DCX-Remote.exe"
pkill -f "wine"
# Kill any lingering venv python process
pkill -f "python3"

# Clean old log
rm -f store_preset_capture.log
rm -f proxy_output_store.txt

# Start proxy
echo "Starting serial proxy..."
./venv/bin/python3 -u serial_proxy.py /dev/cu.usbserial-1430 --log store_preset_capture.log > proxy_output_store.txt 2>&1 &
PROXY_PID=$!

# Wait for port
echo "Waiting for virtual port..."
count=0
while [ $count -lt 10 ]; do
    if grep -q "Virtual port created:" proxy_output_store.txt; then
        VPORT=$(grep "Virtual port created:" proxy_output_store.txt | awk '{print $NF}' | tr -d '\r')
        echo "Virtual port: $VPORT"
        
        # Link wine COM1
        echo "Linking ~/.wine/dosdevices/com1 to $VPORT"
        ln -sf "$VPORT" ~/.wine/dosdevices/com1
        
        # Start Wine
        EXE_PATH="DCX2496_V1_16/DCX2496_V1_16/DCX-Remote.exe"
        echo "Starting $EXE_PATH..."
        wine "$EXE_PATH" &
        WINE_PID=$!
        echo "Started Wine (PID $WINE_PID)"
        
        echo "Setup Complete. Capture running in store_preset_capture.log"
        exit 0
    fi
    sleep 1
    count=$((count+1))
done

echo "Timeout waiting for proxy port."
kill $PROXY_PID
exit 1
