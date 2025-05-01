import { User, AuthToken, Session, TokenType } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import config from '../config';

/**
 * Storage adapter interface for database interactions
 */
interface StorageAdapter {
  // User operations
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  
  // Token operations
  findTokenById(id: string): Promise<AuthToken | null>;
  findTokenByToken(token: string): Promise<AuthToken | null>;
  createToken(tokenData: Partial<AuthToken>): Promise<AuthToken>;
  updateToken(id: string, updates: Partial<AuthToken>): Promise<AuthToken | null>;
  
  // Session operations
  findSessionById(id: string): Promise<Session | null>;
  findSessionByToken(token: string): Promise<Session | null>;
  createSession(sessionData: Partial<Session>): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | null>;
  deleteSession(id: string): Promise<boolean>;
  
  // Database connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * In-memory storage adapter for demo purposes
 */
class InMemoryAdapter implements StorageAdapter {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private sessions: Map<string, Session> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private usersByPhone: Map<string, string> = new Map();
  private tokensByToken: Map<string, string> = new Map();
  private sessionsByToken: Map<string, string> = new Map();
  
  // User operations
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }
  
  async findUserByPhone(phone: string): Promise<User | null> {
    const userId = this.usersByPhone.get(phone);
    return userId ? this.users.get(userId) || null : null;
  }
  
