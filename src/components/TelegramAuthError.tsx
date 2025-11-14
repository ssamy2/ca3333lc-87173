import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TelegramAuthError: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: 'Telegram WebApp Required',
      description: 'This application must be opened through Telegram WebApp.',
      instruction: 'Please open this app from within Telegram using the bot link.',
      exitButton: 'Exit Application',
      telegramLogo: 'Telegram'
    },
    ru: {
      title: 'Требуется Telegram WebApp',
      description: 'Это приложение должно быть открыто через Telegram WebApp.',
      instruction: 'Пожалуйста, откройте это приложение из Telegram, используя ссылку бота.',
      exitButton: 'Выйти из приложения',
      telegramLogo: 'Telegram'
    },
    ar: {
      title: 'يتطلب تطبيق Telegram',
      description: 'يجب فتح هذا التطبيق عبر Telegram WebApp.',
      instruction: 'يرجى فتح هذا التطبيق من داخل Telegram باستخدام رابط البوت.',
      exitButton: 'الخروج من التطبيق',
      telegramLogo: 'تيليجرام'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const handleExit = () => {
    // Try to close the WebApp if available
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      // Fallback: redirect to Telegram
      window.location.href = 'https://telegram.org';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 dark:border-gray-700">
          {/* Telegram Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg 
                  className="w-14 h-14 text-white" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Instruction Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                {t.instruction}
              </p>
            </div>
          </div>

          {/* Exit Button */}
          <Button
            onClick={handleExit}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            {t.exitButton}
          </Button>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by {t.telegramLogo} WebApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramAuthError;
