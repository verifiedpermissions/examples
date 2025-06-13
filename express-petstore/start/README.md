# Pet Store Sample Application

This is a sample application with a React frontend and Express.js backend.

## Project Structure

The `start` project is organized into three main directories:

```
start/
├── backend/       # Express.js API server
├── frontend/      # React web application
└── scripts/       # Utility scripts for development and deployment
```

## Backend

The backend is an Express.js application that provides a RESTful API for managing pets with the following endpoints:

- `GET /health` - Service health check
- `GET /api/pets` - List all pets
- `GET /api/pets/:id` - Get pet details
- `POST /api/pets` - Create new pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

## Frontend

The frontend is a React application with the following pages:

- **Dashboard** - Overview of pets
- **Pet List** - View and manage pets
- **Pet Details** - View and edit pet information
- **Create Pet** - Add new pets

## Scripts

The `scripts` directory contains utility scripts for development, deployment, and infrastructure management:

- `run-backend-dev.sh` - Start the backend in development mode
- `run-frontend-dev.sh` - Start the frontend in development mode
- `setup-infrastructure.sh` - Set up required AWS infrastructure
- `prepare-cedar-schema.sh` - Update Cedar schema formatting to be used by the AWS CLI
- `convert_cedar_policies.sh` - Update Cedar policy formatting to be used by the AWS CLI

## Getting started

### Prerequisites

- Node.js 16 or later
- npm 7 or later
- AWS account with permissions to create:
  - Cognito User Pools
  - DynamoDB Tables
  - Verified Permissions Policy Stores
- AWS CLI configured locally

### First time setup
The first time running the application follow these steps.

1. **Setup the infrastructure**
This will create a Cognito user pool and DynamoDB table in your configured AWS account.
    ```bash
    cd scripts
    ./setup-infrastructure.sh
    ```
2. **Run the application**
This will install dependencies and setup basic environment configuration. In two seperate terminals:
    ```bash
    cd scripts
    ./run-backend-dev.sh
    ```
    ```bash
    cd scripts
    ./run-frontend-dev.sh
    ```

3. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000


### Development workflow
To run the application after the intial setup you can follow these steps:

1. **Run the application**
In seperate terminals:
   ```bash
   cd backend
   npm run dev
   ```
   ```bash
   cd frontend
   npm start
   ```
2. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
