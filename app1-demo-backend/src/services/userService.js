import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../data/users.json');

/**
 * Retrieves and formats user profile details by ID.
 * @param {string} userId 
 * @returns {object} Formatted user profile
 */
export function getUserProfileById(userId) {
  const fileData = fs.readFileSync(usersFilePath, 'utf8');
  const users = JSON.parse(fileData);

  const user = users.find(u => u.id === userId);

  if (!user) {
    throw new Error(`User with ID '${userId}' not found`);
  }

  // BUG LOCATION:
  // Accessing nested properties on `user.preferences` without validating if `preferences` or `displaySettings` exists.
  // For user 'u101', `user.preferences` is null, causing:
  // TypeError: Cannot read properties of undefined (reading 'theme')
  const theme = user.preferences.displaySettings.theme.toUpperCase();
  const fontSize = user.preferences.displaySettings.fontSize;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    settings: {
      theme: theme,
      fontSize: fontSize
    },
    formattedTitle: `${user.name} (${user.role}) - Theme: ${theme}`
  };
}
