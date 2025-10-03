#!/bin/bash

# Start a single Chrome VM container for testing

echo "🐳 Starting single Chrome VM container..."

# Stop any existing container
docker stop chrome-vm-test 2>/dev/null || true
docker rm chrome-vm-test 2>/dev/null || true

# Start the container
docker run -d \
  --name chrome-vm-test \
  --platform linux/amd64 \
  -p 6080:6080 \
  -p 3000:3000 \
  -e DISPLAY=:1 \
  -e NODE_ENV=production \
  -e VM_ID=test-vm \
  --privileged \
  --shm-size=2gb \
  chrome-vm:latest

echo "✅ Chrome VM container started!"
echo "📊 NoVNC: http://localhost:6080"
echo "🤖 Agent API: http://localhost:3000"
echo ""
echo "Test the agent:"
echo "  curl http://localhost:3000/health"
echo ""
echo "View logs:"
echo "  docker logs -f chrome-vm-test"
