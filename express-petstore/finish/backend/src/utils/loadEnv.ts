import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load environment variables from .env files
 */
export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  const envDevPath = path.resolve(process.cwd(), '.env.development');
  
  // Load .env.development if it exists
  if (fs.existsSync(envDevPath)) {
    console.log(`Loading environment variables from ${envDevPath}`);
    dotenv.config({ path: envDevPath });
  }
  
  // Load .env if it exists
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
  }
}
