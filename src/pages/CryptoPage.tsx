import React from 'react';
import { Card } from '@/components/ui/card';
import { Bitcoin, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const CryptoPage: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    ar: {
      crypto: 'كريبتو',
      comingSoon: 'ستتوفر قريباً',
      description: 'نعمل على إضافة ميزات تتبع العملات الرقمية وتحليلات السوق',
      features: [
        'تتبع أسعار العملات الرقمية',
        'تحليلات السوق المباشرة',
        'تنبيهات الأسعار',
        'محفظة افتراضية'
      ],
      stayTuned: 'ترقبوا التحديثات!'
    },
    en: {
      crypto: 'Crypto',
      comingSoon: 'Coming Soon',
      description: 'We are working on adding cryptocurrency tracking features and market analytics',
      features: [
        'Cryptocurrency price tracking',
        'Live market analytics',
        'Price alerts',
        'Virtual portfolio'
      ],
      stayTuned: 'Stay tuned for updates!'
    }
  };

  const text = t[language] || t.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 p-4">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Bitcoin className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{text.crypto}</h1>
            <p className="text-xs text-slate-400">{text.comingSoon}</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <Bitcoin className="w-12 h-12 text-amber-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{text.comingSoon}</h2>
              <p className="text-slate-400 text-sm">{text.description}</p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {text.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-3 border border-white/5"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stay Tuned */}
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-amber-400">{text.stayTuned}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CryptoPage;
