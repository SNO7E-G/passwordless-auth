import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { User } from '../interfaces';

interface RiskProfile {
  id: string;
  userId: string;
  riskScore: number;
  lastAssessedAt: Date;
  knownDevices: string[];
  knownIps: string[];
  failedAttempts: number;
  successfulLogins: Map<string, Date>; // device fingerprint -> timestamp
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

enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface AuthenticationRequirement {
  requireMFA: boolean;
  preferredMethods: string[];
  sessionDuration: number; // in minutes
  addToWatchlist: boolean;
  blockAccess: boolean;
}

class AdaptiveAuthService {
  private riskProfiles: Map<string, RiskProfile> = new Map();
  
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
  } {
    // Get or initialize user risk profile
    let profile = this.riskProfiles.get(userId);
    if (!profile) {
      profile = this.initializeRiskProfile(userId);
    }

    // Calculate base risk score from factors
    let riskScore = 50; // Start with a medium baseline

    // Adjust for known IPs
    if (riskFactors.ipAddress && profile.knownIps.includes(riskFactors.ipAddress)) {
      riskScore -= 20;
    } else if (riskFactors.ipAddress) {
      riskScore += 20;
    }

    // Adjust for known devices
    if (riskFactors.deviceFingerprint && 
        profile.knownDevices.includes(riskFactors.deviceFingerprint)) {
      riskScore -= 15;
    } else if (riskFactors.deviceFingerprint) {
      riskScore += 15;
    }

    // Adjust for geographical anomalies (simplified)
    if (riskFactors.geoLocation) {
      // In a real implementation, we would compare against known locations
      // For now, we'll just add a small risk factor
      riskScore += 5;
    }

    // Adjust for time-based anomalies (e.g., unusual login times)
    if (riskFactors.timeOfDay) {
      const hour = riskFactors.timeOfDay.getHours();
      // Higher risk during unusual hours (midnight to 5am)
      if (hour >= 0 && hour < 5) {
        riskScore += 10;
      }
    }

    // Adjust for failed attempts
    riskScore += profile.failedAttempts * 5;

    // Adjust for unusual behavior flags
    riskScore += profile.unusualActivityFlags.length * 10;
    
    // Additional flags from current session
    if (riskFactors.unusualBehavior) {
      riskScore += riskFactors.unusualBehavior.length * 15;
    }

    // Determine risk level based on score
    let riskLevel: RiskLevel;
    if (riskScore < 30) {
      riskLevel = RiskLevel.LOW;
    } else if (riskScore < 60) {
      riskLevel = RiskLevel.MEDIUM;
    } else if (riskScore < 80) {
      riskLevel = RiskLevel.HIGH;
    } else {
      riskLevel = RiskLevel.CRITICAL;
    }

    // Determine authentication requirements based on risk level
    const requirements = this.getAuthRequirements(riskLevel);

    // Update risk profile
    profile.riskScore = riskScore;
    profile.lastAssessedAt = new Date();
    profile.updatedAt = new Date();
    this.riskProfiles.set(userId, profile);

    return { riskLevel, requirements, score: riskScore };
  }

  /**
   * Record a successful login to update the user's risk profile
   * @param userId User ID
   * @param deviceFingerprint Device fingerprint
   * @param ipAddress IP address
   */
  recordSuccessfulLogin(userId: string, deviceFingerprint?: string, ipAddress?: string): void {
    const profile = this.riskProfiles.get(userId);
    if (!profile) return;

    // Reset failed attempts
    profile.failedAttempts = 0;

    // Add to known devices if not already known
    if (deviceFingerprint && !profile.knownDevices.includes(deviceFingerprint)) {
      profile.knownDevices.push(deviceFingerprint);
      // Limit the number of known devices to prevent memory growth
      if (profile.knownDevices.length > 10) {
        profile.knownDevices.shift(); // Remove oldest device
      }
    }

    // Add to known IPs if not already known
    if (ipAddress && !profile.knownIps.includes(ipAddress)) {
      profile.knownIps.push(ipAddress);
      // Limit the number of known IPs to prevent memory growth
      if (profile.knownIps.length > 10) {
        profile.knownIps.shift(); // Remove oldest IP
      }
    }

    // Record login time for this device
    if (deviceFingerprint) {
      profile.successfulLogins.set(deviceFingerprint, new Date());
      // Limit the size of the map
      if (profile.successfulLogins.size > 10) {
        // Remove oldest login
        const oldest = [...profile.successfulLogins.entries()]
          .sort((a, b) => a[1].getTime() - b[1].getTime())[0][0];
        profile.successfulLogins.delete(oldest);
      }
    }

    profile.updatedAt = new Date();
    this.riskProfiles.set(userId, profile);
  }

