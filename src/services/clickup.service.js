const fetch = require('node-fetch');
const { tokenManager } = require('../utils/token-manager');
const { getLogger } = require('../utils/logger');

// Create a logger for ClickUp service
const logger = getLogger('clickup-service');

class ClickUpService {
  constructor() {
    this.baseUrlV2 = 'https://api.clickup.com/api/v2';
    
    // In the updated version, we'll use the environment token directly
    this.token = process.env.CLICKUP_API_TOKEN;
    
    if (this.token) {
      logger.info('ClickUp service initialized with token from environment');
    } else {
      logger.warn('No ClickUp API token found in environment variables');
    }
  }

  // Get the headers for ClickUp API requests
  getHeaders(userId) {
    let token;
    
    // First try to get token from environment
    if (this.token) {
      token = this.token;
      logger.debug('Using ClickUp token from environment');
    } 
    // Then try to get it from the token manager if userId is provided
    else if (userId) {
      token = tokenManager.getToken(userId);
      if (token) {
        logger.debug(`Using ClickUp token for user ${userId}`);
      } else {
        logger.error(`No ClickUp API token found for user ${userId}`);
        throw new Error('No ClickUp API token found for this user');
      }
    } 
    // If neither is available, throw an error
    else {
      logger.error('No ClickUp API token available (not in env, no userId provided)');
      throw new Error('No ClickUp API token available');
    }
    
    return {
      'Authorization': token,
      'Content-Type': 'application/json'
    };
  }

  // Fetch data from the ClickUp API
  async fetchFromClickUp(url, method, headers, body = null, requestId = null) {
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };
    
    // Log the API call (without including the actual token)
    const sanitizedHeaders = { ...headers };
    if (sanitizedHeaders.Authorization) {
      sanitizedHeaders.Authorization = 'pk_****';
    }
    
    logger.debug(`API Request: ${method} ${url}`, { 
      requestId, 
      headers: sanitizedHeaders,
      bodySize: body ? JSON.stringify(body).length : 0
    });
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      
      // Log response status and time
      logger.debug(`API Response: ${response.status} (${responseTime}ms)`, { 
        requestId,
        status: response.status,
        responseTime
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          logger.error(`ClickUp API error: ${response.status}`, { 
            requestId,
            status: response.status,
            error: errorData
          });
        } catch (e) {
          errorData = { err: response.statusText };
          logger.error(`ClickUp API error: ${response.status} (failed to parse response)`, { 
            requestId,
            status: response.status,
            statusText: response.statusText
          });
        }
        
        throw new Error(errorData.err || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log successful data retrieval (without logging the entire payload)
      logger.debug(`API data received successfully`, { 
        requestId,
        dataSize: JSON.stringify(data).length
      });
      
      return data;
    } catch (error) {
      logger.error(`ClickUp API request failed: ${error.message}`, {
        requestId,
        url,
        method,
        error: error.stack
      });
      throw error;
    }
  }

  // Health check for ClickUp API
  async checkHealth() {
    try {
      logger.info('Performing ClickUp API health check');
      
      // Try using environment token first
      let headers;
      try {
        headers = this.getHeaders();
      } catch (e) {
        logger.warn('No token in environment, trying to use first registered token');
        // If no environment token, try the first user token we can find (if any)
        const userIds = tokenManager.getAllUserIds();
        
        if (userIds.length === 0) {
          logger.error('No tokens available for health check');
          return { 
            status: 'ERROR', 
            message: 'No ClickUp API tokens available', 
            configurationStatus: this.getConfigurationStatus() 
          };
        }
        
        headers = this.getHeaders(userIds[0]);
      }
      
      // Make a simple API call to check connectivity
      await this.fetchFromClickUp(`${this.baseUrlV2}/user`, 'GET', headers);
      
      logger.info('ClickUp API health check successful');
      return { 
        status: 'OK', 
        message: 'Connected to ClickUp API successfully',
        configurationStatus: this.getConfigurationStatus()
      };
    } catch (error) {
      logger.error(`ClickUp API health check failed: ${error.message}`, { error: error.stack });
      return { 
        status: 'ERROR', 
        message: error.message,
        configurationStatus: this.getConfigurationStatus()
      };
    }
  }
  
