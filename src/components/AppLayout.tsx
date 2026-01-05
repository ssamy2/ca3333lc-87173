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

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  activeTab = 'chart',
  onTabChange,
  showNav = true,
  className
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Handler for Gift Calculator - navigates to home page
  const handleGoToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

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

      {/* Mobile Bottom Navigation */}
      {showNav && onTabChange && (
        <div className="lg:hidden">
          <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}
    </div>
  );
};

export default AppLayout;
