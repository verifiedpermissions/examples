# Backend API

This Express.js backend provides a simple API for a pet store application. The `finish` version implements authorization using the Cedar and Verified Permissions packages for Express: `@verifiedpermissions/authorization-clients` and `@cedar-policy/authorization-for-expressjs`

## Directory structure

```
src/
├── app.ts              # Express application setup with middleware and routes
├── index.ts            # Single entry point for development and production
├── types.ts            # TypeScript type definitions
├── config/             # Configuration management
├── middleware/         # Middleware implementations
├── routes/             # API route handlers
├── controllers/        # Business logic controllers
└── utils/              # Utility functions and logging
```

## Configuration

The application uses environment variables for configuration:

```bash
# Server configuration
PORT=
NODE_ENV=
# AWS configuration
AWS_REGION=
# DynamoDB configuration
DYNAMODB_PETS_TABLE=
```

## API endpoints

- `GET /health` - Returns service health and configuration details
- `GET /api/pets` - List all pets
- `GET /api/pets/:id` - Get specific pet details
- `POST /api/pets` - Create new pet
- `PUT /api/pets/:id` - Update existing pet
- `DELETE /api/pets/:id` - Delete pet


## Development commands

```bash
# Development with hot reload
npm run dev
# Type checking
npm run type-check
# Linting
npm run lint
# Build
npm run build
# Start build
npm start
```