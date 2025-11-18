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
  try {
    if (!canvas || !userId) {
      throw new Error('Missing required parameters: canvas or userId');
    }

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format generated from canvas');
    }

    const base64Data = imageDataUrl.split(',')[1];
    
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Failed to extract image data from canvas');
    }
    
    const authHeaders = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);
    
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    
    if (result.done === true || result.success === true) {
      onSuccess?.();
    } else {
      onSuccess?.();
    }
  } catch (error) {
    try {
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `nova-heatmap-fallback-${Date.now()}.jpeg`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
    
    onError?.(error as Error);
  }
};
