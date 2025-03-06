/**
 * Token Manager for handling ClickUp API tokens
 * 
 * In a production environment, you'd want to store these securely
 * in a database with proper encryption
 */

// In-memory token storage (for demo purposes only)
// In production, this should be replaced with a secure database solution
const tokens = new Map();

class TokenManager {
  /**
   * Store a user's ClickUp API token
   * @param {string} userId The user ID
   * @param {string} token The ClickUp API token
   */
  storeToken(userId, token) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!token || !token.startsWith('pk_')) {
      throw new Error('Invalid ClickUp API token format. Token should start with "pk_"');
    }
    
    tokens.set(userId, token);
    return true;
  }
  
  /**
   * Get a user's ClickUp API token
   * @param {string} userId The user ID
   * @returns {string|null} The stored token or null if not found
   */
  getToken(userId) {
    if (!userId) {
      return null;
    }
    
    return tokens.get(userId) || null;
  }
  
  /**
   * Check if a user has a stored token
   * @param {string} userId The user ID
   * @returns {boolean} True if the token exists, false otherwise
   */
  hasToken(userId) {
    return tokens.has(userId);
  }
  
  /**
   * Remove a user's token
   * @param {string} userId The user ID
   * @returns {boolean} True if the token was removed, false otherwise
   */
  removeToken(userId) {
    if (!userId) {
      return false;
    }
    
    return tokens.delete(userId);
  }
  
  /**
   * Validate a ClickUp API token format
   * @param {string} token The token to validate
   * @returns {boolean} True if the token format is valid
   */
  isValidTokenFormat(token) {
    return !!token && token.startsWith('pk_') && token.length > 5;
  }
}

// Export a singleton instance
module.exports = {
  tokenManager: new TokenManager()
}; 