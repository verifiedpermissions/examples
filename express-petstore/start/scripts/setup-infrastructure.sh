#!/bin/bash

# Pet Store Infrastructure Setup Script
# This script sets up all required AWS resources for the Pet Store application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Detect if we're running from project root or scripts directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_DIR="$(pwd)"

if [[ "$(basename "$SCRIPT_DIR")" == "scripts" ]]; then
  # Script is in scripts directory
  PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
  if [[ "$CURRENT_DIR" == "$PROJECT_ROOT" ]]; then
    # Running from project root, calling scripts/setup-infrastructure.sh
    PATH_PREFIX="."
  else
    # Running from scripts directory
    PATH_PREFIX=".."
  fi
else
  # Script is in project root
  PROJECT_ROOT="$SCRIPT_DIR"
  PATH_PREFIX="."
fi

# Configuration
REGION=${AWS_REGION:-$(aws configure get region || echo "us-east-1")}
APP_NAME="PetStore"
USER_POOL_NAME="${APP_NAME}UserPool"
CLIENT_NAME="${APP_NAME}Client"
DYNAMODB_TABLE_NAME="Pets"
CONFIG_FILE="${PATH_PREFIX}/config.json"
ENV_FILE="${PATH_PREFIX}/backend/.env"

# Check AWS CLI
check_aws_cli() {
  log_info "Checking AWS CLI configuration..."

  if ! command -v aws &>/dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
  fi

  if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS CLI is not configured or credentials are invalid."
    exit 1
  fi

  log_success "AWS CLI is properly configured."
}

# Create Cognito User Pool
create_cognito_user_pool() {
  log_info "Creating Cognito User Pool: ${USER_POOL_NAME}..."

  # Check if user pool already exists
  USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --region $REGION \
    --query "UserPools[?Name=='${USER_POOL_NAME}'].Id" --output text)

  if [ -n "$USER_POOL_ID" ] && [ "$USER_POOL_ID" != "None" ]; then
    log_warning "User Pool ${USER_POOL_NAME} already exists with ID: ${USER_POOL_ID}"
  else
    # Create user pool with proper settings
    USER_POOL_ID=$(aws cognito-idp create-user-pool \
      --pool-name "${USER_POOL_NAME}" \
      --auto-verified-attributes email \
      --schema '[{"Name":"email","Required":true,"Mutable":true}]' \
      --admin-create-user-config '{"AllowAdminCreateUserOnly":true}' \
      --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false,"TemporaryPasswordValidityDays":7}}' \
      --region $REGION \
      --query "UserPool.Id" \
      --output text)

    log_success "Created User Pool: ${USER_POOL_ID}"
  fi

  # Create app client
  CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
    --user-pool-id "${USER_POOL_ID}" \
    --region $REGION \
    --query "UserPoolClients[?ClientName=='${CLIENT_NAME}'].ClientId" \
    --output text)

  if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "None" ]; then
    log_warning "App Client ${CLIENT_NAME} already exists with ID: ${CLIENT_ID}"
  else
    # Create app client with proper authentication flows
    CLIENT_ID=$(aws cognito-idp create-user-pool-client \
      --user-pool-id "${USER_POOL_ID}" \
      --client-name "${CLIENT_NAME}" \
      --no-generate-secret \
      --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
      --prevent-user-existence-errors ENABLED \
      --region $REGION \
      --query "UserPoolClient.ClientId" \
      --output text)

    log_success "Created App Client: ${CLIENT_ID}"
  fi

  # Create user groups
  create_user_group "administrator"
  create_user_group "employee"
  create_user_group "customer"

  log_success "Cognito User Pool setup completed."
}

# Create a user group in Cognito
create_user_group() {
  local group_name="$1"

  log_info "Creating user group: ${group_name}..."

  # Check if group already exists
  GROUP_EXISTS=$(aws cognito-idp list-groups \
    --user-pool-id "${USER_POOL_ID}" \
    --region $REGION \
    --query "Groups[?GroupName=='${group_name}']" \
    --output text)

  if [ -n "$GROUP_EXISTS" ]; then
    log_warning "Group ${group_name} already exists."
  else
    # Create group
    aws cognito-idp create-group \
      --user-pool-id "${USER_POOL_ID}" \
      --group-name "${group_name}" \
      --description "${group_name} group for ${APP_NAME}" \
      --region $REGION \
      --output text >/dev/null

    log_success "Created group: ${group_name}"
  fi
}

