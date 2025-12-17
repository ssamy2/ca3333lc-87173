import { getAuthHeaders } from "@/lib/telegramAuth";
import { Language } from "@/i18n/translations";

interface SendImageOptions {
  canvas: HTMLCanvasElement;
  userId: string;
  language: Language;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (stage: string) => void;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

/**
 * Compress image by reducing quality and optionally resizing
 */
const compressImage = async (
  canvas: HTMLCanvasElement,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<string> => {
  let targetCanvas = canvas;
  
  // Resize if too large
  if (canvas.width > maxWidth) {
    const scale = maxWidth / canvas.width;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maxWidth;
    tempCanvas.height = canvas.height * scale;
    
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      targetCanvas = tempCanvas;
    }
  }
  
  // Try JPEG first (smaller size), fallback to PNG
  try {
    const jpegUrl = targetCanvas.toDataURL('image/jpeg', quality);
    if (jpegUrl && jpegUrl.startsWith('data:image/jpeg')) {
      return jpegUrl;
    }
  } catch (e) {
    console.warn('⚠️ [COMPRESS] JPEG failed, trying PNG');
  }
  
  return targetCanvas.toDataURL('image/png');
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * Send image with retry logic
 */
const sendWithRetry = async (
  base64Data: string,
  userId: string,
  authHeaders: Record<string, string>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = getRetryDelay(attempt - 1, config);
      console.log(`🔄 [SEND] Retry ${attempt}/${config.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('https://www.channelsseller.site/api/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          id: userId,
          image: base64Data
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastError = new Error('Request timeout');
      } else {
        lastError = error;
      }
    }
  }
  
  throw lastError || new Error('Failed after all retries');
};

/**
 * Main function to send heatmap image
 */
export const sendHeatmapImage = async ({
  canvas,
  userId,
  language,
  onSuccess,
  onError,
  onProgress
}: SendImageOptions): Promise<void> => {
  console.log('📤 [SEND] Starting optimized send process...');
  
  try {
    // Step 1: Validate inputs
    onProgress?.('Validating...');
    if (!canvas) throw new Error('Canvas is null');
    if (!userId) throw new Error('User ID is missing');
    
    console.log('✅ [SEND] Inputs valid:', { userId, size: `${canvas.width}x${canvas.height}` });

    // Step 2: Compress image
    onProgress?.('Compressing image...');
    console.log('📤 [SEND] Compressing image...');
    const imageDataUrl = await compressImage(canvas, 1920, 0.85);
    
    const parts = imageDataUrl.split(',');
    if (parts.length !== 2) throw new Error('Invalid image format');
    const base64Data = parts[1];
    
    // Log compression results
    const sizeKB = Math.round(base64Data.length * 0.75 / 1024);
    console.log(`✅ [SEND] Image compressed: ${sizeKB}KB`);

    // Step 3: Get auth headers
    onProgress?.('Authenticating...');
    let authHeaders: Record<string, string> = {};
    try {
      authHeaders = await getAuthHeaders();
    } catch (e) {
      console.warn('⚠️ [SEND] Auth headers failed, continuing without');
    }

    // Step 4: Send with retry
    onProgress?.('Sending...');
    console.log('📤 [SEND] Sending to API...');
    const response = await sendWithRetry(base64Data, userId, authHeaders);
    
    // Step 5: Parse response
    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: true };
    }
    
    console.log('🎉 [SEND] Success!', result);
    onProgress?.('Done!');
    onSuccess?.();
    
  } catch (error: any) {
    console.error('❌ [SEND] Failed:', error.message);
    
    // Fallback: Local download
    try {
      const fallbackUrl = canvas.toDataURL('image/jpeg', 0.8);
      const link = document.createElement('a');
      link.download = `nova-heatmap-${Date.now()}.jpeg`;
      link.href = fallbackUrl;
      link.click();
      console.log('✅ [SEND] Fallback download triggered');
    } catch (e) {
      console.error('❌ [SEND] Fallback also failed');
    }
    
    onError?.(error as Error);
    throw error;
  }
};
