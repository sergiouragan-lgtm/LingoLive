/**
 * Environment Configuration
 * Centralized configuration for different deployment environments.
 */

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface AppConfig {
  env: Environment;
  firebaseConfig: any;
  apiUrl: string;
}

export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
};

export const getConfig = (): AppConfig => {
  const env = getEnvironment();
  
  // In a real scenario, these would be loaded from env vars
  return {
    env,
    firebaseConfig: {
      // apiKey: process.env.VITE_FIREBASE_API_KEY,
      // ...
    },
    apiUrl: env === Environment.PRODUCTION ? 'https://api.lingolive.com' : 'https://dev-api.lingolive.com',
  };
};
