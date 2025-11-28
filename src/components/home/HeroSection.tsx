import React from 'react';
import { Search } from 'lucide-react';

interface HeroSectionProps {
  t: (key: string) => string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ t }) => {
  return (
    <section className="telegram-card p-5 border border-border/50 shadow-[var(--shadow-card)] space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">
          {t('heroTitle')}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t('heroDescription')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('heroExample')}
      </p>
    </section>
  );
};

export default HeroSection;
