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
    // Validate inputs
    if (!canvas || !userId) {
      throw new Error('Missing required parameters: canvas or userId');
    }

    // Convert canvas to base64 image (JPEG with 100% quality)
    // Maximum quality for best results, file size will be larger but worth it
    const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
    
    // Validate image format
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format generated from canvas');
    }

    // Extract only base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = imageDataUrl.split(',')[1];
    
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Failed to extract image data from canvas');
    }
    
    // Get auth headers
    const authHeaders = await getAuthHeaders();
    
    // Show loading toast (dismissible)
    const loadingToast = toast({
      title: getTranslation(language, 'imageSending') || 'Sending Image...',
      description: getTranslation(language, 'imageWillBeSent') || 'Please wait while we send your heatmap.',
      duration: Infinity, // Stay until dismissed or replaced
    });
    
    // Send to API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
      console.error('Server response error:', errorData);
      throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    // Parse response
    const result = await response.json();
    
    // Check if response indicates success
    if (result.done === true || result.success === true) {
      toast({
        title: getTranslation(language, 'imageSentSuccess') || 'Image Sent Successfully!',
        description: getTranslation(language, 'imageSentSuccessDesc') || 'Your heatmap has been sent to your Telegram.',
        duration: 2000, // Auto-dismiss after 2 seconds
        className: 'animate-in slide-in-from-top-5',
      });
      onSuccess?.();
    } else {
      // Fallback if response format is different but no error
      toast({
        title: getTranslation(language, 'imageSending') || 'Image Processing...',
        description: getTranslation(language, 'imageWillBeSent') || 'Your image is being processed and will be sent shortly.',
        duration: 2000,
      });
      onSuccess?.();
    }
  } catch (error) {
    console.error('Error sending image:', error);
    
    // Provide fallback download option
    try {
      const imageUrl = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = `nova-heatmap-fallback-${Date.now()}.jpeg`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Unable to send via Telegram. Image downloaded instead.",
        variant: "destructive",
      });
    } catch (downloadError) {
      console.error('Fallback download also failed:', downloadError);
      toast({
        title: getTranslation(language, 'imageSentError') || 'Error Sending Image',
        description: getTranslation(language, 'imageSentErrorDesc') || 'Failed to send image. Please try again.',
        variant: "destructive",
      });
    }
    
    onError?.(error as Error);
  }
};
