/**
 * ============================================================================
 * NOVA APP LAYOUT - Responsive Single-App Experience
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 * 
 * - Desktop/Tablet: Sidebar navigation with main content area
 * - Mobile: Bottom navigation with full-screen content
 * - Seamless transitions between all pages
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSidebar from './AppSidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: 'home' | 'chart' | 'tools' | 'crypto' | 'settings' | 'trade';
  onTabChange?: (tab: 'home' | 'chart' | 'tools' | 'crypto' | 'settings' | 'trade') => void;
  showNav?: boolean;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  showNav = true,
  className
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Handler for Gift Calculator - navigates to home page
  const handleGoToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Determine active tab from current route
  const currentActiveTab = useMemo(() => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path === '/' || path === '/chart') return 'chart';
    if (path.startsWith('/trade')) return 'trade';
    if (path.startsWith('/crypto')) return 'crypto';
    if (path.startsWith('/settings')) return 'settings';
    // Tools pages
    if (path.startsWith('/user-gift-calculator') || 
        path.startsWith('/nft-profit') || 
        path.startsWith('/price-alerts') || 
        path.startsWith('/heatmap') || 
        path.startsWith('/market-stats') ||
        path.startsWith('/price-comparison') ||
        path.startsWith('/favorites')) return 'tools';
    return 'chart';
  }, [activeTab, location.pathname]);

  // Internal tab change handler that navigates to routes
  const handleTabChange = useCallback((tab: 'home' | 'chart' | 'tools' | 'crypto' | 'settings' | 'trade') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Navigate to appropriate route based on tab
      switch (tab) {
        case 'chart':
          navigate('/chart');
          break;
        case 'trade':
          navigate('/trade');
          break;
        case 'tools':
          navigate('/tools'); // Navigate to Tools page with all tools
          break;
        case 'crypto':
          navigate('/crypto');
          break;
        case 'settings':
          navigate('/settings');
          break;
        default:
          navigate('/chart');
      }
    }
  }, [navigate, onTabChange]);

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'transition-colors duration-300',
      isRTL && 'rtl'
    )}>
      {/* Desktop Sidebar - Smart Hover with GPU acceleration */}
      {showNav && <AppSidebar onGoToHome={handleGoToHome} />}

      {/* Main Content Area */}
      <main className={cn(
        'min-h-screen transition-all duration-300',
        // Match sidebar collapsed width (60px)
        showNav && 'lg:pl-[60px]',
        isRTL && showNav && 'lg:pl-0 lg:pr-[60px]',
        'pb-20 lg:pb-0',
        className
      )}>
        {/* Page Content */}
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Always visible on mobile */}
      {showNav && (
        <div className="lg:hidden">
          <BottomNav activeTab={currentActiveTab} onTabChange={handleTabChange} />
        </div>
      )}
    </div>
  );
};

export default AppLayout;
