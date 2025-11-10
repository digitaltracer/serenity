/**
 * Platform Abstraction Layer
 *
 * Provides a unified interface for platform-specific operations that works
 * across Electron desktop app and Next.js web app.
 *
 * Usage:
 *   import { platformService } from '@serenity/core';
 *
 *   // Automatically uses correct adapter (Electron or Web)
 *   const result = await platformService.aiQuickAdd({
 *     text: 'Buy groceries tomorrow',
 *     provider: 'openai'
 *   });
 */

export * from './types';
export * from './PlatformService';
export * from './adapters/ElectronAdapter';
export * from './adapters/WebAdapter';

// Re-export singleton for convenience
export { platformService } from './PlatformService';
