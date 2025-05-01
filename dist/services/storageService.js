"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("../interfaces");
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
/**
 * In-memory storage adapter for demo purposes
 */
class InMemoryAdapter {
    constructor() {
        this.users = new Map();
        this.tokens = new Map();
        this.sessions = new Map();
        this.usersByEmail = new Map();
        this.usersByPhone = new Map();
        this.tokensByToken = new Map();
        this.sessionsByToken = new Map();
    }
    // User operations
    async findUserById(id) {
        return this.users.get(id) || null;
    }
    async findUserByEmail(email) {
        const userId = this.usersByEmail.get(email.toLowerCase());
        return userId ? this.users.get(userId) || null : null;
    }
    async findUserByPhone(phone) {
        const userId = this.usersByPhone.get(phone);
        return userId ? this.users.get(userId) || null : null;
    }
    async createUser(userData) {
        const id = userData.id || (0, uuid_1.v4)();
        const now = new Date();
        const user = {
            id,
            email: userData.email,
            phone: userData.phone,
            displayName: userData.displayName,
            verified: userData.verified || false,
            createdAt: userData.createdAt || now,
            updatedAt: userData.updatedAt || now
        };
        this.users.set(id, user);
        if (user.email) {
            this.usersByEmail.set(user.email.toLowerCase(), id);
        }
        if (user.phone) {
            this.usersByPhone.set(user.phone, id);
        }
        return user;
    }
    async updateUser(id, updates) {
        const existingUser = this.users.get(id);
        if (!existingUser)
            return null;
        // Handle email changes
        if (updates.email && updates.email !== existingUser.email) {
            if (existingUser.email) {
                this.usersByEmail.delete(existingUser.email.toLowerCase());
            }
            this.usersByEmail.set(updates.email.toLowerCase(), id);
        }
        // Handle phone changes
        if (updates.phone && updates.phone !== existingUser.phone) {
            if (existingUser.phone) {
                this.usersByPhone.delete(existingUser.phone);
            }
            this.usersByPhone.set(updates.phone, id);
        }
        const updatedUser = {
            ...existingUser,
            ...updates,
            id, // ensure ID isn't changed
            updatedAt: new Date()
        };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    // Token operations
    async findTokenById(id) {
        return this.tokens.get(id) || null;
    }
    async findTokenByToken(token) {
        const tokenId = this.tokensByToken.get(token);
        return tokenId ? this.tokens.get(tokenId) || null : null;
    }
    async createToken(tokenData) {
        const id = tokenData.id || (0, uuid_1.v4)();
        const now = new Date();
        if (!tokenData.userId || !tokenData.token || !tokenData.type || !tokenData.expiresAt) {
            throw new Error('Missing required token data');
        }
        const token = {
            id,
            userId: tokenData.userId,
            token: tokenData.token,
            type: tokenData.type,
            expiresAt: tokenData.expiresAt,
            used: tokenData.used || false,
            createdAt: tokenData.createdAt || now,
            updatedAt: tokenData.updatedAt || now
        };
        this.tokens.set(id, token);
        this.tokensByToken.set(token.token, id);
        return token;
    }
    async updateToken(id, updates) {
        const existingToken = this.tokens.get(id);
        if (!existingToken)
            return null;
        const updatedToken = {
            ...existingToken,
            ...updates,
            id, // ensure ID isn't changed
            updatedAt: new Date()
        };
        this.tokens.set(id, updatedToken);
        return updatedToken;
    }
    // Session operations
    async findSessionById(id) {
        return this.sessions.get(id) || null;
    }
    async findSessionByToken(token) {
        const sessionId = this.sessionsByToken.get(token);
        return sessionId ? this.sessions.get(sessionId) || null : null;
    }
    async createSession(sessionData) {
        const id = sessionData.id || (0, uuid_1.v4)();
        const now = new Date();
        if (!sessionData.userId || !sessionData.token || !sessionData.expiresAt) {
            throw new Error('Missing required session data');
        }
        const session = {
            id,
            userId: sessionData.userId,
            token: sessionData.token,
            expiresAt: sessionData.expiresAt,
            createdAt: sessionData.createdAt || now,
            updatedAt: sessionData.updatedAt || now,
            lastUsedAt: sessionData.lastUsedAt || now
        };
        this.sessions.set(id, session);
        this.sessionsByToken.set(session.token, id);
        return session;
    }
    async updateSession(id, updates) {
        const existingSession = this.sessions.get(id);
        if (!existingSession)
            return null;
        const updatedSession = {
            ...existingSession,
            ...updates,
            id, // ensure ID isn't changed
            updatedAt: new Date()
        };
        this.sessions.set(id, updatedSession);
        return updatedSession;
    }
    async deleteSession(id) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        this.sessionsByToken.delete(session.token);
        return this.sessions.delete(id);
    }
    // Database connection methods (no-op for in-memory)
    async connect() {
        // No connection needed for in-memory
        return;
    }
    async disconnect() {
        // No disconnection needed for in-memory
        return;
    }
}
/**
 * MongoDB adapter implementation
 */
