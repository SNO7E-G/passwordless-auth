import { User, AuthToken, Session } from '../interfaces';
declare class StorageService {
    private adapter;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    findUserById(id: string): Promise<User | null>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserByPhone(phone: string): Promise<User | null>;
    createUser(userData: Partial<User>): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    findTokenById(id: string): Promise<AuthToken | null>;
    findTokenByToken(token: string): Promise<AuthToken | null>;
    createToken(tokenData: Partial<AuthToken>): Promise<AuthToken>;
    updateToken(id: string, updates: Partial<AuthToken>): Promise<AuthToken | null>;
    findSessionById(id: string): Promise<Session | null>;
    findSessionByToken(token: string): Promise<Session | null>;
    createSession(sessionData: Partial<Session>): Promise<Session>;
    updateSession(id: string, updates: Partial<Session>): Promise<Session | null>;
    deleteSession(id: string): Promise<boolean>;
}
declare const _default: StorageService;
export default _default;
