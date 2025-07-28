/**
 * Environment-aware logging utility
 * Only logs in development mode to prevent console pollution in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  
  // For critical operations that should always be logged
  always: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  }
};