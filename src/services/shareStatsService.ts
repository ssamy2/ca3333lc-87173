/**
 * ============================================================================
 * NOVA SHARE STATS SERVICE - Image Generation & API Integration
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * Features:
 * - Template-based image generation (Developed vs Standard)
 * - Branding with Bot ID watermark
 * - Cairo/Tajawal typography support
 * ============================================================================
 */

import html2canvas from 'html2canvas';

export type TemplateType = 'developed_gift' | 'standard_gift';

interface ShareOptions {
    id: string;
    template: TemplateType;
    data: any;
    branding?: boolean;
}

/**
 * Generates a shareable image based on templates
 */
export const generateShareImage = async (element: HTMLElement, options: ShareOptions): Promise<string> => {
    const canvas = await html2canvas(element, {
        backgroundColor: options.template === 'developed_gift' ? '#0f1729' : '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
    });

    // Apply template-specific post-processing if needed
    // For simplicity, we use canvas as is, but could add glow effects etc. via overlay

    return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Sends the generated image to the backend API
 */
export const shareToTelegram = async (userId: string, imageBase64: string, authHeaders: any): Promise<boolean> => {
    try {
        const response = await fetch('https://www.channelsseller.site/api/send-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify({
                id: userId,
                image: imageBase64.split(',')[1],
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Share to Telegram error:', error);
        return false;
    }
};

/**
 * Custom branding overlay component (to be used before capture)
 */
export const BrandingWatermark: React.FC<{ botId: string }> = ({ botId }) => {
    return (
        <div style= {{
        position: 'absolute',
            bottom: '10px',
                right: '10px',
                    opacity: 0.5,
                        fontSize: '10px',
                            color: '#94a3b8',
                                fontFamily: 'Tajawal, sans-serif',
                                    pointerEvents: 'none',
                                        zIndex: 100,
    }
}>
    Powered by { botId }
</div>
  );
};
