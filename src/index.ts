/**
 * Passwordless Authentication Library
 * A secure and flexible library for implementing passwordless authentication
 * 
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */

// Import all public modules
import authService from './services/authService';
import otpService from './services/otpService';
import emailService from './services/emailService';
import smsService from './services/smsService';
import storageService from './services/storageService';
import events, { AUTH_EVENTS } from './utils/eventEmitter';
import i18n from './utils/i18n';

// Import types
import * as types from './interfaces';

// Import Express integration
import * as expressIntegration from './integrations/express';

// Import React integration - commented out temporarily to resolve build issues
// import * as reactIntegration from './integrations/react';

// Re-export public interfaces, types and adapters from lib.ts
export * from './lib';

// Export everything with named exports
export {
  // Services
  authService,
  otpService,
  emailService,
  smsService,
  storageService,
  
  // Utils
  events,
  AUTH_EVENTS,
  i18n,
  
  // Types
  types,
  
  // Integrations
  expressIntegration,
  // reactIntegration, // Commented out temporarily
};

// Individual exports for utils and integrations to avoid exposing private implementation details
export { events as eventEmitter };
export { i18n as localization };
export { expressIntegration as express };
// export { reactIntegration as react }; // Commented out temporarily 