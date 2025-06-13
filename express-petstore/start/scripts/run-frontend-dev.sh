#!/bin/bash
# Run the Cedar Cognito PetStore frontend for local development

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed. Please install Node.js v16 or later."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed. Please install npm."
  exit 1
fi

# Check if config.json exists
if [ ! -f "frontend/public/config.json" ]; then
  log_warning "frontend/public/config.json not found. Creating from template..."
  cp frontend/public/config.json.template frontend/public/config.json

  # Update config to point to local backend
  sed -i '' 's|API_GATEWAY_ENDPOINT|http://localhost:3000|g' frontend/public/config.json

  log_success "Created frontend/public/config.json"
fi

# Copy root config.json to frontend/public/config.json to ensure they match
if [ -f "config.json" ]; then
  log_info "Copying root config.json to frontend/public/config.json to ensure consistency"
  cp config.json frontend/public/config.json
  log_success "Updated frontend configuration"
fi

# Check for existing backend
if ! curl -s http://localhost:3000/health &> /dev/null; then
  log_warning "Backend is not running on http://localhost:3000"
  log_warning "You should run the backend first or the frontend won't function correctly"
  log "Would you like to continue anyway? (y/n)"
  read -r continue_anyway
  if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

log_success "==================================================="
log_success "Starting Cedar Cognito PetStore Frontend"
log_success "==================================================="
log "The frontend will be available at: http://localhost:3001"
log_success "==================================================="

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  npm install
fi

# Start the frontend in development mode
PORT=3001 REACT_APP_API_URL=http://localhost:3000 npm start
