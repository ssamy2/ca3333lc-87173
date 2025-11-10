import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SubscribePromptProps {
  onCheckAgain: () => void;
}

const SubscribePrompt = ({ onCheckAgain }: SubscribePromptProps) => {
  const handleSubscribe = () => {
    window.open('https://t.me/GT_Rolet', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Logo and Title */}
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-primary-foreground">NC</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Nova Charts
            </h1>
            <p className="text-lg text-muted-foreground">
              تتبع أسعار هدايا تيليجرام
            </p>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="relative z-10 space-y-6 bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-xl">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              اشترك في قناتنا
            </h2>
            <p className="text-muted-foreground">
              للوصول إلى جميع الميزات، يرجى الاشتراك في قناتنا على تيليجرام
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleSubscribe}
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <ExternalLink className="ml-2 h-5 w-5" />
              اشترك الآن
            </Button>

            <Button
              onClick={onCheckAgain}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              تحقق مرة أخرى
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4 border-t border-border/50">
            بعد الاشتراك، اضغط على "تحقق مرة أخرى" للمتابعة
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-muted-foreground">
          <p>مدعوم بواسطة Nova Charts</p>
        </div>
      </div>
    </div>
  );
};

export default SubscribePrompt;
