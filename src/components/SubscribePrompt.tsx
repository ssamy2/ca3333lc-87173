import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Bell, Gift, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubscribePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscribePrompt: React.FC<SubscribePromptProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: 'Join Nova Charts Community',
      subtitle: 'Get exclusive access to premium features',
      description: 'Stay ahead with real-time market insights, exclusive analysis, and early access to new features.',
      subscribeButton: 'Join Channel',
      benefits: {
        updates: 'Real-time Updates',
        exclusive: 'Exclusive Content',
        community: 'Active Community'
      }
    },
    ru: {
      title: 'Присоединяйтесь к Nova Charts',
      subtitle: 'Получите эксклюзивный доступ к премиум функциям',
      description: 'Будьте впереди с аналитикой рынка в реальном времени, эксклюзивными анализами и ранним доступом к новым функциям.',
      subscribeButton: 'Присоединиться',
      benefits: {
        updates: 'Обновления в реальном времени',
        exclusive: 'Эксклюзивный контент',
        community: 'Активное сообщество'
      }
    },
    ar: {
      title: 'انضم إلى مجتمع Nova Charts',
      subtitle: 'احصل على وصول حصري للميزات المتقدمة',
      description: 'كن في المقدمة مع رؤى السوق في الوقت الفعلي، والتحليلات الحصرية، والوصول المبكر للميزات الجديدة.',
      subscribeButton: 'انضم للقناة',
      benefits: {
        updates: 'تحديثات فورية',
        exclusive: 'محتوى حصري',
        community: 'مجتمع نشط'
      }
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/20 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl"></div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted/70 flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 mt-2 relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-white" fill="currentColor" />
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t.title}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {t.subtitle}
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                <div className="text-center p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
                  <Bell className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">{t.benefits.updates}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
                  <Gift className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">{t.benefits.exclusive}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
                  <Users className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">{t.benefits.community}</p>
                </div>
              </div>

              {/* Description */}
              <div className="text-center mb-6 relative z-10">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Subscribe Button */}
              <div className="relative z-10">
                <Button
                  asChild
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 border-0"
                >
                  <a 
                    href="https://t.me/GT_Rolet" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" fill="currentColor" />
                    {t.subscribeButton}
                  </a>
                </Button>
                
                {/* Skip Button */}
                <button
                  onClick={onClose}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {language === 'ar' ? 'تخطي الآن' : language === 'ru' ? 'Пропустить' : 'Skip for now'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribePrompt;