  // Get configuration status
  getConfigurationStatus() {
    return {
      environmentToken: !!this.token,
      userTokensCount: tokenManager.getAllUserIds().length
    };
  }

  // Get all workspaces for a user
  async getWorkspaces(userId) {
    logger.info(`Fetching workspaces`, { userId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/team`, 'GET', headers);
  }

  // Get all spaces in a workspace
  async getSpaces(workspaceId, userId) {
    logger.info(`Fetching spaces for workspace ${workspaceId}`, { userId, workspaceId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/team/${workspaceId}/space`, 'GET', headers);
  }

  // Get all lists in a space (folderless)
  async getFolderlessLists(spaceId, userId) {
    logger.info(`Fetching folderless lists for space ${spaceId}`, { userId, spaceId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/space/${spaceId}/list`, 'GET', headers);
  }

  // Get all folders in a space
  async getFolders(spaceId, userId) {
    logger.info(`Fetching folders for space ${spaceId}`, { userId, spaceId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/space/${spaceId}/folder`, 'GET', headers);
  }

  // Get all lists in a folder
  async getLists(folderId, userId) {
    logger.info(`Fetching lists for folder ${folderId}`, { userId, folderId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/folder/${folderId}/list`, 'GET', headers);
  }

  // Get all tasks in a list
  async getTasks(listId, userId, page = 0, limit = 100) {
    logger.info(`Fetching tasks for list ${listId}`, { userId, listId, page, limit });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(
      `${this.baseUrlV2}/list/${listId}/task?page=${page}&limit=${limit}`,
      'GET',
      headers
    );
  }

  // Get recent tasks from a workspace - this combines multiple API calls
  async getRecentTasks(workspaceId, userId, limit = 10, context = {}) {
    logger.info(`Fetching recent tasks for workspace ${workspaceId}`, { 
      userId, 
      workspaceId, 
      limit,
      hasContext: !!context.query
    });
    
    // Get headers (will try env token first, then user token)
    const headers = this.token ? this.getHeaders() : this.getHeaders(userId);
    
    // Use the filtered team tasks endpoint to get recent tasks
    let filterUrl = `${this.baseUrlV2}/team/${workspaceId}/task?page=0&limit=${limit}&order_by=updated&reverse=true`;
    
    // Add contextual filtering if provided
    if (context && context.query) {
      logger.debug(`Applying context filter to task query`, { query: context.query });
      filterUrl += `&search=${encodeURIComponent(context.query)}`;
    }
    
    logger.debug(`Using URL: ${filterUrl}`);
    const response = await this.fetchFromClickUp(filterUrl, 'GET', headers);
    
    logger.info(`Retrieved ${response.tasks ? response.tasks.length : 0} tasks`);
    return response;
  }

  // Get a specific task
  async getTask(taskId, userId) {
    logger.info(`Fetching task ${taskId}`, { userId, taskId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}`, 'GET', headers);
  }

  // Create a task
  async createTask(listId, taskData, userId) {
    logger.info(`Creating task in list ${listId}`, { userId, listId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/list/${listId}/task`, 'POST', headers, taskData);
  }

  // Update a task
  async updateTask(taskId, taskData, userId) {
    logger.info(`Updating task ${taskId}`, { userId, taskId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}`, 'PUT', headers, taskData);
  }

  // Get all comments for a task
  async getTaskComments(taskId, userId) {
    logger.info(`Fetching comments for task ${taskId}`, { userId, taskId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}/comment`, 'GET', headers);
  }

  // Add a comment to a task
  async addTaskComment(taskId, commentText, userId) {
    logger.info(`Adding comment to task ${taskId}`, { userId, taskId });
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(
      `${this.baseUrlV2}/task/${taskId}/comment`,
      'POST',
      headers,
      { comment_text: commentText }
    );
  }
}

// Add a method to retrieve all user IDs to the TokenManager class
if (!tokenManager.getAllUserIds) {
  tokenManager.getAllUserIds = function() {
    return Array.from(tokens.keys());
  };
}

module.exports = new ClickUpService(); 