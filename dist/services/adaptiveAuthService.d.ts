interface RiskProfile {
    id: string;
    userId: string;
    riskScore: number;
    lastAssessedAt: Date;
    knownDevices: string[];
    knownIps: string[];
    failedAttempts: number;
    successfulLogins: Map<string, Date>;
    unusualActivityFlags: string[];
    createdAt: Date;
    updatedAt: Date;
}
interface RiskFactors {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geoLocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
    timeOfDay?: Date;
    unusualBehavior?: string[];
}
declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
interface AuthenticationRequirement {
    requireMFA: boolean;
    preferredMethods: string[];
    sessionDuration: number;
    addToWatchlist: boolean;
    blockAccess: boolean;
}
declare class AdaptiveAuthService {
    private riskProfiles;
    /**
     * Assess risk for a login attempt and determine authentication requirements
     * @param userId User ID or email
     * @param riskFactors Factors to assess risk
     * @returns Authentication requirements based on risk assessment
     */
    assessRisk(userId: string, riskFactors: RiskFactors): {
        riskLevel: RiskLevel;
        requirements: AuthenticationRequirement;
        score: number;
    };
    /**
     * Record a successful login to update the user's risk profile
     * @param userId User ID
     * @param deviceFingerprint Device fingerprint
     * @param ipAddress IP address
     */
    recordSuccessfulLogin(userId: string, deviceFingerprint?: string, ipAddress?: string): void;
    /**
     * Record a failed login attempt to update risk profile
     * @param userId User ID
     * @param ipAddress IP address of the attempt
     * @param reason Reason for failure
     */
    recordFailedLogin(userId: string, ipAddress?: string, reason?: string): void;
    /**
     * Reset the risk flags for a user (e.g., after manual verification)
     * @param userId User ID
     */
    resetRiskProfile(userId: string): boolean;
    /**
     * Get authentication requirements based on risk level
     * @param riskLevel Assessed risk level
     * @returns Authentication requirements
     */
    private getAuthRequirements;
    /**
     * Initialize a new risk profile for a user
     * @param userId User ID
     * @returns New risk profile
     */
    private initializeRiskProfile;
    /**
     * Get the risk profile for a user
     * @param userId User ID
     * @returns User's risk profile or null if not found
     */
    getRiskProfile(userId: string): RiskProfile | null;
    /**
     * Check if a specific authentication method should be enforced
     * @param userId User ID
     * @param riskFactors Risk factors for this session
     * @returns Recommended auth method or null if no specific recommendation
     */
    getRecommendedAuthMethod(userId: string, riskFactors: RiskFactors): string | null;
}
declare const _default: AdaptiveAuthService;
export default _default;