  async createUser(userData: Partial<User>): Promise<User> {
    const id = userData.id || uuidv4();
    const now = new Date();
    const user: User = {
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
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existingUser = this.users.get(id);
    if (!existingUser) return null;
    
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
    
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      id, // ensure ID isn't changed
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Token operations
  async findTokenById(id: string): Promise<AuthToken | null> {
    return this.tokens.get(id) || null;
  }
  
  async findTokenByToken(token: string): Promise<AuthToken | null> {
    const tokenId = this.tokensByToken.get(token);
    return tokenId ? this.tokens.get(tokenId) || null : null;
  }
  
  async createToken(tokenData: Partial<AuthToken>): Promise<AuthToken> {
    const id = tokenData.id || uuidv4();
    const now = new Date();
    
    if (!tokenData.userId || !tokenData.token || !tokenData.type || !tokenData.expiresAt) {
      throw new Error('Missing required token data');
    }
    
    const token: AuthToken = {
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
  
  async updateToken(id: string, updates: Partial<AuthToken>): Promise<AuthToken | null> {
    const existingToken = this.tokens.get(id);
    if (!existingToken) return null;
    
    const updatedToken: AuthToken = {
      ...existingToken,
      ...updates,
      id, // ensure ID isn't changed
      updatedAt: new Date()
    };
    
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }
  
  // Session operations
  async findSessionById(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }
  
  async findSessionByToken(token: string): Promise<Session | null> {
    const sessionId = this.sessionsByToken.get(token);
    return sessionId ? this.sessions.get(sessionId) || null : null;
  }
  
  async createSession(sessionData: Partial<Session>): Promise<Session> {
    const id = sessionData.id || uuidv4();
    const now = new Date();
    
    if (!sessionData.userId || !sessionData.token || !sessionData.expiresAt) {
      throw new Error('Missing required session data');
    }
    
    const session: Session = {
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
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return null;
    
    const updatedSession: Session = {
      ...existingSession,
      ...updates,
      id, // ensure ID isn't changed
      updatedAt: new Date()
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async deleteSession(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;
    
    this.sessionsByToken.delete(session.token);
    return this.sessions.delete(id);
  }
  
  // Database connection methods (no-op for in-memory)
  async connect(): Promise<void> {
    // No connection needed for in-memory
    return;
  }
  
  async disconnect(): Promise<void> {
    // No disconnection needed for in-memory
    return;
  }
}

/**
 * MongoDB adapter implementation
 */
class MongoDBAdapter implements StorageAdapter {
  private connected = false;
  
  // Define MongoDB schemas
  private UserSchema = new mongoose.Schema({
    _id: { type: String, default: () => uuidv4() },
    email: { type: String, lowercase: true, sparse: true, index: true },
    phone: { type: String, sparse: true, index: true },
    displayName: String,
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  private TokenSchema = new mongoose.Schema({
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: Object.values(TokenType) },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  private SessionSchema = new mongoose.Schema({
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now }
  });
  
  // Define models
  private UserModel = mongoose.model('User', this.UserSchema);
  private TokenModel = mongoose.model('Token', this.TokenSchema);
  private SessionModel = mongoose.model('Session', this.SessionSchema);
  
  // Helper function to convert Mongoose document to interface
  private documentToUser(doc: any): User {
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
  
  private documentToToken(doc: any): AuthToken {
    return {
      id: doc._id,
      userId: doc.userId,
      token: doc.token,
      type: doc.type as TokenType,
      expiresAt: doc.expiresAt,
      used: doc.used,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
  
  private documentToSession(doc: any): Session {
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
  async findUserById(id: string): Promise<User | null> {
    const doc = await this.UserModel.findById(id).exec();
    return doc ? this.documentToUser(doc) : null;
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    const doc = await this.UserModel.findOne({ email: email.toLowerCase() }).exec();
    return doc ? this.documentToUser(doc) : null;
  }
  
  async findUserByPhone(phone: string): Promise<User | null> {
    const doc = await this.UserModel.findOne({ phone }).exec();
    return doc ? this.documentToUser(doc) : null;
  }
  
  async createUser(userData: Partial<User>): Promise<User> {
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
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const doc = await this.UserModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    return doc ? this.documentToUser(doc) : null;
  }
  
  // Token operations
  async findTokenById(id: string): Promise<AuthToken | null> {
    const doc = await this.TokenModel.findById(id).exec();
    return doc ? this.documentToToken(doc) : null;
  }
  
  async findTokenByToken(token: string): Promise<AuthToken | null> {
    const doc = await this.TokenModel.findOne({ token }).exec();
    return doc ? this.documentToToken(doc) : null;
  }
  
  async createToken(tokenData: Partial<AuthToken>): Promise<AuthToken> {
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
  
  async updateToken(id: string, updates: Partial<AuthToken>): Promise<AuthToken | null> {
    const doc = await this.TokenModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    return doc ? this.documentToToken(doc) : null;
  }
  
  // Session operations
  async findSessionById(id: string): Promise<Session | null> {
    const doc = await this.SessionModel.findById(id).exec();
    return doc ? this.documentToSession(doc) : null;
  }
  
  async findSessionByToken(token: string): Promise<Session | null> {
    const doc = await this.SessionModel.findOne({ token }).exec();
    return doc ? this.documentToSession(doc) : null;
  }
  
  async createSession(sessionData: Partial<Session>): Promise<Session> {
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
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const doc = await this.SessionModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    return doc ? this.documentToSession(doc) : null;
  }
  
  async deleteSession(id: string): Promise<boolean> {
    const result = await this.SessionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
  
  // Database connection
  async connect(): Promise<void> {
    if (this.connected) return;
    
    await mongoose.connect(config.db.uri);
    this.connected = true;
  }
  
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    await mongoose.disconnect();
    this.connected = false;
  }
}

// Storage service that uses the appropriate adapter
class StorageService {
  private adapter: StorageAdapter;
  
  constructor() {
    // Select adapter based on configuration
    if (config.storage.type === 'mongodb') {
      this.adapter = new MongoDBAdapter();
    } else {
      // Default to in-memory for demo purposes
      this.adapter = new InMemoryAdapter();
    }
  }
  
  // Connect to the database
  async connect(): Promise<void> {
    return this.adapter.connect();
  }
  
  // Disconnect from the database
  async disconnect(): Promise<void> {
    return this.adapter.disconnect();
  }
  
  // User operations
  async findUserById(id: string): Promise<User | null> {
    return this.adapter.findUserById(id);
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    return this.adapter.findUserByEmail(email);
  }
  
  async findUserByPhone(phone: string): Promise<User | null> {
    return this.adapter.findUserByPhone(phone);
  }
  
  async createUser(userData: Partial<User>): Promise<User> {
    return this.adapter.createUser(userData);
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.adapter.updateUser(id, updates);
  }
  
  // Token operations
  async findTokenById(id: string): Promise<AuthToken | null> {
    return this.adapter.findTokenById(id);
  }
  
  async findTokenByToken(token: string): Promise<AuthToken | null> {
    return this.adapter.findTokenByToken(token);
  }
  
  async createToken(tokenData: Partial<AuthToken>): Promise<AuthToken> {
    return this.adapter.createToken(tokenData);
  }
  
  async updateToken(id: string, updates: Partial<AuthToken>): Promise<AuthToken | null> {
    return this.adapter.updateToken(id, updates);
  }
  
  // Session operations
  async findSessionById(id: string): Promise<Session | null> {
    return this.adapter.findSessionById(id);
  }
  
  async findSessionByToken(token: string): Promise<Session | null> {
    return this.adapter.findSessionByToken(token);
  }
  
  async createSession(sessionData: Partial<Session>): Promise<Session> {
    return this.adapter.createSession(sessionData);
  }
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    return this.adapter.updateSession(id, updates);
  }
  
  async deleteSession(id: string): Promise<boolean> {
    return this.adapter.deleteSession(id);
  }
}

export default new StorageService(); 