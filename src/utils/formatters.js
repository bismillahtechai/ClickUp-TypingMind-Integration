/**
 * Format ClickUp API responses for TypingMind dynamic context
 * This ensures the data is presented in a way that makes sense 
 * for an AI assistant to use as context
 */

/**
 * Main formatter function that dispatches to specific formatters based on data type
 */
function formatResponseForTypingMind(data, dataType) {
  switch (dataType) {
    case 'tasks':
      return formatTasksForTypingMind(data);
    case 'spaces':
      return formatSpacesForTypingMind(data);
    case 'lists':
      return formatListsForTypingMind(data);
    case 'folders':
      return formatFoldersForTypingMind(data);
    case 'comments':
      return formatCommentsForTypingMind(data);
    default:
      return formatGenericForTypingMind(data, dataType);
  }
}

/**
 * Format task data for TypingMind
 */
function formatTasksForTypingMind(data) {
  if (!data.tasks) {
    return { text: 'No tasks found.' };
  }

  const tasks = data.tasks;
  let formattedText = 'Recent ClickUp Tasks:\n\n';

  tasks.forEach((task, index) => {
    formattedText += `${index + 1}. Task: ${task.name}\n`;
    formattedText += `   ID: ${task.id}\n`;
    formattedText += `   Status: ${task.status.status || 'No status'}\n`;
    
    if (task.due_date) {
      const dueDate = new Date(parseInt(task.due_date));
      formattedText += `   Due: ${dueDate.toLocaleDateString()}\n`;
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
      const assigneeNames = task.assignees.map(a => a.username || a.email).join(', ');
      formattedText += `   Assigned to: ${assigneeNames}\n`;
    }
    
    if (task.tags && task.tags.length > 0) {
      const tagNames = task.tags.map(t => t.name).join(', ');
      formattedText += `   Tags: ${tagNames}\n`;
    }
    
    formattedText += '\n';
  });

  return { text: formattedText };
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