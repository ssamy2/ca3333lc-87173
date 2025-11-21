import { toast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/telegramAuth";
import { getTranslation } from "@/i18n/translations";
import { Language } from "@/i18n/translations";

interface SendImageOptions {
  canvas: HTMLCanvasElement;
  userId: string;
  language: Language;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const sendHeatmapImage = async ({
  canvas,
  userId,
  language,
  onSuccess,
  onError
}: SendImageOptions): Promise<void> => {
  console.log('📤 [SEND IMAGE] Starting image send process...');
  
  let imageDataUrl: string | null = null;
  let base64Data: string | null = null;
  
  try {
    // Step 1: Validate inputs
    console.log('📤 [SEND IMAGE] Step 1: Validating inputs...');
    if (!canvas) {
      throw new Error('Canvas is null or undefined');
    }
    if (!userId) {
      throw new Error('User ID is missing');
    }
    console.log('✅ [SEND IMAGE] Inputs validated:', { userId, canvasWidth: canvas.width, canvasHeight: canvas.height });

    // Step 2: Convert canvas to data URL with multiple fallbacks
    console.log('📤 [SEND IMAGE] Step 2: Converting canvas to image...');
    try {
      imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('✅ [SEND IMAGE] Canvas converted to JPEG (quality 0.95)');
    } catch (jpegError) {
      console.warn('⚠️ [SEND IMAGE] JPEG conversion failed, trying PNG...', jpegError);
      try {
        imageDataUrl = canvas.toDataURL('image/png');
        console.log('✅ [SEND IMAGE] Canvas converted to PNG');
      } catch (pngError) {
        console.error('❌ [SEND IMAGE] Both JPEG and PNG conversion failed');
        throw new Error('Failed to convert canvas to image format');
      }
    }
    
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format generated from canvas');
    }
    console.log('✅ [SEND IMAGE] Image data URL created:', imageDataUrl.substring(0, 50) + '...');

    // Step 3: Extract base64 data
    console.log('📤 [SEND IMAGE] Step 3: Extracting base64 data...');
    const parts = imageDataUrl.split(',');
    if (parts.length !== 2) {
      throw new Error('Invalid data URL format');
    }
    base64Data = parts[1];
    
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Failed to extract image data from canvas');
    }
    console.log('✅ [SEND IMAGE] Base64 data extracted:', base64Data.length, 'characters');
    
    // Step 4: Get auth headers
    console.log('📤 [SEND IMAGE] Step 4: Getting auth headers...');
    let authHeaders: Record<string, string> = {};
    try {
      authHeaders = await getAuthHeaders();
      console.log('✅ [SEND IMAGE] Auth headers obtained');
    } catch (authError) {
      console.warn('⚠️ [SEND IMAGE] Failed to get auth headers, continuing without auth...', authError);
    }
    
    // Step 5: Send to API with timeout
    console.log('📤 [SEND IMAGE] Step 5: Sending to API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ [SEND IMAGE] Request timeout (30s)');
      controller.abort();
    }, 30000);
    
    let response: Response;
    try {
      response = await fetch('https://www.channelsseller.site/api/send-image', {
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
      console.log('✅ [SEND IMAGE] API response received:', response.status, response.statusText);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }
      throw new Error(`Network error: ${fetchError.message}`);
    }

    // Step 6: Check response
    console.log('📤 [SEND IMAGE] Step 6: Checking response...');
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    // Step 7: Parse result
    console.log('📤 [SEND IMAGE] Step 7: Parsing result...');
    let result: any;
    try {
      result = await response.json();
      console.log('✅ [SEND IMAGE] Result parsed:', result);
    } catch (parseError) {
      console.warn('⚠️ [SEND IMAGE] Failed to parse JSON, assuming success');
      result = { success: true };
    }
    
    // Step 8: Success!
    console.log('🎉 [SEND IMAGE] Image sent successfully!');
    if (onSuccess) {
      try {
        onSuccess();
      } catch (callbackError) {
        console.error('❌ [SEND IMAGE] Success callback error:', callbackError);
      }
    }
    
  } catch (error: any) {
    console.error('❌ [SEND IMAGE] Error occurred:', error);
    console.error('❌ [SEND IMAGE] Error stack:', error.stack);
    
    // Fallback: Try to download locally
    console.log('🔄 [SEND IMAGE] Attempting fallback download...');
    try {
      const fallbackUrl = imageDataUrl || canvas.toDataURL('image/jpeg', 0.8);
      const link = document.createElement('a');
      link.download = `nova-heatmap-fallback-${Date.now()}.jpeg`;
      link.href = fallbackUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      console.log('✅ [SEND IMAGE] Fallback download triggered');
    } catch (fallbackError) {
      console.error('❌ [SEND IMAGE] Fallback download also failed:', fallbackError);
    }
    
    // Call error callback
    if (onError) {
      try {
        onError(error as Error);
      } catch (callbackError) {
        console.error('❌ [SEND IMAGE] Error callback failed:', callbackError);
      }
    }
    
    // Re-throw to let caller know
    throw error;
  }
};
