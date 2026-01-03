/**
 * Test mode configuration
 * When TEST_MODE is true, the app will bypass Telegram authentication
 * and use admin headers for API requests
 */

// Check if we're in test mode from environment variable or localStorage
export const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true' || 
                         localStorage.getItem('TEST_MODE') === 'true' ||
                         window.location.search.includes('test=true');

// Admin password for test mode
export const ADMIN_PASSWORD = 'nova_admin_2024';

// Test mode configuration
export const testModeConfig = {
  enabled: TEST_MODE,
  adminHeaders: {
    'X-Admin-Password': ADMIN_PASSWORD
  },
  skipTelegramAuth: TEST_MODE,
  mockUser: {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en'
  }
};

// Helper to enable/disable test mode at runtime
export const setTestMode = (enabled: boolean) => {
  if (enabled) {
    localStorage.setItem('TEST_MODE', 'true');
  } else {
    localStorage.removeItem('TEST_MODE');
  }
  // Reload to apply changes
  window.location.reload();
};

// Log test mode status
if (TEST_MODE) {
  console.log('🧪 TEST MODE ENABLED - Bypassing Telegram authentication');
  console.log('🔑 Using admin headers for API requests');
}
