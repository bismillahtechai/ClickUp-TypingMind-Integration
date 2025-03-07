/**
 * Format ClickUp API responses for TypingMind dynamic context
 * This ensures the data is presented in a way that makes sense 
 * for an AI assistant to use as context
 */

const { getLogger } = require('./logger');
const logger = getLogger('formatters');

/**
 * Main formatter function that dispatches to specific formatters based on data type
 */
function formatResponseForTypingMind(data, dataType) {
  logger.debug(`Formatting ${dataType} data for TypingMind`);
  
  if (!data) {
    logger.warn(`No data provided for formatting (dataType: ${dataType})`);
    return [];
  }
  
  let result;
  switch (dataType) {
    case 'tasks':
      result = formatTasksForTypingMind(data);
      break;
    case 'spaces':
      result = formatSpacesForTypingMind(data);
      break;
    case 'lists':
      result = formatListsForTypingMind(data);
      break;
    case 'folders':
      result = formatFoldersForTypingMind(data);
      break;
    case 'comments':
      result = formatCommentsForTypingMind(data);
      break;
    default:
      logger.warn(`Unknown data type: ${dataType}, using generic formatter`);
      result = formatGenericForTypingMind(data, dataType);
  }
  
  logger.info(`Formatted ${result.length} ${dataType} items for TypingMind`);
  return result;
}

/**
 * Format task data for TypingMind
 */
function formatTasksForTypingMind(data) {
  logger.debug('Starting task formatting');
  
  // Handle both formats that ClickUp might return
  const tasks = data.tasks || data || [];
  
  if (!Array.isArray(tasks)) {
    logger.warn('Tasks data is not in expected format', { 
      type: typeof tasks, 
      isTasksProperty: !!data.tasks 
    });
    return [];
  }
  
  logger.debug(`Processing ${tasks.length} tasks`);
  
  // Map tasks to a format suitable for context
  const formattedTasks = tasks.map(task => {
    try {
      // Extract status
      const status = task.status ? {
        status: task.status.status,
        color: task.status.color,
        type: task.status.type
      } : { status: 'Unknown' };
      
      // Extract assignees
      const assignees = Array.isArray(task.assignees) ? 
        task.assignees.map(a => ({ 
          id: a.id, 
          username: a.username,
          email: a.email,
          profilePicture: a.profilePicture
        })) : [];
      
      // Format the task
      return {
        id: task.id,
        name: task.name,
        description: task.description || '',
        status: status,
        priority: task.priority ? {
          priority: task.priority.priority,
          color: task.priority.color
        } : null,
        timeEstimate: task.time_estimate,
        timeSpent: task.time_spent,
        createdAt: new Date(task.date_created).toISOString(),
        updatedAt: new Date(task.date_updated).toISOString(),
        dueDate: task.due_date ? new Date(task.due_date).toISOString() : null,
        startDate: task.start_date ? new Date(task.start_date).toISOString() : null,
        assignees: assignees,
        tags: task.tags || [],
        url: task.url
      };
    } catch (error) {
      logger.error(`Error formatting task ${task.id || 'unknown'}`, { error: error.stack });
      
      // Return a simplified version if there's an error
      return {
        id: task.id || 'unknown',
        name: task.name || 'Unknown task',
        error: 'Error formatting task data'
      };
    }
  });
  
  logger.debug(`Formatted ${formattedTasks.length} tasks successfully`);
  return formattedTasks;
}

/**
 * Format spaces data for TypingMind
 */
function formatSpacesForTypingMind(data) {
  if (!data.spaces) {
    return { text: 'No spaces found.' };
  }

  const spaces = data.spaces;
  let formattedText = 'ClickUp Spaces:\n\n';

  spaces.forEach((space, index) => {
    formattedText += `${index + 1}. Space: ${space.name}\n`;
    formattedText += `   ID: ${space.id}\n`;
    
    if (space.statuses && space.statuses.length > 0) {
      const statusNames = space.statuses.map(s => s.status).join(', ');
      formattedText += `   Statuses: ${statusNames}\n`;
    }
    
    formattedText += '\n';
  });

  return { text: formattedText };
}

/**
 * Format lists data for TypingMind
 */
function formatListsForTypingMind(data) {
  if (!data.lists) {
    return { text: 'No lists found.' };
  }

  const lists = data.lists;
  let formattedText = 'ClickUp Lists:\n\n';

  lists.forEach((list, index) => {
    formattedText += `${index + 1}. List: ${list.name}\n`;
    formattedText += `   ID: ${list.id}\n`;
    
    if (list.status) {
      formattedText += `   Status: ${list.status}\n`;
    }
    
    if (list.task_count !== undefined) {
      formattedText += `   Task Count: ${list.task_count}\n`;
    }
    
    formattedText += '\n';
  });

  return { text: formattedText };
}

/**
 * Format folders data for TypingMind
 */
function formatFoldersForTypingMind(data) {
  if (!data.folders) {
    return { text: 'No folders found.' };
  }

  const folders = data.folders;
  let formattedText = 'ClickUp Folders:\n\n';

  folders.forEach((folder, index) => {
    formattedText += `${index + 1}. Folder: ${folder.name}\n`;
    formattedText += `   ID: ${folder.id}\n`;
    
    if (folder.lists && folder.lists.length > 0) {
      formattedText += `   Lists: ${folder.lists.length}\n`;
    }
    
    formattedText += '\n';
  });

  return { text: formattedText };
}

/**
 * Format comments data for TypingMind
 */
function formatCommentsForTypingMind(data) {
  if (!data.comments) {
    return { text: 'No comments found.' };
  }

  const comments = data.comments;
  let formattedText = 'ClickUp Comments:\n\n';

  comments.forEach((comment, index) => {
    formattedText += `${index + 1}. Comment by: ${comment.user ? comment.user.username : 'Unknown'}\n`;
    formattedText += `   Date: ${new Date(comment.date).toLocaleString()}\n`;
    formattedText += `   Text: ${comment.comment_text.replace(/\*\*/g, '').replace(/\*/g, '')}\n`;
    formattedText += '\n';
  });

  return { text: formattedText };
}

/**
 * Generic formatter for other data types
 */
function formatGenericForTypingMind(data, dataType) {
  // If the data is empty or undefined
  if (!data || Object.keys(data).length === 0) {
    return { text: `No ${dataType} data found.` };
  }

  // Convert the data to a readable format
  let formattedText = `ClickUp ${dataType} data:\n\n`;
  formattedText += JSON.stringify(data, null, 2);

  return { text: formattedText };
}

module.exports = {
  formatResponseForTypingMind
}; 