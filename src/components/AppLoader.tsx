import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TonIcon from './TonIcon';
import NvaIcon from './NvaIcon';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
}

interface AppLoaderProps {
  onComplete: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onComplete }) => {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'auth', label: 'جاري المصادقة...', status: 'pending' },
    { id: 'data', label: 'تحميل البيانات...', status: 'pending' },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processSteps = async () => {
      // Step 1: Auth
      await updateStep(0, 'loading');
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateStep(0, 'success');

      // Step 2: Data
      await updateStep(1, 'loading');
      setProgress(70);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updateStep(1, 'success');

      // Complete
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      onComplete();
    };

    processSteps();
  }, [onComplete]);

  const updateStep = async (index: number, status: LoadingStep['status']) => {
    setCurrentStep(index);
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ));
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(33,150,243,0.08) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8"
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
              <TonIcon className="w-12 h-12" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              NFT Gifts
            </h1>
            <p className="text-muted-foreground text-sm">
              Preparing your experience
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary/30"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ width: '50%' }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {progress}%
            </div>
          </div>

          {/* Loading Steps */}
          <motion.div 
            className="space-y-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {step.status === 'loading' && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {step.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full bg-muted" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    step.status === 'success' ? 'text-foreground' : 
                    step.status === 'loading' ? 'text-primary' :
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Powered by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted-foreground flex items-center justify-center gap-2"
          >
            <span>Powered by</span>
            <NvaIcon className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AppLoader;