# Create users with prompted passwords
create_users() {
  log_info "Creating test users..."

  echo -n "Enter password for admin@example.com: "
  read -s ADMIN_PASSWORD
  echo ""

  echo -n "Enter password for employee@example.com: "
  read -s EMPLOYEE_PASSWORD
  echo ""
  
  echo -n "Enter password for customer@example.com: "
  read -s CUSTOMER_PASSWORD
  echo ""

    # Admin user
  create_user "admin@example.com" "$ADMIN_PASSWORD" "administrator"

  # Employee user
  create_user "employee@example.com" "$EMPLOYEE_PASSWORD" "employee"

  # Customer user
  create_user "customer@example.com" "$CUSTOMER_PASSWORD" "customer"

  log_success "Test users created successfully."
}

# Create a single user and add to group
create_user() {
  local email="$1"
  local password="$2"
  local group="$3"

  log_info "Creating user: ${email} in group ${group}..."

  # Check if user already exists
  USER_EXISTS=$(aws cognito-idp admin-get-user \
    --user-pool-id "${USER_POOL_ID}" \
    --username "${email}" \
    --region $REGION \
    --query "Username" \
    --output text 2>/dev/null || echo "")

  if [ -n "$USER_EXISTS" ] && [ "$USER_EXISTS" != "None" ]; then
    log_warning "User ${email} already exists."

    # Ensure user is in the correct group even if they already exist
    aws cognito-idp admin-add-user-to-group \
      --user-pool-id "${USER_POOL_ID}" \
      --username "${email}" \
      --group-name "${group}" \
      --region $REGION \
      --output text >/dev/null

    log_success "Ensured user ${email} is in group ${group}"
  else
    # Create user with permanent password
    aws cognito-idp admin-create-user \
      --user-pool-id "${USER_POOL_ID}" \
      --username "${email}" \
      --user-attributes Name=email,Value="${email}" Name=email_verified,Value=true \
      --message-action SUPPRESS \
      --region $REGION \
      --output text >/dev/null

    # Set permanent password (no temporary password, no forced password change)
    aws cognito-idp admin-set-user-password \
      --user-pool-id "${USER_POOL_ID}" \
      --username "${email}" \
      --password "${password}" \
      --permanent \
      --region $REGION \
      --output text >/dev/null

    log_success "Created user: ${email} with permanent password"

    # Add user to group
    aws cognito-idp admin-add-user-to-group \
      --user-pool-id "${USER_POOL_ID}" \
      --username "${email}" \
      --group-name "${group}" \
      --region $REGION \
      --output text >/dev/null

    log_success "Added user ${email} to group ${group}"
  fi
}

# Create DynamoDB table
create_dynamodb_table() {
  log_info "Creating DynamoDB table: ${DYNAMODB_TABLE_NAME}..."

  # Check if table already exists
  TABLE_EXISTS=$(aws dynamodb describe-table \
    --table-name "${DYNAMODB_TABLE_NAME}" \
    --region $REGION \
    --query "Table.TableName" \
    --output text 2>/dev/null || echo "")

  if [ "$TABLE_EXISTS" == "${DYNAMODB_TABLE_NAME}" ]; then
    log_warning "DynamoDB table ${DYNAMODB_TABLE_NAME} already exists."
  else
    # Create table using schema from file
    aws dynamodb create-table \
      --cli-input-json file://${PATH_PREFIX}/backend/schemas/pets.json \
      --region $REGION \
      --output text >/dev/null

    # Wait for table to be created
    aws dynamodb wait table-exists \
      --table-name "${DYNAMODB_TABLE_NAME}" \
      --region $REGION

    log_success "Created DynamoDB table: ${DYNAMODB_TABLE_NAME}"

    # Seed initial data if available
    if [ -f "${PATH_PREFIX}/backend/schemas/pets_seeder.json" ]; then
      log_info "Seeding initial data..."

      aws dynamodb batch-write-item \
        --request-items "$(cat ${PATH_PREFIX}/backend/schemas/pets_seeder.json)" \
        --region $REGION \
        --output text >/dev/null

      log_success "Seeded initial data into DynamoDB table."
    fi
  fi
}

