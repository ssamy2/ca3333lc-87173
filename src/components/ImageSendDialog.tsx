import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';

interface ImageSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageSendDialog: React.FC<ImageSendDialogProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-card/95 border border-border rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Send className="w-8 h-8 text-primary" />
            <div className="absolute -right-1 -top-1">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-foreground text-center text-base font-medium mb-5">
          {getTranslation(language, 'imageWillBeSent')}
        </p>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 active:scale-95"
        >
          {getTranslation(language, 'ok')}
        </button>
      </div>
    </div>
  );
};
