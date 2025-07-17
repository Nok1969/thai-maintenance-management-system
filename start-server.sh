#!/bin/bash
# Kill any existing tsx or node processes on server
pkill -f "tsx.*server" 2>/dev/null || echo "No tsx server processes found"
pkill -f "node.*5000" 2>/dev/null || echo "No node processes on port 5000 found"

# Wait a moment for cleanup
sleep 2

# Start the development server
NODE_ENV=development tsx server/index.ts