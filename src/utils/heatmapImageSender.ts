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
    // Convert canvas to base64 image (JPEG format with 100% quality for best results)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
    
    // Validate image format
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }

    // Extract only base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = imageDataUrl.split(',')[1];
    
    // Get auth headers
    const authHeaders = await getAuthHeaders();
    
    // Send to API
    const response = await fetch('https://channelsseller.site/api/send-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        id: userId,
        image: base64Data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server response error:', errorData);
      throw new Error('Failed to send image');
    }
    
    // Parse response
    const result = await response.json();
    
    // Check if response indicates success
    if (result.done === true) {
      toast({
        title: getTranslation(language, 'imageSentSuccess'),
        description: getTranslation(language, 'imageSentSuccessDesc'),
        duration: 5000,
      });
      onSuccess?.();
    } else {
      // Fallback if response format is different
      toast({
        title: getTranslation(language, 'imageSending'),
        description: getTranslation(language, 'imageWillBeSent'),
      });
      onSuccess?.();
    }
  } catch (error) {
    console.error('Error sending image:', error);
    toast({
      title: getTranslation(language, 'imageSentError'),
      description: getTranslation(language, 'imageSentErrorDesc'),
      variant: "destructive",
    });
    onError?.(error as Error);
  }
};
