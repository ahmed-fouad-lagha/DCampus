#!/bin/bash

# Start DCampus Applications
echo "Starting DCampus Applications..."

# Parse command line options
BYPASS_AUTH=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --skip-auth) BYPASS_AUTH=true; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Set Supabase service key (if not already set)
if [ -f "./backend/.env" ]; then
  echo "Backend .env file exists. Please make sure the SUPABASE_SERVICE_KEY is properly set."
else
  echo "Backend .env file does not exist. Please create it with proper configuration."
  exit 1
fi

# Set up environment variables for React app
if [ "$BYPASS_AUTH" = true ]; then
  echo "Enabling auth bypass mode - will skip authentication loading screen"
  export REACT_APP_SKIP_AUTH_CHECK=true
else
  # Make sure we don't use a previously set value
  export REACT_APP_SKIP_AUTH_CHECK=false
fi

# Start Backend in background
echo "Starting Backend Server..."
cd /home/fouad/DCampus/backend
node server.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Give backend time to start
echo "Waiting for backend to initialize..."
sleep 3

# Start Frontend in another terminal/tab
echo "Starting Frontend Application..."
cd /home/fouad/DCampus/dcampus
npm start

# Cleanup when frontend is closed
function cleanup() {
  echo "Shutting down backend (PID: $BACKEND_PID)..."
  kill $BACKEND_PID
  echo "Cleanup complete"
}

trap cleanup EXIT