import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TonIcon from '@/components/TonIcon';
import { LogOut, RefreshCw } from 'lucide-react';

const TelegramApp = React.lazy(() => import('@/components/TelegramApp'));

const Index: React.FC = () => {
  const { isAuthenticated, isLoading, authenticate, logout, operationsRemaining, username } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-authenticate if Telegram data is available and not already authenticated
    const initTelegramAuth = async () => {
      if (!isAuthenticated && !isLoading && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp as any;
        const initData = webApp.initDataUnsafe;
        const initDataString = webApp.initData;
        
        if (initDataString && initData?.user) {
          try {
            setIsAuthenticating(true);
            await authenticate(initDataString);
            console.log('✅ Authentication successful');
          } catch (error) {
            console.error('Authentication failed:', error);
            toast({
              title: "Authentication Failed",
              description: "Failed to authenticate with Telegram. Please try again.",
              variant: "destructive"
            });
          } finally {
            setIsAuthenticating(false);
          }
        }
      }
    };

    initTelegramAuth();
  }, [isAuthenticated, isLoading, authenticate, toast]);

  // Show splash screen during initial load or authentication
  if (showSplash || isLoading || isAuthenticating) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show authentication required screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <TonIcon className="w-20 h-20 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">NFT Gifts Market</h1>
            <p className="text-muted-foreground">
              Please open this app through Telegram to access your NFT gifts.
            </p>
          </div>

          <div className="telegram-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">
              This app requires Telegram authentication to access market data and protect against unauthorized access.
            </p>
            
            <Button 
              className="w-full" 
              onClick={() => {
                const initDataString = (window.Telegram?.WebApp as any)?.initData;
                if (initDataString) {
                  setIsAuthenticating(true);
                  authenticate(initDataString)
                    .catch((error) => {
                      toast({
                        title: "Authentication Failed",
                        description: error.message || "Please try again",
                        variant: "destructive"
                      });
                    })
                    .finally(() => setIsAuthenticating(false));
                } else {
                  toast({
                    title: "Telegram Not Detected",
                    description: "Please open this app through Telegram",
                    variant: "destructive"
                  });
                }
              }}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Authenticate with Telegram'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show main app
  return (
    <div className="relative">
      {/* Operations Counter */}
      <div className="fixed top-4 right-4 z-50 telegram-card px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Operations:</span>
          <span className="font-bold text-primary">{operationsRemaining}/100</span>
          {username && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">@{username}</span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              toast({
                title: "Logged Out",
                description: "You have been logged out successfully"
              });
            }}
            className="ml-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        
        {operationsRemaining <= 10 && (
          <p className="text-xs text-destructive mt-1">
            Low operations remaining! Re-authenticate soon.
          </p>
        )}
      </div>

      <Suspense fallback={<div className="p-4 text-center">Loading…</div>}>
        <TelegramApp />
      </Suspense>
    </div>
  );
};

export default Index;
