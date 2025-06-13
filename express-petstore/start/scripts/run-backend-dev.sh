#!/bin/bash
# Run the PetStore backend for local development
# This script has been simplified as authorization has been removed

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

# Display usage information
show_usage() {
  echo "Usage: $0"
  echo ""
  echo "This script starts the PetStore backend in development mode."
}

# Parse command line arguments
for arg in "$@"; do
  case $arg in
  --help | -h)
    show_usage
    exit 0
    ;;
  *)
    log_error "Unknown option: $arg"
    show_usage
    exit 1
    ;;
  esac
done

# Check if Node.js is installed
if ! command -v node &>/dev/null; then
  log_error "Node.js is not installed. Please install Node.js v16 or later."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &>/dev/null; then
  log_error "npm is not installed. Please install npm."
  exit 1
fi

# Check if AWS CLI is available
if ! command -v aws &>/dev/null; then
  log_warning "AWS CLI not found. Some features may not work properly."
fi

# Extract configuration values from config.json if it exists
CONFIG_FILE="../config.json"
if [ -f "$CONFIG_FILE" ]; then
  log "Reading configuration from config.json"
  REGION=$(grep -o '"region": "[^"]*' $CONFIG_FILE | cut -d'"' -f4)
else
  log "No config.json found, using default region"
  REGION="us-east-1"
fi

# Retrieve table name from .env file if it exists
ENV_FILE="../backend/.env"
if [ ! -f "$ENV_FILE" ] && [ -f "./backend/.env" ]; then
  ENV_FILE="./backend/.env"
fi

if [ -f "$ENV_FILE" ]; then
  log "Reading configuration from $ENV_FILE"
  PETS_TABLE=$(grep PETS_TABLE $ENV_FILE | cut -d'=' -f2)
else
  log "No .env file found, using default table name"
  PETS_TABLE="mock-pets-table"
fi

log_success "==================================================="
log_success "Starting PetStore Backend"
log_success "==================================================="
log "Pets Table:       $PETS_TABLE"
log "Region:           $REGION"
log_success "==================================================="

# Navigate to backend directory
if [ -d "../backend" ]; then
  cd ../backend
elif [ -d "./backend" ]; then
  cd ./backend
else
  log_error "Backend directory not found"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  npm install
fi

# Create a temporary .env file with all the necessary environment variables
cat >.env <<EOF
# Server configuration
PORT=3000
NODE_ENV=development
DEBUG_LOGGING=true
ENABLE_CLUSTERING=false
HEALTH_CHECK_ENABLED=true

# AWS configuration
AWS_REGION=$REGION

# DynamoDB configuration
PETS_TABLE=$PETS_TABLE

# CORS configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Mock-User
EOF

# Set environment variables explicitly for the Node.js process
export PETS_TABLE=$PETS_TABLE
export AWS_REGION=$REGION
export DEBUG_LOGGING=true
export PORT=3000
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Start the backend in development mode
log "Starting backend on http://localhost:3000..."
npx ts-node-dev --respawn --transpile-only src/index.ts
