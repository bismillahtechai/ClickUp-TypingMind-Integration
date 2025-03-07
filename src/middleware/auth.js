/**
 * Authentication middleware for validating API access
 */

const { getLogger } = require('../utils/logger');
const logger = getLogger('auth');

// Load API keys from environment or configuration
// In production, use a secure method for storing these keys
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['dev-key-123']; // Default dev key

// Log API key configuration at startup
logger.info(`Loaded ${API_KEYS.length} API keys from configuration`);

/**
 * Middleware to validate the TypingMind API key
 */
function validateApiKey(req, res, next) {
  // Get the API key from the request headers or query parameters
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  logger.debug('Validating API key', { 
    hasApiKey: !!apiKey, 
    requestPath: req.path,
    requestId: req.requestId
  });
  
  if (!apiKey) {
    logger.warn('API key validation failed: No API key provided', { 
      requestPath: req.path,
      ip: req.ip,
      requestId: req.requestId
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'API key is required' 
    });
  }
  
  // Check if the API key is valid
  if (!API_KEYS.includes(apiKey)) {
    logger.warn('API key validation failed: Invalid API key provided', { 
      requestPath: req.path,
      ip: req.ip,
      requestId: req.requestId,
      apiKeyLength: apiKey ? apiKey.length : 0
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid API key' 
    });
  }
  
  // API key is valid, proceed
  logger.debug('API key validation successful', { 
    requestPath: req.path,
    requestId: req.requestId
  });
  
  next();
}

/**
 * Middleware to validate ClickUp tokens
 */
function validateClickUpToken(req, res, next) {
  // Get the user ID from the request
  const userId = req.headers['x-user-id'] || req.query.user_id;
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'User ID is required' 
    });
  }
  
  // Check if the user has a stored token
  if (!tokenManager.hasToken(userId)) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'ClickUp token not found for this user. Please register your token first.' 
    });
  }
  
  // Add the userId to the request for later use
  req.userId = userId;
  
  // Token exists, proceed
  next();
}

/**
 * Middleware to register a ClickUp token
 */
function registerClickUpToken(req, res) {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both userId and token are required'
    });
  }
  
  // Validate the token format
  if (!tokenManager.isValidTokenFormat(token)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid ClickUp token format. Token should start with "pk_"'
    });
  }
  
  // Store the token
  try {
    tokenManager.storeToken(userId, token);
    
    return res.status(200).json({
      success: true,
      message: 'ClickUp token registered successfully'
    });
  } catch (error) {
    console.error('Error registering token:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

module.exports = {
  validateApiKey,
  validateClickUpToken,
  registerClickUpToken
}; 