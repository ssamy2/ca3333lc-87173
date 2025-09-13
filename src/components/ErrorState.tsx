import React from 'react';
import { Button } from '@/components/ui/button';
import TonIcon from './TonIcon';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  canRetry: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, canRetry }) => {
  const getErrorContent = () => {
    switch (error) {
      case 'no_gifts':
        return {
          icon: <TonIcon className="w-12 h-12 text-muted-foreground" />,
          title: 'No NFT Gifts Found',
          description: 'This user doesn\'t have any open NFT gifts to display.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };
      
      case 'user_not_found':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'User Not Found',
          description: 'The username you entered could not be found. Please check the spelling and try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };
      
      case 'rate_limit':
      case 'rate_limit_exceeded':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Rate Limited',
          description: 'You\'re making requests too quickly. Please wait a moment before trying again.',
          action: null
        };
      
      case 'flood_wait':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Telegram Flood Protection',
          description: 'Telegram\'s flood protection is active. Please wait before making another request.',
          action: null
        };
      
      case 'server_error':
      case 'SERVER_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'خطأ في الخادم',
          description: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          ) : null
        };

      case 'NETWORK_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'خطأ في الاتصال',
          description: 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          ) : null
        };

      case 'TIMEOUT_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'انتهت مهلة الاتصال',
          description: 'استغرق الطلب وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          ) : null
        };

      case 'RATE_LIMIT_EXCEEDED':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'تم تجاوز حد الطلبات',
          description: 'تم إرسال الكثير من الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى.',
          action: null
        };

      case 'CORS_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'خطأ في الأمان',
          description: 'مشكلة في الأمان أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          ) : null
        };

      case 'PARSE_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'خطأ في معالجة البيانات',
          description: 'حدث خطأ أثناء معالجة استجابة الخادم. يرجى المحاولة مرة أخرى.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          ) : null
        };
      
      case 'CANNOT_RECEIVE_GIFTS':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'لا يمكن الوصول للهدايا',
          description: 'هدايا NFT لهذا المستخدم خاصة أو محدودة. ليس لديك إذن لعرض مجموعة الهدايا الخاصة به.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              جرب مستخدم آخر
            </Button>
          ) : null
        };
      
      default:
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'Something Went Wrong',
          description: error || 'An unexpected error occurred. Please try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };
    }
  };

  const { icon, title, description, action } = getErrorContent();

  return (
    <div className="telegram-card p-8 text-center animate-fade-in">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
};

export default ErrorState;