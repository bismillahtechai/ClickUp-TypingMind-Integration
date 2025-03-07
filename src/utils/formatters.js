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
    return { text: `No ${dataType} data available.` };
  }
  
  let formattedData;
  switch (dataType) {
    case 'tasks':
      formattedData = formatTasksForTypingMind(data);
      break;
    case 'spaces':
      formattedData = formatSpacesForTypingMind(data);
      break;
    case 'lists':
      formattedData = formatListsForTypingMind(data);
      break;
    case 'folders':
      formattedData = formatFoldersForTypingMind(data);
      break;
    case 'comments':
      formattedData = formatCommentsForTypingMind(data);
      break;
    default:
      logger.warn(`Unknown data type: ${dataType}, using generic formatter`);
      formattedData = formatGenericForTypingMind(data, dataType);
  }
  
  // Convert the structured data to a text format for TypingMind context
  const context = convertToTypingMindContext(formattedData, dataType);
  
  logger.info(`Formatted ${dataType} items for TypingMind context (${context.text.length} chars)`);
  return context;
}

/**
 * Convert structured data to text format for TypingMind context
 */
function convertToTypingMindContext(data, dataType) {
  try {
    if (!Array.isArray(data)) {
      return { text: `No ${dataType} data available.` };
    }
    
    if (data.length === 0) {
      return { text: `No ${dataType} found.` };
    }
    
    let formattedText = `ClickUp ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}:\n\n`;
    
    switch (dataType) {
      case 'tasks':
        data.forEach((task, index) => {
          formattedText += `${index + 1}. Task: ${task.name}\n`;
          formattedText += `   ID: ${task.id}\n`;
          
          if (task.status && task.status.status) {
            formattedText += `   Status: ${task.status.status}\n`;
          }
          
          if (task.dueDate) {
            formattedText += `   Due: ${task.dueDate}\n`;
          }
          
          if (task.description) {
            // Truncate description if it's too long and remove markdown formatting
            const cleanDescription = task.description
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .replace(/#{1,6}\s?/g, '');
            
            const truncatedDescription = cleanDescription.length > 100 
              ? cleanDescription.substring(0, 100) + '...' 
              : cleanDescription;
            
            formattedText += `   Description: ${truncatedDescription}\n`;
          }
          
          if (task.assignees && task.assignees.length > 0) {
            const assigneeNames = task.assignees
              .map(a => a.username || a.email || 'Unknown user')
              .join(', ');
            
            formattedText += `   Assigned to: ${assigneeNames}\n`;
          }
          
          if (task.tags && task.tags.length > 0) {
            const tagNames = task.tags
              .map(t => t.name || t)
              .join(', ');
            
            formattedText += `   Tags: ${tagNames}\n`;
          }
          
          formattedText += '\n';
        });
        break;
        
      case 'spaces':
        data.forEach((space, index) => {
          formattedText += `${index + 1}. Space: ${space.name}\n`;
          formattedText += `   ID: ${space.id}\n`;
          
          if (space.statuses && space.statuses.length > 0) {
            const statusNames = space.statuses.map(s => s.name).join(', ');
            formattedText += `   Statuses: ${statusNames}\n`;
          }
          
          formattedText += '\n';
        });
        break;
        
      case 'lists':
        data.forEach((list, index) => {
          formattedText += `${index + 1}. List: ${list.name}\n`;
          formattedText += `   ID: ${list.id}\n`;
          
          if (list.status) {
            formattedText += `   Status: ${list.status}\n`;
          }
          
          formattedText += '\n';
        });
        break;
        
      case 'folders':
        data.forEach((folder, index) => {
          formattedText += `${index + 1}. Folder: ${folder.name}\n`;
          formattedText += `   ID: ${folder.id}\n`;
          formattedText += '\n';
        });
        break;
        
      default:
        data.forEach((item, index) => {
          formattedText += `${index + 1}. Item: ${item.name || 'Unknown'}\n`;
          formattedText += `   ID: ${item.id || 'No ID'}\n`;
          formattedText += '\n';
        });
    }
    
    return { text: formattedText };
  } catch (error) {
    logger.error(`Error converting to TypingMind context: ${error.message}`, { error: error.stack });
    return { text: `Error formatting ${dataType} data: ${error.message}` };
  }
}

/**
 * Format tasks data for TypingMind
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
      // Safe date conversion function
      const safeDate = (timestamp) => {
        if (!timestamp) return null;
        try {
          // Handle both string timestamps and numeric timestamps
          const date = typeof timestamp === 'string' 
            ? new Date(timestamp) 
            : new Date(parseInt(timestamp));
          
          // Check if date is valid
          return !isNaN(date.getTime()) ? date.toISOString() : null;
        } catch (e) {
          return null;
        }
      };
      
      // Safe property access function
      const get = (obj, path, defaultValue = null) => {
        try {
          const parts = path.split('.');
          let current = obj;
          
          for (const part of parts) {
            if (current === null || current === undefined) {
              return defaultValue;
            }
            current = current[part];
          }
          
          return current === undefined ? defaultValue : current;
        } catch (e) {
          return defaultValue;
        }
      };
      
      // Extract status - now with safer property access
      const status = {
        status: get(task, 'status.status', 'Unknown'),
        color: get(task, 'status.color'),
        type: get(task, 'status.type')
      };
      
      // Extract assignees with safer handling
      let assignees = [];
      if (Array.isArray(task.assignees)) {
        assignees = task.assignees.map(a => ({
          id: get(a, 'id'),
          username: get(a, 'username'),
          email: get(a, 'email'),
          profilePicture: get(a, 'profilePicture')
        }));
      }
      
      // Get priority safely
      const priority = task.priority ? {
        priority: get(task, 'priority.priority'),
        color: get(task, 'priority.color')
      } : null;
      
      // Format the task with safer property access
      return {
        id: get(task, 'id', 'unknown-id'),
        name: get(task, 'name', 'Unnamed Task'),
        description: get(task, 'description', ''),
        status: status,
        priority: priority,
        timeEstimate: get(task, 'time_estimate'),
        timeSpent: get(task, 'time_spent'),
        createdAt: safeDate(get(task, 'date_created')),
        updatedAt: safeDate(get(task, 'date_updated')),
        dueDate: safeDate(get(task, 'due_date')),
        startDate: safeDate(get(task, 'start_date')),
        assignees: assignees,
        tags: Array.isArray(get(task, 'tags')) ? get(task, 'tags') : [],
        url: get(task, 'url')
      };
    } catch (error) {
      logger.error(`Error formatting task ${get(task, 'id', 'unknown')}`, { 
        error: error.stack,
        task: JSON.stringify(task).substring(0, 200) + '...' // Log part of the task for debugging
      });
      
      // Return a simplified version if there's an error
      return {
        id: get(task, 'id', 'unknown'),
        name: get(task, 'name', 'Unknown task'),
        error: 'Error formatting task data'
      };
    }
  });
  
  logger.debug(`Formatted ${formattedTasks.length} tasks successfully`);
  return formattedTasks;
}

// Helper function to safely access nested properties
function get(obj, path, defaultValue = null) {
  try {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current === undefined ? defaultValue : current;
  } catch (e) {
    return defaultValue;
  }
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

/**
 * Combine multiple formatted responses into a single comprehensive response
 */
function combineFormattedResponses(results) {
  logger.debug('Combining multiple formatted responses');
  
  try {
    // Extract text content from each result
    let combinedText = "ClickUp Workspace Overview:\n\n";
    
    // Get all the data types that were successfully retrieved
    const dataTypes = Object.keys(results);
    
    if (dataTypes.length === 0) {
      return { text: "No ClickUp data available." };
    }
    
    // Process each data type and add it to the combined text
    dataTypes.forEach(dataType => {
      const result = results[dataType];
      
      // Skip if there's no result or it has an error
      if (!result || result.error) {
        return;
      }
      
      // Extract the text content, skipping the header
      let textContent = result.text || '';
      
      // Strip the header (first line) and add our own section header
      if (textContent.includes('\n\n')) {
        textContent = textContent.split('\n\n').slice(1).join('\n\n');
      }
      
      // Add section header for this data type
      combinedText += `== ${dataType.toUpperCase()} ==\n\n`;
      combinedText += textContent;
      
      // Add a separator between sections
      combinedText += '\n\n';
    });
    
    // Check if we actually have any content
    if (combinedText === "ClickUp Workspace Overview:\n\n") {
      return { text: "No ClickUp data available." };
    }
    
    // Add a summary at the end
    combinedText += `== SUMMARY ==\n\n`;
    combinedText += `This overview includes information from ${dataTypes.join(', ')}.\n`;
    combinedText += `Use this information as context for your responses about ClickUp projects and tasks.\n\n`;
    
    logger.info(`Combined ${dataTypes.length} data types into comprehensive response`);
    return { text: combinedText };
  } catch (error) {
    logger.error(`Error combining formatted responses: ${error.message}`, { error: error.stack });
    return { text: "Error combining ClickUp data: " + error.message };
  }
}

module.exports = {
  formatResponseForTypingMind,
  formatters: {
    combineFormattedResponses
  }
}; 