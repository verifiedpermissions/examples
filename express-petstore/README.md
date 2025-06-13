# Amazon Verified Permissions Pet Store Sample

**Warning: This sample is designed for demonstration purposes, not for production use.**

This project demonstrates how to integrate Amazon Verified Permissions with a Node.js Express application using Amazon Cognito for authentication. It provides a complete working example of a pet store application with two versions:

1. **Start Version**: A baseline application without authorization controls
2. **Finish Version**: The same application with authorization provided by integrating the appplication with Verified Permissions by using the Cedar and Verified Permissions packages for Express: `@verifiedpermissions/authorization-clients` and `@cedar-policy/authorization-for-expressjs`

## Project Structure

```
AVPPetStoreCognitoSample/
├── start/                  # Baseline application without AVP integration
│   ├── backend/            # Express.js API backend
│   ├── frontend/           # Web frontend application
│   └── scripts/            # Utility scripts for setup and deployment
│
├── finish/                 # Complete application with AVP integration
│   ├── backend/            # Express.js API with AVP authorization
│   ├── frontend/           # Web frontend application
│   └── scripts/            # Utility scripts for setup and deployment
```

## Getting Started

Each application version (start and finish) contains its own README with specific setup instructions. The general workflow is:

1. Set up required AWS resources (Cognito, DynamoDB, AVP)
2. Configure environment variables (if changing from defaults)
3. Install dependencies
4. Run the application

## Prerequisites

- Node.js 16 or later
- npm 7 or later
- AWS account with permissions to create:
  - Cognito User Pools
  - DynamoDB Tables
  - Verified Permissions Policy Stores
- AWS CLI configured locally

## Additional Resources

- [Amazon Verified Permissions Documentation](https://docs.aws.amazon.com/verified-permissions/)
- [Cedar](https://docs.cedarpolicy.com/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Express.js Documentation](https://expressjs.com/)
