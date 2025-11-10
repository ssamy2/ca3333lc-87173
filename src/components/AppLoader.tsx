import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TonIcon from './TonIcon';
import NvaIcon from './NvaIcon';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { usePrefetchMarketData } from '@/hooks/useMarketData';
import { usePrefetchBlackFloorData } from '@/hooks/useBlackFloorData';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
}

interface AppLoaderProps {
  onComplete: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onComplete }) => {
  const prefetchMarketData = usePrefetchMarketData();
  const prefetchBlackFloorData = usePrefetchBlackFloorData();
  
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'auth', label: 'Authenticating...', status: 'pending' },
    { id: 'data', label: 'Loading data...', status: 'pending' },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processSteps = async () => {
      try {
        // Step 1: Auth
        await updateStep(0, 'loading');
        setProgress(20);
        await new Promise(resolve => setTimeout(resolve, 600));
        await updateStep(0, 'success');
        setProgress(40);

        // Step 2: Data - Actually load the data
        await updateStep(1, 'loading');
        setProgress(60);
        
        // Prefetch all data in parallel
        await Promise.all([
          prefetchMarketData(),
          prefetchBlackFloorData()
        ]);
        
        setProgress(90);
        await updateStep(1, 'success');

        // Complete
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 400));
        onComplete();
      } catch (error) {
        console.error('Error during loading:', error);
        // Continue anyway after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        onComplete();
      }
    };

    processSteps();
  }, [onComplete, prefetchMarketData, prefetchBlackFloorData]);

  const updateStep = async (index: number, status: LoadingStep['status']) => {
    setCurrentStep(index);
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ));
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
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

      {/* Radial gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(33,150,243,0.12) 0%, transparent 70%)',
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
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8 w-full"
        >
          {/* Logo with glow effect */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary to-accent blur-xl opacity-40 animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm flex items-center justify-center border border-primary/20">
                <TonIcon className="w-14 h-14" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-gradient mb-2 tracking-tight">
              Nova Charts
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Preparing your experience
            </p>
          </motion.div>

          {/* Modern Progress Bar */}
          <div className="space-y-3 w-full px-4">
            <div className="relative h-2.5 bg-gradient-to-r from-muted via-muted to-muted rounded-full overflow-hidden shadow-inner">
              {/* Animated gradient fill */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="w-full h-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x"></div>
              </motion.div>
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '300%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-primary">{progress}%</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </div>
          </div>

          {/* Loading Steps - Minimalist */}
          <motion.div 
            className="space-y-2 w-full px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/30 backdrop-blur-md border border-border/30 shadow-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="flex-shrink-0">
                  {step.status === 'loading' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent" />
                    </motion.div>
                  )}
                  {step.status === 'success' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-muted/50" />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  step.status === 'success' ? 'text-foreground' : 
                  step.status === 'loading' ? 'text-primary' :
                  'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom Section - Nova Bots Series */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <div className="relative inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl"></div>
            
            {/* Text */}
            <div className="relative px-6 py-3 rounded-full bg-card/40 backdrop-blur-md border border-primary/20">
              <div className="flex items-center gap-2">
                <NvaIcon className="w-5 h-5" />
                <p className="text-sm font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Nova Bots Series
                </p>
                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom CSS for gradient animation */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AppLoader;
