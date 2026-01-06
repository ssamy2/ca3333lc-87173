/**
 * Development Mode Configuration
 * When enabled, skips Telegram authentication and uses admin headers
 */

// Set to true to enable development mode
export const DEV_MODE = true

// Admin headers for development mode API calls
export const DEV_ADMIN_HEADERS = {
  'X-Admin-Password': 'nova_admin_2024'
};

// Mock user data for development mode
export const DEV_USER = {
  id: '123456789',
  username: 'dev_user',
  first_name: 'Dev',
  last_name: 'User'
};
