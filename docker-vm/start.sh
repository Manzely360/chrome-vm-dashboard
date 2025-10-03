#!/bin/bash

# Start Xvfb in the background
Xvfb :1 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 2

# Start x11vnc in the background
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &
VNC_PID=$!

# Start NoVNC in the background
websockify --web=/usr/share/novnc/ 6080 localhost:5900 &
NOVNC_PID=$!

# Start the desktop environment
/app/start-desktop.sh &
DESKTOP_PID=$!

# Start the Node.js agent
cd /app
node agent.js &
AGENT_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $AGENT_PID $DESKTOP_PID $NOVNC_PID $VNC_PID $XVFB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait
