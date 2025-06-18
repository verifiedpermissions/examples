# Notebook App Example

## Introduction

This example demonstrates the integration between Express.js and the `@cedar-policy/authorization-for-expressjs` module. It consists of a React frontend and an Express.js backend that implements Cedar authorization for notebook management.

### Application structure

The application is simplified as much as possible to allow for readability. The code in this repository is not production ready from a product perspective - error messages in the frontend are shown as `alert`s, UI layout is simplistic, the "Database" is an in-memory array, endpoints that should use pagination don't do so, etc. The purpose of this repository is not to show how to write a production-ready notebook sharing application, but rather to show how Amazon Verified Permissions and Cedar can be used to power fine-grained authorization in a real-world use case.

The application is built on top of expressjs using `@cedar-policy/authorization-for-expressjs`. It also uses `express-openapi-generator`, a library that allows you to generate an expressive openApi spec from your express application. By using `express-openapi-generator`, we can use our backend code as the source of truth for our API spec, which in turn allows us to keep our Cedar schema in sync with our API spec.

### Policy as Code Benefits

Policy as Code (PaC) brings several key advantages to your applications:

1. **Declarative Authorization**: Cedar policies are written in a human-readable format that clearly expresses who can do what under which conditions. This makes authorization rules easier to understand, review, and maintain.

2. **Analyzability**: Authorization becomes more complex as applications scale, making it crucial to have robust tools for managing and verifying access policies. While most development teams rely on testing specific scenarios like “Can Alice view this document?” or “Can Bob edit that folder?”, this approach only catches obvious issues through sample test cases. Using Cedar, development teams have access to an [analysis toolkit](https://aws.amazon.com/blogs/opensource/introducing-cedar-analysis-open-source-tools-for-verifying-authorization-policies/) which enables them to use mathematically proven tools to compare diffs between their policy sets.

3. **Version Control**: Policies are stored as code files, enabling version control, peer review, and tracking of authorization changes over time.

4. **Centralized Policy Management**: All authorization rules are managed in one place, reducing the risk of inconsistent or conflicting permissions across the application.

5. **Testing and Validation**: Policies can be tested and validated before deployment, ensuring that authorization behaves as expected.

6. **Scalability**: As the application grows, new permissions can be added by extending existing policies without modifying application code.

7. **Operational Speed**: Your application's security model can evolve without necessitating code deployments. The authorization model has its own deployment lifecycle, reducing cross-team friction and issues with multi-phase deployments.

### Permissions Model

The notebook application implements a hierarchical permissions model:

1. **Ownership-based Access**:
   - Users have full control (read, write, delete) over notebooks they create
   - Ownership is automatically assigned upon notebook creation

2. **Sharing Capabilities**:
   - Notebook owners can share their notebooks with other users
   - Shared access can be configured with different permission levels:
     - Read-only: View notebook contents
     - Read-write: View and modify notebook contents

3. **Role-based access Controls**:
   - Users who belong to the group "writers" can perform write actions on notebooks
   - Users who belong to the group "readers" can only perform read actions on notebooks.

4. **Policy Enforcement**:
   - All access is validated against Cedar policies
   - Policies are evaluated in real-time for each request
   - Authorization decisions consider:
     - User identity and roles
     - Resource ownership
     - Sharing relationships
     - Request context (e.g., action type, time)

## Prerequisites

Before running the application, you need:

1. Node.js installed on your system
2. An AWS account with:
   - A Cognito User Pool
   - A Verified Permissions Policy Store

## Configuration

The following environment variables are required:

```bash
AWS_REGION=<your-aws-region>           # The AWS region where your resources are located
USERPOOL_ID=<your-userpool-id>         # The ID of your Cognito User Pool
POLICY_STORE_ID=<your-policy-store-id> # The ID of your Verified Permissions Policy Store
```

## Running the Application

### Backend

1. Navigate to the backend directory:
   ```bash
   cd notebook-app-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The backend will run on http://localhost:3000

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd notebook-app-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure the `VITE_USERPOOL_ID` env var is set with an appropriate value matching the backend.

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on http://localhost:5173

## Application Structure

- `notebook-app-backend/`: Express.js server with Cedar authorization integration
  - `middleware/`: Contains authentication middleware
  - `policies/`: Cedar policy files
  - `index.js`: Main server file
  - `notebookRepository.js`: Notebook data management

- `notebook-app-frontend/`: React/TypeScript frontend application
  - `src/`: Source code directory
    - `components/`: Reusable React components
    - `routes/`: Application routes
    - `state/`: Application state management

## Features

- User authentication via AWS Cognito
- Authorization using Cedar policies
- Create, read, update, and delete notebooks
- Share notebooks with other users
- Policy-based access control

## API Endpoints

- `GET /notebooks`: List all notebooks owned by the authenticated user
- `POST /notebooks`: Create a new notebook
- `GET /notebooks/:id`: Get a specific notebook
- `PUT /notebooks/:id`: Update a notebook
- `DELETE /notebooks/:id`: Delete a notebook
- `GET /notebooks/shared-with-me`: List notebooks shared with the authenticated user
