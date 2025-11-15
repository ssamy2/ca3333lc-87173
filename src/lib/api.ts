// API Client for Backend Integration
const API_BASE_URL = 'https://www.channelsseller.site/api';

interface UserPreferences {
  language: string;
  theme?: string;
  country?: string;
  is_premium?: boolean;
}

interface GlobalStatistics {
  total_users: number;
  total_gifts_checked: number;
  total_channel_gifts: number;
  total_user_gifts: number;
  active_today: number;
  countries: Array<{
    country: string;
    user_count: number;
  }>;
  top_country: string;
}

interface UserStatistics {
  gift_count: number;
  channel_gift_count: number;
  total_checked: number;
}

class APIClient {
  private getHeaders(): HeadersInit {
    const initData = window.Telegram?.WebApp?.initData;
    return {
      'Content-Type': 'application/json',
      ...(initData && { 'Authorization': `Bearer ${initData}` })
    };
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        headers: this.getHeaders()
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(preferences)
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  async getGlobalStatistics(): Promise<GlobalStatistics | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/global`, {
        headers: this.getHeaders()
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get global statistics:', error);
      return null;
    }
  }

  async getUserStatistics(): Promise<UserStatistics | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/user`, {
        headers: this.getHeaders()
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      return null;
    }
  }
}

export const apiClient = new APIClient();
export type { UserPreferences, GlobalStatistics, UserStatistics };
