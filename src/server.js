const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { clickupRoutes } = require('./routes/clickup.routes');
const { formatResponseForTypingMind } = require('./utils/formatters');
const { validateApiKey } = require('./middleware/auth');
const { getLogger, requestLoggerMiddleware } = require('./utils/logger');

// Initialize logger
const logger = getLogger('server');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Use request logger middleware instead of morgan for better logging
app.use(requestLoggerMiddleware());

// API Key validation middleware for protected routes
app.use('/api', validateApiKey);

// Log startup configuration
logger.info(`Starting server with environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`ClickUp API token in environment: ${process.env.CLICKUP_API_TOKEN ? 'Yes' : 'No'}`);
logger.info(`API keys configured: ${(process.env.API_KEYS || '').split(',').length}`);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// ClickUp API health check endpoint
app.get('/health/clickup', validateApiKey, async (req, res) => {
  logger.info('ClickUp API health check endpoint called');
  try {
    const clickupService = require('./services/clickup.service');
    const health = await clickupService.checkHealth();
    res.status(health.status === 'OK' ? 200 : 500).json(health);
  } catch (error) {
    logger.error('Error in ClickUp health check', { error: error.stack });
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message 
    });
  }
});

// Token registration endpoint
app.post('/api/register-token', validateApiKey, async (req, res) => {
  const { userId, token } = req.body;
  
  logger.info('Token registration requested', { userId });
  
  if (!userId || !token) {
    logger.warn('Token registration failed: missing parameters', { 
      hasUserId: !!userId, 
      hasToken: !!token 
    });
    
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both userId and token are required'
    });
  }
  
  try {
    const { tokenManager } = require('./utils/token-manager');
    
    // Validate the token format
    if (!tokenManager.isValidTokenFormat(token)) {
      logger.warn('Token registration failed: invalid token format', { userId });
      
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ClickUp token format. Token should start with "pk_"'
      });
    }
    
    // Store the token
    tokenManager.storeToken(userId, token);
    logger.info('Token registration successful', { userId });
    
    return res.status(200).json({
      success: true,
      message: 'ClickUp token registered successfully'
    });
  } catch (error) {
    logger.error('Error registering token', { error: error.stack, userId });
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ClickUp API routes
app.use('/api/clickup', clickupRoutes);

// Dynamic Context endpoint for TypingMind
app.get('/context/clickup', validateApiKey, async (req, res) => {
  try {
    // Extract parameters from headers with query params as fallback
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId || process.env.DEFAULT_WORKSPACE_ID;
    const dataType = req.headers['x-data-type'] || req.query.dataType || 'tasks';
    const limit = parseInt(req.headers['x-limit'] || req.query.limit || '10', 10);
    const lastUserMessage = req.headers['x-last-user-message'] || '';
    const userId = req.headers['x-user-id'] || req.query.userId || 'default';
    
    logger.info('Dynamic context endpoint called', { 
      workspaceId, 
      dataType, 
      limit,
      userId,
      requestId: req.requestId,
      hasLastUserMessage: !!lastUserMessage
    });
    
    if (!workspaceId) {
      logger.warn('Missing workspace ID for context endpoint', { requestId: req.requestId });
      return res.status(400).json({ error: 'workspaceId is required in headers or query params' });
    }

    // Get data from our ClickUp service
    const clickupService = require('./services/clickup.service');
    let data;
    
    // Use the last user message to potentially contextualize the query
    const contextualizedQuery = lastUserMessage ? { query: lastUserMessage } : {};
    
    logger.debug('Fetching ClickUp data', { 
      dataType, 
      workspaceId, 
      limit, 
      contextualizedQuery: !!contextualizedQuery.query,
      requestId: req.requestId 
    });
    
    try {
      switch (dataType) {
        case 'tasks':
          data = await clickupService.getRecentTasks(workspaceId, userId, limit, contextualizedQuery);
          break;
        case 'spaces':
          data = await clickupService.getSpaces(workspaceId, userId);
          break;
        case 'lists':
          data = await clickupService.getLists(workspaceId, userId);
          break;
        default:
          data = await clickupService.getRecentTasks(workspaceId, userId, limit);
      }
    } catch (error) {
      logger.error(`Error fetching ${dataType} from ClickUp`, { 
        error: error.stack, 
        workspaceId, 
        dataType,
        requestId: req.requestId
      });
      
      return res.status(500).json({ 
        error: `Failed to fetch ${dataType} from ClickUp`, 
        message: error.message 
      });
    }
    
    // Format the data for TypingMind dynamic context
    logger.debug('Formatting response for TypingMind', { 
      dataType, 
      dataSize: JSON.stringify(data).length,
      requestId: req.requestId 
    });
    
    const formattedData = formatResponseForTypingMind(data, dataType);
    
    logger.info('Dynamic context successfully provided', { 
      dataType, 
      itemCount: Array.isArray(formattedData) ? formattedData.length : 'N/A',
      requestId: req.requestId 
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    logger.error('Unhandled error in dynamic context endpoint', { 
      error: error.stack,
      requestId: req.requestId
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch ClickUp data',
      message: error.message 
    });
  }
});

// Comprehensive Dynamic Context endpoint that aggregates multiple data types
app.get('/context/clickup-all', validateApiKey, async (req, res) => {
  try {
    // Extract parameters from headers with query params as fallback
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId || process.env.DEFAULT_WORKSPACE_ID;
    const dataTypes = (req.headers['x-data-types'] || req.query.dataTypes || 'tasks,lists,spaces').split(',');
    const limit = parseInt(req.headers['x-limit'] || req.query.limit || '10', 10);
    const lastUserMessage = req.headers['x-last-user-message'] || '';
    const userId = req.headers['x-user-id'] || req.query.userId || 'default';
    
    logger.info('Comprehensive context endpoint called', { 
      workspaceId, 
      dataTypes: dataTypes.join(','), 
      limit,
      userId,
      requestId: req.requestId,
      hasLastUserMessage: !!lastUserMessage
    });
    
    if (!workspaceId) {
      logger.warn('Missing workspace ID for context endpoint', { requestId: req.requestId });
      return res.status(400).json({ error: 'workspaceId is required in headers or query params' });
    }

    // Get data from our ClickUp service
    const clickupService = require('./services/clickup.service');
    const contextualizedQuery = lastUserMessage ? { query: lastUserMessage } : {};
    
    // Results object to store all data
    const results = {};
    
    // Process each requested data type
    await Promise.all(dataTypes.map(async (dataType) => {
      try {
        dataType = dataType.trim(); // Remove any whitespace
        logger.debug(`Fetching ClickUp data for ${dataType}`, { 
          workspaceId, 
          limit, 
          requestId: req.requestId 
        });
        
        let data;
        switch (dataType) {
          case 'tasks':
            data = await clickupService.getRecentTasks(workspaceId, userId, limit, contextualizedQuery);
            break;
          case 'spaces':
            data = await clickupService.getSpaces(workspaceId, userId);
            break;
          case 'lists':
            // For lists, we need to get spaces first and then get lists for each space
            const spaces = await clickupService.getSpaces(workspaceId, userId);
            if (spaces && spaces.spaces) {
              // Get the first few spaces based on limit
              const limitedSpaces = spaces.spaces.slice(0, limit);
              const spaceListsPromises = limitedSpaces.map(space => 
                clickupService.getFolderlessLists(space.id, userId)
              );
              const spacesLists = await Promise.all(spaceListsPromises);
              // Combine all lists from all spaces
              data = { lists: [] };
              spacesLists.forEach(spaceList => {
                if (spaceList && spaceList.lists) {
                  data.lists = [...data.lists, ...spaceList.lists];
                }
              });
            } else {
              data = { lists: [] };
            }
            break;
          case 'folders':
            // Similar to lists, get spaces first and then folders for each space
            const spacesForFolders = await clickupService.getSpaces(workspaceId, userId);
            if (spacesForFolders && spacesForFolders.spaces) {
              const limitedSpaces = spacesForFolders.spaces.slice(0, limit);
              const spaceFoldersPromises = limitedSpaces.map(space => 
                clickupService.getFolders(space.id, userId)
              );
              const spacesFolders = await Promise.all(spaceFoldersPromises);
              // Combine all folders from all spaces
              data = { folders: [] };
              spacesFolders.forEach(spaceFolder => {
                if (spaceFolder && spaceFolder.folders) {
                  data.folders = [...data.folders, ...spaceFolder.folders];
                }
              });
            } else {
              data = { folders: [] };
            }
            break;
          default:
            logger.warn(`Unknown data type: ${dataType}, skipping`, { requestId: req.requestId });
            return;
        }
        
        // Format the data for this data type
        const formattedData = formatResponseForTypingMind(data, dataType);
        
        // Add to results
        results[dataType] = formattedData;
        
        logger.info(`Fetched and formatted ${dataType} data`, { 
          dataType, 
          resultSize: JSON.stringify(formattedData).length,
          requestId: req.requestId 
        });
      } catch (error) {
        logger.error(`Error fetching ${dataType} from ClickUp`, { 
          error: error.stack, 
          dataType,
          workspaceId,
          requestId: req.requestId
        });
        // Still add error information to results
        results[dataType] = { 
          text: `Error fetching ${dataType}: ${error.message}`,
          error: true
        };
      }
    }));
    
    // Combine all formatted data into one comprehensive response
    const { formatters } = require('./utils/formatters');
    const comprehensiveResponse = formatters.combineFormattedResponses(results);
    
    logger.info('Comprehensive context successfully provided', { 
      dataTypes: dataTypes.join(','),
      responseSize: JSON.stringify(comprehensiveResponse).length,
      requestId: req.requestId 
    });
    
    res.status(200).json(comprehensiveResponse);
  } catch (error) {
    logger.error('Unhandled error in comprehensive context endpoint', { 
      error: error.stack,
      requestId: req.requestId
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch ClickUp data',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', { 
    error: err.stack, 
    url: req.url,
    method: req.method,
    requestId: req.requestId
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app; 