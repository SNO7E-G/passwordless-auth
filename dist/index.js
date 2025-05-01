"use strict";
/**
 * Passwordless Authentication Library
 * A secure and flexible library for implementing passwordless authentication
 *
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.express = exports.localization = exports.eventEmitter = exports.expressIntegration = exports.types = exports.i18n = exports.AUTH_EVENTS = exports.events = exports.storageService = exports.smsService = exports.emailService = exports.otpService = exports.authService = void 0;
// Import all public modules
const authService_1 = __importDefault(require("./services/authService"));
exports.authService = authService_1.default;
const otpService_1 = __importDefault(require("./services/otpService"));
exports.otpService = otpService_1.default;
const emailService_1 = __importDefault(require("./services/emailService"));
exports.emailService = emailService_1.default;
const smsService_1 = __importDefault(require("./services/smsService"));
exports.smsService = smsService_1.default;
const storageService_1 = __importDefault(require("./services/storageService"));
exports.storageService = storageService_1.default;
const eventEmitter_1 = __importStar(require("./utils/eventEmitter"));
exports.events = eventEmitter_1.default;
exports.eventEmitter = eventEmitter_1.default;
Object.defineProperty(exports, "AUTH_EVENTS", { enumerable: true, get: function () { return eventEmitter_1.AUTH_EVENTS; } });
const i18n_1 = __importDefault(require("./utils/i18n"));
exports.i18n = i18n_1.default;
exports.localization = i18n_1.default;
// Import types
const types = __importStar(require("./interfaces"));
exports.types = types;
// Import Express integration
const expressIntegration = __importStar(require("./integrations/express"));
exports.expressIntegration = expressIntegration;
exports.express = expressIntegration;
// Import React integration - commented out temporarily to resolve build issues
// import * as reactIntegration from './integrations/react';
// Re-export public interfaces, types and adapters from lib.ts
__exportStar(require("./lib"), exports);
// export { reactIntegration as react }; // Commented out temporarily 
//# sourceMappingURL=index.js.map