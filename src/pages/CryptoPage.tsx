import React from 'react';
import { Bitcoin, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const CryptoPage: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const t = {
    ar: {
      title: 'العملات الرقمية',
      subtitle: 'تتبع أسعار العملات الرقمية',
      comingSoon: 'قريباً',
      comingSoonDesc: 'نعمل على إضافة ميزات تتبع العملات الرقمية'
    },
    en: {
      title: 'Crypto',
      subtitle: 'Track cryptocurrency prices',
      comingSoon: 'Coming Soon',
      comingSoonDesc: 'We are working on adding crypto tracking features'
    }
  };

  const text = t[language] || t.en;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - consistent with design system */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className={cn(
          "flex items-center gap-4 p-4 max-w-5xl mx-auto",
          isRTL && "flex-row-reverse"
        )}>
          <div className="p-2.5 bg-[hsl(var(--warning))]/10 rounded-xl ring-1 ring-[hsl(var(--warning))]/20">
            <Bitcoin className="w-5 h-5 text-[hsl(var(--warning))]" />
          </div>
          <div className={cn("flex flex-col", isRTL && "items-end")}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {text.title}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">{text.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content - consistent padding and shadows */}
      <div className="p-4 max-w-5xl mx-auto">
        {/* Coming Soon Card - using design system card styling */}
        <div className="telegram-card p-8 text-center space-y-6">
          {/* Icon with glow effect */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--warning))]/30 to-primary/30 rounded-full blur-xl animate-glow-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-[hsl(var(--warning))]/20 to-primary/20 rounded-2xl flex items-center justify-center border border-[hsl(var(--warning))]/30 shadow-[var(--shadow-lg)]">
              <Bitcoin className="w-12 h-12 text-[hsl(var(--warning))]" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{text.comingSoon}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {text.comingSoonDesc}
            </p>
          </div>

          {/* Placeholder cards preview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8 opacity-50">
            {[
              { name: 'TON', change: '+5.2%', positive: true },
              { name: 'BTC', change: '-2.1%', positive: false },
              { name: 'ETH', change: '+3.8%', positive: true },
            ].map((crypto, i) => (
              <div 
                key={i}
                className="bg-card/50 rounded-xl p-4 border border-border/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{crypto.name}</span>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  crypto.positive ? "text-[hsl(var(--success))]" : "text-destructive"
                )}>
                  {crypto.positive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {crypto.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPage;
