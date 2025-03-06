const fetch = require('node-fetch');
const { tokenManager } = require('../utils/token-manager');

class ClickUpService {
  constructor() {
    this.baseUrlV2 = 'https://api.clickup.com/api/v2';
  }

  // Get the headers for ClickUp API requests
  getHeaders(userId) {
    const token = tokenManager.getToken(userId);
    if (!token) {
      throw new Error('No ClickUp API token found for this user');
    }
    
    return {
      'Authorization': token,
      'Content-Type': 'application/json'
    };
  }

  // Fetch data from the ClickUp API
  async fetchFromClickUp(url, method, headers, body = null) {
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { err: response.statusText };
        }
        
        throw new Error(errorData.err || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ClickUp API request failed:', error);
      throw error;
    }
  }

  // Get all workspaces for a user
  async getWorkspaces(userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/team`, 'GET', headers);
  }

  // Get all spaces in a workspace
  async getSpaces(workspaceId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/team/${workspaceId}/space`, 'GET', headers);
  }

  // Get all lists in a space (folderless)
  async getFolderlessLists(spaceId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/space/${spaceId}/list`, 'GET', headers);
  }

  // Get all folders in a space
  async getFolders(spaceId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/space/${spaceId}/folder`, 'GET', headers);
  }

  // Get all lists in a folder
  async getLists(folderId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/folder/${folderId}/list`, 'GET', headers);
  }

  // Get all tasks in a list
  async getTasks(listId, userId, page = 0, limit = 100) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(
      `${this.baseUrlV2}/list/${listId}/task?page=${page}&limit=${limit}`,
      'GET',
      headers
    );
  }

  // Get recent tasks from a workspace - this combines multiple API calls
  async getRecentTasks(workspaceId, userId, limit = 10) {
    const headers = this.getHeaders(userId);
    
    // Use the filtered team tasks endpoint to get recent tasks
    const filterUrl = `${this.baseUrlV2}/team/${workspaceId}/task?page=0&limit=${limit}&order_by=updated&reverse=true`;
    
    const response = await this.fetchFromClickUp(filterUrl, 'GET', headers);
    return response;
  }

  // Get a specific task
  async getTask(taskId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}`, 'GET', headers);
  }

  // Create a task
  async createTask(listId, taskData, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/list/${listId}/task`, 'POST', headers, taskData);
  }

  // Update a task
  async updateTask(taskId, taskData, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}`, 'PUT', headers, taskData);
  }

  // Get all comments for a task
  async getTaskComments(taskId, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(`${this.baseUrlV2}/task/${taskId}/comment`, 'GET', headers);
  }

  // Add a comment to a task
  async addTaskComment(taskId, commentText, userId) {
    const headers = this.getHeaders(userId);
    return this.fetchFromClickUp(
      `${this.baseUrlV2}/task/${taskId}/comment`,
      'POST',
      headers,
      { comment_text: commentText }
    );
  }
}

module.exports = new ClickUpService(); 