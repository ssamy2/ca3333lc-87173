import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import TonIcon from './TonIcon';
import NvaIcon from './NvaIcon';

interface SubscribePromptProps {
  onCheckAgain: () => void;
  onSkip?: () => void;
}

const SubscribePrompt: React.FC<SubscribePromptProps> = ({ onCheckAgain, onSkip }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden"
      onClick={onSkip}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Radial gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(33,150,243,0.1) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-6" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="telegram-card p-8 text-center space-y-6 border-2 border-primary/30 shadow-2xl backdrop-blur-md relative"
        >
          {/* Close button */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Skip"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Logo with enhanced glow */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary to-accent blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm flex items-center justify-center border-2 border-primary/40 shadow-lg">
                <TonIcon className="w-16 h-16" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              Nova Charts
            </h1>
            <p className="text-muted-foreground text-base font-medium leading-relaxed">
              To access the content, please subscribe to our channel first
            </p>
          </motion.div>

          {/* Steps indicator */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border/40"
          >
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <p className="text-left text-muted-foreground">
                Click the button below to subscribe
              </p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <p className="text-left text-muted-foreground">
                Return here and verify your subscription
              </p>
            </div>
          </motion.div>

          {/* Subscribe Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              asChild
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <a 
                href="https://t.me/GT_Rolet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3"
              >
                <span>Subscribe to Channel</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </Button>
          </motion.div>

          {/* Check Again Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onCheckAgain}
              variant="outline"
              size="lg"
              className="w-full h-12 font-semibold border-2 hover:bg-primary/5 hover:border-primary/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verify Subscription
            </Button>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <p>
                After subscribing, click "Verify Subscription" to continue
              </p>
            </div>
          </motion.div>

          {/* Powered by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-4 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-center gap-2"
          >
            <span>Powered by</span>
            <NvaIcon className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscribePrompt;