  /**
   * Record a failed login attempt to update risk profile
   * @param userId User ID
   * @param ipAddress IP address of the attempt
   * @param reason Reason for failure
   */
  recordFailedLogin(userId: string, ipAddress?: string, reason?: string): void {
    let profile = this.riskProfiles.get(userId);
    if (!profile) {
      profile = this.initializeRiskProfile(userId);
    }

    // Increment failed attempts
    profile.failedAttempts += 1;

    // Add to unusual activity if too many failed attempts
    if (profile.failedAttempts >= 3) {
      const flag = `Multiple failed login attempts (${profile.failedAttempts})`;
      if (!profile.unusualActivityFlags.includes(flag)) {
        profile.unusualActivityFlags.push(flag);
      }
    }

    // Add specific reason flag if provided
    if (reason && !profile.unusualActivityFlags.includes(reason)) {
      profile.unusualActivityFlags.push(reason);
      // Limit flags to prevent memory growth
      if (profile.unusualActivityFlags.length > 10) {
        profile.unusualActivityFlags.shift();
      }
    }

    profile.updatedAt = new Date();
    this.riskProfiles.set(userId, profile);
  }

  /**
   * Reset the risk flags for a user (e.g., after manual verification)
   * @param userId User ID
   */
  resetRiskProfile(userId: string): boolean {
    const profile = this.riskProfiles.get(userId);
    if (!profile) return false;

    profile.failedAttempts = 0;
    profile.unusualActivityFlags = [];
    profile.riskScore = 20; // Reset to a lower baseline
    profile.updatedAt = new Date();
    
    this.riskProfiles.set(userId, profile);
    return true;
  }

  /**
   * Get authentication requirements based on risk level
   * @param riskLevel Assessed risk level
   * @returns Authentication requirements
   */
  private getAuthRequirements(riskLevel: RiskLevel): AuthenticationRequirement {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return {
          requireMFA: false,
          preferredMethods: ['magic_link'],
          sessionDuration: 60 * 24, // 24 hours
          addToWatchlist: false,
          blockAccess: false
        };
      case RiskLevel.MEDIUM:
        return {
          requireMFA: false,
          preferredMethods: ['magic_link', 'otp_email'],
          sessionDuration: 60 * 6, // 6 hours
          addToWatchlist: false,
          blockAccess: false
        };
      case RiskLevel.HIGH:
        return {
          requireMFA: true,
          preferredMethods: ['totp', 'otp_sms'],
          sessionDuration: 30, // 30 minutes
          addToWatchlist: true,
          blockAccess: false
        };
      case RiskLevel.CRITICAL:
        return {
          requireMFA: true,
          preferredMethods: ['webauthn'],
          sessionDuration: 15, // 15 minutes
          addToWatchlist: true,
          blockAccess: true
        };
      default:
        // Default to medium security
        return {
          requireMFA: true,
          preferredMethods: ['totp', 'otp_email'],
          sessionDuration: 60, // 1 hour
          addToWatchlist: false,
          blockAccess: false
        };
    }
  }

  /**
   * Initialize a new risk profile for a user
   * @param userId User ID
   * @returns New risk profile
   */
  private initializeRiskProfile(userId: string): RiskProfile {
    const profile: RiskProfile = {
      id: uuidv4(),
      userId,
      riskScore: 50, // Start with medium risk
      lastAssessedAt: new Date(),
      knownDevices: [],
      knownIps: [],
      failedAttempts: 0,
      successfulLogins: new Map(),
      unusualActivityFlags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.riskProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Get the risk profile for a user
   * @param userId User ID
   * @returns User's risk profile or null if not found
   */
  getRiskProfile(userId: string): RiskProfile | null {
    return this.riskProfiles.get(userId) || null;
  }
  
  /**
   * Check if a specific authentication method should be enforced
   * @param userId User ID
   * @param riskFactors Risk factors for this session
   * @returns Recommended auth method or null if no specific recommendation
   */
  getRecommendedAuthMethod(userId: string, riskFactors: RiskFactors): string | null {
    const assessment = this.assessRisk(userId, riskFactors);
    
    if (assessment.riskLevel === RiskLevel.LOW) {
      return null; // Let the user choose any method
    }
    
    // Return the first preferred method for the risk level
    return assessment.requirements.preferredMethods[0] || null;
  }
}

export default new AdaptiveAuthService(); 