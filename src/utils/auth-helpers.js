/**
 * Authentication helper functions
 */

/**
 * Extract the user ID from a request
 * Checks both the headers and query parameters
 * 
 * @param {object} req - Express request object
 * @returns {string|null} - The user ID or null if not found
 */
function getUserIdFromRequest(req) {
  const userId = req.userId || req.headers['x-user-id'] || req.query.user_id;
  
  if (!userId) {
    throw new Error('User ID not found in request');
  }
  
  return userId;
}

/**
 * Generate a random API key for testing
 * Note: Not for production use
 * 
 * @returns {string} - A random API key
 */
function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

module.exports = {
  getUserIdFromRequest,
  generateApiKey
}; 