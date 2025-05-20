#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build for production
echo "Building for production..."
npm run build

echo "Build completed. Production files are in the 'dist' directory."
echo "You can serve these files with any static file server."
