import { toast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/telegramAuth";

interface SendImageOptions {
  canvas: HTMLCanvasElement;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const sendHeatmapImage = async ({
  canvas,
  userId,
  onSuccess,
  onError
}: SendImageOptions): Promise<void> => {
  try {
    // Convert canvas to base64 image (webp format for better compression)
    const imageDataUrl = canvas.toDataURL('image/webp', 0.95);
    
    // Validate image format
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }

    // Extract only base64 data (remove data:image/webp;base64, prefix)
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
        title: "✅ Success!",
        description: "Image has been sent to your private messages successfully!",
        duration: 5000,
      });
      onSuccess?.();
    } else {
      // Fallback if response format is different
      toast({
        title: "Image Sent",
        description: "Your image is being processed.",
      });
      onSuccess?.();
    }
  } catch (error) {
    console.error('Error sending image:', error);
    toast({
      title: "Error",
      description: "Failed to send image. Please try again.",
      variant: "destructive",
    });
    onError?.(error as Error);
  }
};
