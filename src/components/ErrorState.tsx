import React from 'react';
import { Button } from '@/components/ui/button';
import TonIcon from './TonIcon';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  canRetry: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, canRetry }) => {
  const [countdown, setCountdown] = React.useState<number | null>(null);

  // Handle rate limit countdown
  React.useEffect(() => {
    if (error.startsWith('RATE_LIMIT_EXCEEDED:')) {
      const seconds = parseInt(error.split(':')[1], 10);
      if (seconds > 0) {
        setCountdown(seconds);
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              // Auto retry when countdown reaches 0
              setTimeout(() => onRetry(), 1000);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [error, onRetry]);

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
          title: 'Server Error',
          description: 'A server error occurred. Please try again later.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };

      case 'NETWORK_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'Connection Error',
          description: 'Unable to connect to server. Please check your internet connection and try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };

      case 'TIMEOUT_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Request Timeout',
          description: 'The request took longer than expected. Please try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };

      case 'RATE_LIMIT_EXCEEDED':
        if (error.startsWith('RATE_LIMIT_EXCEEDED:')) {
          const seconds = parseInt(error.split(':')[1], 10);
          return {
            icon: <TonIcon className="w-12 h-12 text-warning" />,
            title: 'Rate Limit Exceeded',
            description: countdown !== null 
              ? `Please wait ${countdown} seconds before trying again` 
              : `Please wait ${seconds} seconds before trying again`,
            action: countdown !== null ? (
              <div className="mt-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-2xl font-mono font-bold text-warning">
                    {countdown}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Will retry automatically when countdown finishes
                </div>
              </div>
            ) : null
          };
        }
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Rate Limit Exceeded',
          description: 'Too many requests sent. Please wait before trying again.',
          action: null
        };

      case 'INSECURE_API_URL':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'Mixed Content Issue Resolved',
          description: 'Using HTTPS proxy to access HTTP server. You can also change connection settings.',
          action: (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    const currentUrl = localStorage.getItem('API_BASE_URL') || 'http://207.180.203.9:5000';
                    const url = window.prompt('Enter server URL (HTTPS preferred):', currentUrl);
                    if (url && url !== currentUrl) {
                      try {
                        localStorage.setItem('API_BASE_URL', url.trim());
                        window.location.reload();
                      } catch (e) {
                        console.error('Failed to save API URL', e);
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <TonIcon className="w-4 h-4 mr-2" />
                  Change Server URL
                </Button>
                
                <Button
                  onClick={() => {
                    const currentProxy = localStorage.getItem('CORS_PROXY_URL') || 'https://corsproxy.io';
                    const proxy = window.prompt('Enter proxy URL (HTTPS):', currentProxy);
                    if (proxy && proxy !== currentProxy) {
                      try {
                        localStorage.setItem('CORS_PROXY_URL', proxy.trim());
                        window.location.reload();
                      } catch (e) {
                        console.error('Failed to save proxy URL', e);
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <TonIcon className="w-4 h-4 mr-2" />
                  Change Proxy
                </Button>

                <Button
                  onClick={() => {
                    const current = localStorage.getItem('FORCE_PROXY') === 'true';
                    localStorage.setItem('FORCE_PROXY', (!current).toString());
                    window.location.reload();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <TonIcon className="w-4 h-4 mr-2" />
                  {localStorage.getItem('FORCE_PROXY') === 'true' ? 'Disable Proxy' : 'Enable Proxy'}
                </Button>
              </div>
              
              {canRetry ? (
                <Button onClick={onRetry} variant="default" className="w-full">
                  <TonIcon className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              ) : null}
              
              <Button
                onClick={() => {
                  localStorage.removeItem('API_BASE_URL');
                  localStorage.removeItem('CORS_PROXY_URL');
                  localStorage.removeItem('FORCE_PROXY');
                  window.location.reload();
                }}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
              >
                Reset Settings
              </Button>
            </div>
          )
        };

      case 'CORS_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'Security Error',
          description: 'Security issue while connecting to server. Please try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };

      case 'PARSE_ERROR':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Data Processing Error',
          description: 'Error occurred while processing server response. Please try again.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };

      case 'ACCESS_FORBIDDEN':
        return {
          icon: <TonIcon className="w-12 h-12 text-destructive" />,
          title: 'Access Forbidden',
          description: 'Access request was denied by the server. Please try again later.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ) : null
        };
      
      case 'CANNOT_RECEIVE_GIFTS':
        return {
          icon: <TonIcon className="w-12 h-12 text-warning" />,
          title: 'Cannot Access Gifts',
          description: 'NFT gifts for this user are private or restricted. You do not have permission to view their gift collection.',
          action: canRetry ? (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <TonIcon className="w-4 h-4 mr-2" />
              Try Another User
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