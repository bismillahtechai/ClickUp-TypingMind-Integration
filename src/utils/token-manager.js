/**
 * Token Manager for handling ClickUp API tokens
 * 
 * In a production environment, you'd want to store these securely
 * in a database with proper encryption
 */

const { getLogger } = require('./logger');
const logger = getLogger('token-manager');

// In-memory token storage (for demo purposes only)
// In production, this should be replaced with a secure database solution
const tokens = new Map();

class TokenManager {
  constructor() {
    logger.info('TokenManager initialized');
  }
  
  /**
   * Store a user's ClickUp API token
   * @param {string} userId The user ID
   * @param {string} token The ClickUp API token
   */
  storeToken(userId, token) {
    if (!userId) {
      logger.error('Cannot store token: User ID is required');
      throw new Error('User ID is required');
    }
    
    if (!token || !token.startsWith('pk_')) {
      logger.error(`Invalid token format provided for user ${userId}`);
      throw new Error('Invalid ClickUp API token format. Token should start with "pk_"');
    }
    
    tokens.set(userId, token);
    logger.info(`Token stored for user ${userId}`);
    return true;
  }
  
  /**
   * Get a user's ClickUp API token
   * @param {string} userId The user ID
   * @returns {string|null} The stored token or null if not found
   */
  getToken(userId) {
    if (!userId) {
      logger.warn('getToken called without userId');
      return null;
    }
    
    const token = tokens.get(userId);
    if (!token) {
      logger.warn(`No token found for user ${userId}`);
    } else {
      logger.debug(`Retrieved token for user ${userId}`);
    }
    
    return token || null;
  }
  
  /**
   * Check if a user has a stored token
   * @param {string} userId The user ID
   * @returns {boolean} True if the token exists, false otherwise
   */
  hasToken(userId) {
    const hasToken = tokens.has(userId);
    logger.debug(`Checking token existence for user ${userId}: ${hasToken ? 'Found' : 'Not found'}`);
    return hasToken;
  }
  
  /**
   * Remove a user's token
   * @param {string} userId The user ID
   * @returns {boolean} True if the token was removed, false otherwise
   */
  removeToken(userId) {
    if (!userId) {
      logger.warn('removeToken called without userId');
      return false;
    }
    
    const removed = tokens.delete(userId);
    logger.info(`Token ${removed ? 'removed' : 'not found'} for user ${userId}`);
    return removed;
  }
  
  /**
   * Validate a ClickUp API token format
   * @param {string} token The token to validate
   * @returns {boolean} True if the token format is valid
   */
  isValidTokenFormat(token) {
    const isValid = !!token && token.startsWith('pk_') && token.length > 5;
    logger.debug(`Token format validation: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  }
  
  /**
   * Get all user IDs with stored tokens
   * @returns {string[]} Array of user IDs
   */
  getAllUserIds() {
    const userIds = Array.from(tokens.keys());
    logger.debug(`Retrieved ${userIds.length} user IDs`);
    return userIds;
  }
  
  /**
   * Get count of stored tokens
   * @returns {number} Number of stored tokens
   */
  getTokenCount() {
    return tokens.size;
  }
}

// Export a singleton instance
module.exports = {
  tokenManager: new TokenManager()
}; 