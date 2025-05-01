/**
 * Passwordless Authentication Library
 * A secure and flexible library for implementing passwordless authentication
 *
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */
import authService from './services/authService';
import otpService from './services/otpService';
import emailService from './services/emailService';
import smsService from './services/smsService';
import storageService from './services/storageService';
import events, { AUTH_EVENTS } from './utils/eventEmitter';
import i18n from './utils/i18n';
import * as types from './interfaces';
import * as expressIntegration from './integrations/express';
export * from './lib';
export { authService, otpService, emailService, smsService, storageService, events, AUTH_EVENTS, i18n, types, expressIntegration, };
export { events as eventEmitter };
export { i18n as localization };
export { expressIntegration as express };
