/**
 * Environment variable validation utility for Cedar Cognito PetStore
 *
 * This module validates that required environment variables are set based on
 * the current run mode (local, standalone, or cloud).
 */
import logger from './logger';

/**
 * Validates environment variables based on the current mode
 * @returns {boolean} Whether all required variables are set
 */
export function validateEnvironment(): boolean {
  // Determine mode
  const isLocalMockMode = process.env.USE_LOCAL_MOCKS === 'true';
  const isStandaloneMode = process.env.STANDALONE_AUTH === 'true';
  const isCloudMode = !isLocalMockMode && !isStandaloneMode;

  // Common variables required for all modes
  const commonVariables = [
    'PORT',
    'AWS_REGION',
  ];

  // Variables required for cloud mode
  const cloudVariables = [
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'POLICY_STORE_ID',
    'PETS_TABLE',
  ];

  // Variables required for standalone mode (no AWS authentication but still uses AWS resources)
  const standaloneVariables = [
    'POLICY_STORE_ID',
    'PETS_TABLE',
  ];

  // Local mock mode has the fewest requirements
  const localMockVariables: string[] = [];

  // Determine which variables need to be checked
  const requiredVariables = [
    ...commonVariables,
    ...(isCloudMode ? cloudVariables : []),
    ...(isStandaloneMode ? standaloneVariables : []),
    ...(isLocalMockMode ? localMockVariables : []),
  ];

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  // Log the current mode and variable status
  const mode = isLocalMockMode
    ? 'LOCAL MOCK MODE'
    : isStandaloneMode
      ? 'STANDALONE MODE'
      : 'CLOUD MODE';

  logger.info(`Running in ${mode}`);

  if (missingVariables.length > 0) {
    logger.warn(
      `Missing environment variables for ${mode}: ${missingVariables.join(', ')}`
    );

    // For local mock mode, we can continue with defaults
    if (isLocalMockMode) {
      logger.info('Using default values for missing environment variables in local mock mode');
      return true;
    }

    // Warn about missing variables but continue in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing despite missing variables because NODE_ENV is development');
      return true;
    }

    logger.error('Environment validation failed. Set required variables or change the mode.');
    return false;
  }

  logger.info('Environment validation successful');
  return true;
}

/**
 * Get all environment variables with their values for debugging
 * @returns {Record<string, string>} Environment variables and values
 */
export function getEnvironmentDebugInfo(): Record<string, string> {
  const debugVars = [
    'NODE_ENV',
    'PORT',
    'AWS_REGION',
    'POLICY_STORE_ID',
    'PETS_TABLE',
    'DEBUG_LOGGING',
    'STANDALONE_AUTH',
    'USE_LOCAL_MOCKS',
  ];

  const result: Record<string, string> = {};

  for (const variable of debugVars) {
    result[variable] = process.env[variable] || '(not set)';
  }

  return result;
}

export default {
  validateEnvironment,
  getEnvironmentDebugInfo,
};
