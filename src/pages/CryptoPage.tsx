import React from 'react';
import { Bitcoin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const CryptoPage: React.FC = () => {
  const { language } = useLanguage();

  const text = language === 'ar' ? 'قريباً' : 'Coming Soon';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
            <Bitcoin className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-white">{text}</h2>
      </div>
    </div>
  );
};

export default CryptoPage;
