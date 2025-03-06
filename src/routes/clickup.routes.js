const express = require('express');
const clickupService = require('../services/clickup.service');
const { getUserIdFromRequest } = require('../utils/auth-helpers');

const router = express.Router();

// Get user's workspaces
router.get('/workspaces', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const workspaces = await clickupService.getWorkspaces(userId);
    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get spaces in a workspace
router.get('/workspaces/:workspaceId/spaces', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { workspaceId } = req.params;
    const spaces = await clickupService.getSpaces(workspaceId, userId);
    res.json(spaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get folders in a space
router.get('/spaces/:spaceId/folders', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { spaceId } = req.params;
    const folders = await clickupService.getFolders(spaceId, userId);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get folderless lists in a space
router.get('/spaces/:spaceId/lists', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { spaceId } = req.params;
    const lists = await clickupService.getFolderlessLists(spaceId, userId);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching folderless lists:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get lists in a folder
router.get('/folders/:folderId/lists', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { folderId } = req.params;
    const lists = await clickupService.getLists(folderId, userId);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tasks in a list
router.get('/lists/:listId/tasks', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { listId } = req.params;
    const { page = 0, limit = 100 } = req.query;
    const tasks = await clickupService.getTasks(listId, userId, page, limit);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific task
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { taskId } = req.params;
    const task = await clickupService.getTask(taskId, userId);
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a task in a list
router.post('/lists/:listId/tasks', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { listId } = req.params;
    const taskData = req.body;
    const newTask = await clickupService.createTask(listId, taskData, userId);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { taskId } = req.params;
    const taskData = req.body;
    const updatedTask = await clickupService.updateTask(taskId, taskData, userId);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent tasks from a workspace
router.get('/workspaces/:workspaceId/recent-tasks', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { workspaceId } = req.params;
    const { limit = 10 } = req.query;
    const tasks = await clickupService.getRecentTasks(workspaceId, userId, limit);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a task
router.get('/tasks/:taskId/comments', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { taskId } = req.params;
    const comments = await clickupService.getTaskComments(taskId, userId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a comment to a task
router.post('/tasks/:taskId/comments', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { taskId } = req.params;
    const { comment_text } = req.body;
    
    if (!comment_text) {
      return res.status(400).json({ error: 'comment_text is required' });
    }
    
    const newComment = await clickupService.addTaskComment(taskId, comment_text, userId);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding task comment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { clickupRoutes: router }; 