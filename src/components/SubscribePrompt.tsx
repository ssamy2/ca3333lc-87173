import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscribePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscribePrompt: React.FC<SubscribePromptProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm mx-auto mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Card */}
            <div className="relative bg-background/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/20">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted/70 flex items-center justify-center transition-all duration-200 hover:scale-105"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Logo Bar */}
              <div className="flex items-center justify-center mb-6 mt-2">
                <div className="flex items-center gap-2">
                  {/* Small white symbol */}
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  </div>
                  
                  {/* Nova text */}
                  <span className="text-xl font-bold text-foreground">Nova</span>
                  
                  {/* Charts pill */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50"></div>
                    <div className="relative bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Charts
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-center mb-8">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Subscribe to our main channel to not miss important events and updates, as well as receive exclusive offers from us.
                </p>
              </div>

              {/* Subscribe Button */}
              <Button
                asChild
                className="w-full h-12 rounded-2xl border-2 border-blue-500/30 bg-transparent hover:bg-blue-500/10 text-blue-500 font-semibold transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                variant="outline"
              >
                <a 
                  href="https://t.me/GT_Rolet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  Subscribe
                </a>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribePrompt;
