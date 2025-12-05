import React from 'react';
import { Card } from '@/components/ui/card';
import { Grid3X3, Calculator, BarChart3, ChevronRight, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const ToolsPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = {
    ar: {
      tools: 'الأدوات',
      toolsDesc: 'أدوات تحليل وتتبع الهدايا',
      heatmap: 'خريطة الحرارة',
      heatmapDesc: 'عرض تغيرات أسعار الهدايا بشكل مرئي',
      calculator: 'حاسبة الأرباح',
      calculatorDesc: 'احسب أرباحك المتوقعة',
      analytics: 'تحليلات متقدمة',
      analyticsDesc: 'إحصائيات وتحليلات مفصلة',
      tryNow: 'جرب الآن',
      comingSoon: 'قريباً'
    },
    en: {
      tools: 'Tools',
      toolsDesc: 'Gift analysis and tracking tools',
      heatmap: 'Heatmap',
      heatmapDesc: 'Visualize gift price changes',
      calculator: 'Profit Calculator',
      calculatorDesc: 'Calculate your expected profits',
      analytics: 'Advanced Analytics',
      analyticsDesc: 'Detailed statistics and analytics',
      tryNow: 'Try Now',
      comingSoon: 'Coming Soon'
    }
  };

  const text = t[language] || t.en;

  const tools = [
    {
      id: 'heatmap',
      name: text.heatmap,
      description: text.heatmapDesc,
      icon: Grid3X3,
      color: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      available: true,
      route: '/heatmap'
    },
    {
      id: 'calculator',
      name: text.calculator,
      description: text.calculatorDesc,
      icon: Calculator,
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      available: false,
      route: null
    },
    {
      id: 'analytics',
      name: text.analytics,
      description: text.analyticsDesc,
      icon: BarChart3,
      color: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      available: false,
      route: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 p-4">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Wrench className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{text.tools}</h1>
            <p className="text-xs text-slate-400">{text.toolsDesc}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              onClick={() => tool.available && tool.route && navigate(tool.route)}
              className={`overflow-hidden bg-slate-800/50 border-white/10 rounded-2xl transition-all duration-300 ${
                tool.available ? 'cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02]' : 'opacity-70'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${tool.iconBg}`}>
                    <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{tool.name}</h3>
                      {!tool.available && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded-full">
                          {text.comingSoon}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{tool.description}</p>
                  </div>

                  {/* Arrow */}
                  {tool.available && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-sm font-medium">{text.tryNow}</span>
                      <ChevronRight className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsPage;
