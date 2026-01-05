/**
 * ============================================================================
 * NOVA SHARE STATS SERVICE - API Image Generation
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 * Features:
 * - Generate shareable stat images via API
 * - Templates: Developed Gift, Standard Gift, Branding
 * - Professional typography (Cairo/Tajawal for Arabic)
 * - Bot ID watermark
 * - Futuristic design with glow effects
 */

import { getAuthHeaders } from '@/lib/telegramAuth';

// API Base URL
const API_BASE = 'https://www.channelsseller.site';

// Bot branding
const BOT_ID = '@NovaChartBot';

export interface ShareStatsData {
  type: 'developed_gift' | 'standard_gift' | 'market_stats';
  title: string;
  titleAr?: string;
  stats: {
    label: string;
    labelAr?: string;
    value: string;
    change?: number;
    icon?: string;
  }[];
  imageUrl?: string;
  timestamp?: string;
  userId?: string;
}

export interface ShareImageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Generate and send stats image to user via Telegram
 */
export const sendStatsImage = async (
  imageBase64: string,
  userId: string
): Promise<ShareImageResponse> => {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/api/send-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        id: userId,
        image: imageBase64,
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Image sent successfully' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || 'Failed to send image' };
    }
  } catch (error: any) {
    console.error('Share stats error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Capture element as image and convert to base64
 */
export const captureElementAsImage = async (
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    scale?: number;
    quality?: number;
    maxHeight?: number;
  }
): Promise<string | null> => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor || '#0a0a0f',
      scale: options?.scale || 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      height: options?.maxHeight 
        ? Math.min(element.scrollHeight, options.maxHeight) 
        : element.scrollHeight,
      windowHeight: options?.maxHeight || element.scrollHeight,
    });
    
    // Convert to base64 (without data:image prefix)
    const imageDataUrl = canvas.toDataURL('image/jpeg', options?.quality || 0.85);
    const parts = imageDataUrl.split(',');
    
    if (parts.length !== 2) {
      throw new Error('Invalid image format');
    }
    
    return parts[1]; // Return base64 data only
  } catch (error) {
    console.error('Capture element error:', error);
    return null;
  }
};

/**
 * Get template styles based on type
 */
export const getTemplateStyles = (type: ShareStatsData['type']) => {
  const baseStyles = {
    fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
    botId: BOT_ID,
  };

  switch (type) {
    case 'developed_gift':
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
        cardBg: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        glowColor: 'rgba(0, 212, 255, 0.4)',
        primaryColor: '#00d4ff',
        accentColor: '#10b981',
        textColor: '#ffffff',
        mutedColor: '#a0a0a0',
      };
    case 'standard_gift':
      return {
        ...baseStyles,
        background: 'linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)',
        cardBg: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        glowColor: 'transparent',
        primaryColor: '#f0f0f0',
        accentColor: '#64748b',
        textColor: '#ffffff',
        mutedColor: '#71717a',
      };
    case 'market_stats':
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #0f1729 0%, #0a0f1a 100%)',
        cardBg: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        glowColor: 'rgba(59, 130, 246, 0.3)',
        primaryColor: '#3b82f6',
        accentColor: '#10b981',
        textColor: '#ffffff',
        mutedColor: '#94a3b8',
      };
    default:
      return baseStyles;
  }
};

/**
 * Format number for display
 */
export const formatStatNumber = (num: number, compact = true): string => {
  if (compact) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

/**
 * Format percentage change
 */
export const formatPercentChange = (change: number): string => {
  const formatted = Math.abs(change).toFixed(2);
  return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
};

export default {
  sendStatsImage,
  captureElementAsImage,
  getTemplateStyles,
  formatStatNumber,
  formatPercentChange,
};