class MongoDBAdapter {
    constructor() {
        this.connected = false;
        // Define MongoDB schemas
        this.UserSchema = new mongoose_1.default.Schema({
            _id: { type: String, default: () => (0, uuid_1.v4)() },
            email: { type: String, lowercase: true, sparse: true, index: true },
            phone: { type: String, sparse: true, index: true },
            displayName: String,
            verified: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        this.TokenSchema = new mongoose_1.default.Schema({
            _id: { type: String, default: () => (0, uuid_1.v4)() },
            userId: { type: String, required: true, index: true },
            token: { type: String, required: true, unique: true, index: true },
            type: { type: String, required: true, enum: Object.values(interfaces_1.TokenType) },
            expiresAt: { type: Date, required: true, index: true },
            used: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        this.SessionSchema = new mongoose_1.default.Schema({
            _id: { type: String, default: () => (0, uuid_1.v4)() },
            userId: { type: String, required: true, index: true },
            token: { type: String, required: true, unique: true, index: true },
            expiresAt: { type: Date, required: true, index: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            lastUsedAt: { type: Date, default: Date.now }
        });
        // Define models
        this.UserModel = mongoose_1.default.model('User', this.UserSchema);
        this.TokenModel = mongoose_1.default.model('Token', this.TokenSchema);
        this.SessionModel = mongoose_1.default.model('Session', this.SessionSchema);
    }
    // Helper function to convert Mongoose document to interface
    documentToUser(doc) {
        return {
            id: doc._id,
            email: doc.email,
            phone: doc.phone,
            displayName: doc.displayName,
            verified: doc.verified,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
    documentToToken(doc) {
        return {
            id: doc._id,
            userId: doc.userId,
            token: doc.token,
            type: doc.type,
            expiresAt: doc.expiresAt,
            used: doc.used,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
    documentToSession(doc) {
        return {
            id: doc._id,
            userId: doc.userId,
            token: doc.token,
            expiresAt: doc.expiresAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            lastUsedAt: doc.lastUsedAt
        };
    }
    // User operations
    async findUserById(id) {
        const doc = await this.UserModel.findById(id).exec();
        return doc ? this.documentToUser(doc) : null;
    }
    async findUserByEmail(email) {
        const doc = await this.UserModel.findOne({ email: email.toLowerCase() }).exec();
        return doc ? this.documentToUser(doc) : null;
    }
    async findUserByPhone(phone) {
        const doc = await this.UserModel.findOne({ phone }).exec();
        return doc ? this.documentToUser(doc) : null;
    }
    async createUser(userData) {
        const doc = await this.UserModel.create({
            _id: userData.id || undefined,
            email: userData.email,
            phone: userData.phone,
            displayName: userData.displayName,
            verified: userData.verified || false,
            createdAt: userData.createdAt || undefined,
            updatedAt: userData.updatedAt || undefined
        });
        return this.documentToUser(doc);
    }
    async updateUser(id, updates) {
        const doc = await this.UserModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).exec();
        return doc ? this.documentToUser(doc) : null;
    }
    // Token operations
    async findTokenById(id) {
        const doc = await this.TokenModel.findById(id).exec();
        return doc ? this.documentToToken(doc) : null;
    }
    async findTokenByToken(token) {
        const doc = await this.TokenModel.findOne({ token }).exec();
        return doc ? this.documentToToken(doc) : null;
    }
    async createToken(tokenData) {
        const doc = await this.TokenModel.create({
            _id: tokenData.id || undefined,
            userId: tokenData.userId,
            token: tokenData.token,
            type: tokenData.type,
            expiresAt: tokenData.expiresAt,
            used: tokenData.used || false,
            createdAt: tokenData.createdAt || undefined,
            updatedAt: tokenData.updatedAt || undefined
        });
        return this.documentToToken(doc);
    }
    async updateToken(id, updates) {
        const doc = await this.TokenModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).exec();
        return doc ? this.documentToToken(doc) : null;
    }
    // Session operations
    async findSessionById(id) {
        const doc = await this.SessionModel.findById(id).exec();
        return doc ? this.documentToSession(doc) : null;
    }
    async findSessionByToken(token) {
        const doc = await this.SessionModel.findOne({ token }).exec();
        return doc ? this.documentToSession(doc) : null;
    }
    async createSession(sessionData) {
        const doc = await this.SessionModel.create({
            _id: sessionData.id || undefined,
            userId: sessionData.userId,
            token: sessionData.token,
            expiresAt: sessionData.expiresAt,
            createdAt: sessionData.createdAt || undefined,
            updatedAt: sessionData.updatedAt || undefined,
            lastUsedAt: sessionData.lastUsedAt || undefined
        });
        return this.documentToSession(doc);
    }
    async updateSession(id, updates) {
        const doc = await this.SessionModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).exec();
        return doc ? this.documentToSession(doc) : null;
    }
    async deleteSession(id) {
        const result = await this.SessionModel.deleteOne({ _id: id }).exec();
        return result.deletedCount > 0;
    }
    // Database connection
    async connect() {
        if (this.connected)
            return;
        await mongoose_1.default.connect(config_1.default.db.uri);
        this.connected = true;
    }
    async disconnect() {
        if (!this.connected)
            return;
        await mongoose_1.default.disconnect();
        this.connected = false;
    }
}
// Storage service that uses the appropriate adapter
class StorageService {
    constructor() {
        // Select adapter based on configuration
        if (config_1.default.storage.type === 'mongodb') {
            this.adapter = new MongoDBAdapter();
        }
        else {
            // Default to in-memory for demo purposes
            this.adapter = new InMemoryAdapter();
        }
    }
    // Connect to the database
    async connect() {
        return this.adapter.connect();
    }
    // Disconnect from the database
    async disconnect() {
        return this.adapter.disconnect();
    }
    // User operations
    async findUserById(id) {
        return this.adapter.findUserById(id);
    }
    async findUserByEmail(email) {
        return this.adapter.findUserByEmail(email);
    }
    async findUserByPhone(phone) {
        return this.adapter.findUserByPhone(phone);
    }
    async createUser(userData) {
        return this.adapter.createUser(userData);
    }
    async updateUser(id, updates) {
        return this.adapter.updateUser(id, updates);
    }
    // Token operations
    async findTokenById(id) {
        return this.adapter.findTokenById(id);
    }
    async findTokenByToken(token) {
        return this.adapter.findTokenByToken(token);
    }
    async createToken(tokenData) {
        return this.adapter.createToken(tokenData);
    }
    async updateToken(id, updates) {
        return this.adapter.updateToken(id, updates);
    }
    // Session operations
    async findSessionById(id) {
        return this.adapter.findSessionById(id);
    }
    async findSessionByToken(token) {
        return this.adapter.findSessionByToken(token);
    }
    async createSession(sessionData) {
        return this.adapter.createSession(sessionData);
    }
    async updateSession(id, updates) {
        return this.adapter.updateSession(id, updates);
    }
    async deleteSession(id) {
        return this.adapter.deleteSession(id);
    }
}
exports.default = new StorageService();
//# sourceMappingURL=storageService.js.map