# Update configuration files
update_config_files() {
  log_info "Updating configuration files..."

  # Update config.json
  cat >"${CONFIG_FILE}" <<EOF
{
  "region": "${REGION}",
  "userPoolId": "${USER_POOL_ID}",
  "userPoolWebClientId": "${CLIENT_ID}",
  "apiEndpoint": "http://localhost:3000",
  "apiPathPrefix": "/api",
  "authorizationMode": "avp",
  "useMockAuth": false
}
EOF

  # Update backend/.env
  cat >"${ENV_FILE}" <<EOF
# PetStore Authorization Configuration
PORT=3000
NODE_ENV=development
ENABLE_CLUSTERING=false

# AWS Configuration
AWS_REGION=${REGION}

# Cognito Configuration
COGNITO_USER_POOL_ID=${USER_POOL_ID}
COGNITO_CLIENT_ID=${CLIENT_ID}

# DynamoDB Configuration
PETS_TABLE=${DYNAMODB_TABLE_NAME}
DYNAMODB_LOCAL_ENDPOINT=

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging Configuration
DEBUG_LOGGING=false
LOG_LEVEL=info

# Development Configuration
USE_LOCAL_MOCKS=false
EOF

  # Update frontend/.env.development
  FRONTEND_ENV_FILE="${PATH_PREFIX}/frontend/.env.development"
  
  if [ -f "$FRONTEND_ENV_FILE" ]; then
    log_info "Updating frontend environment configuration..."
    
    # Read the current content
    FRONTEND_ENV_CONTENT=$(cat "$FRONTEND_ENV_FILE")
    
    # Replace the Cognito configuration values
    FRONTEND_ENV_CONTENT=$(echo "$FRONTEND_ENV_CONTENT" | sed "s|REACT_APP_COGNITO_USER_POOL_ID=.*|REACT_APP_COGNITO_USER_POOL_ID=${USER_POOL_ID}|g")
    FRONTEND_ENV_CONTENT=$(echo "$FRONTEND_ENV_CONTENT" | sed "s|REACT_APP_COGNITO_APP_CLIENT_ID=.*|REACT_APP_COGNITO_APP_CLIENT_ID=${CLIENT_ID}|g")
    FRONTEND_ENV_CONTENT=$(echo "$FRONTEND_ENV_CONTENT" | sed "s|REACT_APP_COGNITO_REGION=.*|REACT_APP_COGNITO_REGION=${REGION}|g")
    
    # Write the updated content back to the file
    echo "$FRONTEND_ENV_CONTENT" > "$FRONTEND_ENV_FILE"
    
    log_success "Frontend environment configuration updated."
  else
    log_warning "Frontend environment file not found at ${FRONTEND_ENV_FILE}. Creating new file..."
    
    # Create a new frontend environment file
    cat >"${FRONTEND_ENV_FILE}" <<EOF
REACT_APP_API_URL=http://localhost:3000
PORT=3001
BROWSER=none
REACT_APP_COGNITO_REGION=${REGION}
REACT_APP_COGNITO_USER_POOL_ID=${USER_POOL_ID}
REACT_APP_COGNITO_APP_CLIENT_ID=${CLIENT_ID}
EOF
    
    log_success "Frontend environment file created."
  fi

  log_success "All configuration files updated."
}

# Check environment
check_environment() {
  log_info "Checking environment..."

  # Check for required tools
  if ! command -v jq &>/dev/null; then
    log_error "jq is not installed. Please install it first."
    exit 1
  fi

  log_success "Environment check passed."
}

# Main function
main() {
  echo "🚀 Cedar-Cognito Pet Store Infrastructure Setup"
  echo "=============================================="
  echo ""

  # Check environment
  check_environment

  # Check AWS CLI
  check_aws_cli

  # Create resources
  create_cognito_user_pool
  create_users
  create_dynamodb_table
  update_config_files

  # Get the User Pool ARN
  USER_POOL_ARN=$(aws cognito-idp describe-user-pool \
    --user-pool-id "${USER_POOL_ID}" \
    --region $REGION \
    --query "UserPool.Arn" \
    --output text)

  echo ""
  log_success "Infrastructure setup completed successfully!"
  echo ""
  echo "📋 Resource Summary:"
  echo "  Region: ${REGION}"
  echo "  Cognito User Pool ID: ${USER_POOL_ID}"
  echo "  Cognito App Client ID: ${CLIENT_ID}"
  echo "  Cognito User Pool ARN: ${USER_POOL_ARN}"
  echo "  DynamoDB Table: ${DYNAMODB_TABLE_NAME}"
  echo ""
  echo "📝 Test Users:"
  echo "  Admin: admin@example.com"
  echo "  Employee: employee@example.com"
  echo "  Customer: customer@example.com"
  echo ""
  echo "🚀 Next Steps:"
  if [[ "$(basename "$SCRIPT_DIR")" == "scripts" ]]; then
    echo "  1. Start the backend: ./run-backend-dev.sh"
    echo "  2. Start the frontend: ./run-frontend-dev.sh"
  else
    echo "  1. Start the backend: ./scripts/run-backend-dev.sh"
    echo "  2. Start the frontend: ./scripts/run-frontend-dev.sh"
  fi
  echo "  3. Access the application at http://localhost:3001"
  echo ""
}

# Run main function
main "$@"
