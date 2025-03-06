const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { clickupRoutes } = require('./routes/clickup.routes');
const { formatResponseForTypingMind } = require('./utils/formatters');
const { validateApiKey, registerClickUpToken } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// API Key validation middleware for protected routes
app.use('/api', validateApiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// Token registration endpoint
app.post('/api/register-token', validateApiKey, registerClickUpToken);

// ClickUp API routes
app.use('/api/clickup', clickupRoutes);

// Dynamic Context endpoint for TypingMind
app.get('/context/clickup', validateApiKey, async (req, res) => {
  try {
    // Extract parameters from the request
    const { workspaceId, dataType = 'tasks', limit = 10 } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // This would be a function that gets data from our ClickUp service
    const clickupService = require('./services/clickup.service');
    let data;
    
    switch (dataType) {
      case 'tasks':
        data = await clickupService.getRecentTasks(workspaceId, limit);
        break;
      case 'spaces':
        data = await clickupService.getSpaces(workspaceId);
        break;
      case 'lists':
        data = await clickupService.getLists(workspaceId);
        break;
      default:
        data = await clickupService.getRecentTasks(workspaceId, limit);
    }
    
    // Format the data for TypingMind dynamic context
    const formattedData = formatResponseForTypingMind(data, dataType);
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching ClickUp context:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ClickUp data',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 