export const LOCK_CONFIG = {
    // Default lock TTL in milliseconds (24 hours - realistic for production)
    DEFAULT_TTL_MS: 24 * 60 * 60 * 1000,
    
    // Maximum lock TTL (7 days)
    MAX_TTL_MS: 7 * 24 * 60 * 60 * 1000,
    
    // Lock cleanup interval (every 5 minutes)
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
} as const;
