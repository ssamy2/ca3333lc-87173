import React from 'react';
import { Send } from 'lucide-react';

interface ImageSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageSendDialog: React.FC<ImageSendDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-[#2A2D3A] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Telegram Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#3D8FD1] opacity-20 blur-xl rounded-full"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#3D8FD1] to-[#2563eb] rounded-full flex items-center justify-center shadow-lg">
              <Send className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-white text-center text-lg font-medium mb-6 leading-relaxed">
          Image will be sent to you soon
        </p>

        {/* OK Button */}
        <button
          onClick={() => {
            const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
            const dialog = document.querySelector('.relative.bg-\\[\\#2A2D3A\\]');
            if (backdrop && dialog) {
              backdrop.classList.add('opacity-0');
              dialog.classList.add('scale-95', 'opacity-0');
              setTimeout(onClose, 300);
            } else {
              onClose();
            }
          }}
          className="w-full bg-gradient-to-r from-[#3D8FD1] to-[#2563eb] hover:from-[#4A9FE1] hover:to-[#3573fc] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
        >
          Ok
        </button>
      </div>
    </div>
  );
};
