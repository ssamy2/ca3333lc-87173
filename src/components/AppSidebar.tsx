/**
 * ============================================================================
 * NOVA APP SIDEBAR - Smart Hover Sidebar (Desktop Only)
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * Features:
 * - Collapsed: 60px width, icons only
 * - Expanded on hover: 250px width, icon + label (RTL support)
 * - GPU-accelerated CSS transitions for 60fps on low-end devices
 * - All tools from /tools page integrated directly
 * - Removed: Profit Calculator, /tools page route
 * - User Gift Calc redirects to internal tool component
 * ============================================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import {
  TrendingUp,
  LineChart,
  Settings,
  Sun,
  Moon,
  Flame,
  BarChart3,
  Bell,
  Sparkles,
  User,
  Grid3X3,
  Bitcoin,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  labelAr: string;
  path?: string;
  action?: () => void;
  badge?: string;
}

// Nova Channel Link
const NOVA_CHANNEL = 'https://t.me/Nova_Gifts';

// Navigation items - All tools from /tools page integrated
// Removed: Profit Calculator, /tools page route
const getNavItems = (onGiftCalcClick?: () => void): NavItem[] => [
  { id: 'chart', icon: TrendingUp, label: 'Market', labelAr: 'السوق', path: '/chart' },
  { id: 'trade', icon: LineChart, label: 'Trade', labelAr: 'تداول', path: '/trade' },
  { id: 'heatmap', icon: Flame, label: 'Heatmap', labelAr: 'خريطة حرارية', path: '/heatmap' },
  { id: 'stats', icon: BarChart3, label: 'Statistics', labelAr: 'الإحصائيات', path: '/market-stats' },
  { id: 'crypto', icon: Bitcoin, label: 'Crypto', labelAr: 'العملات', path: '/crypto' },
  // User Gift Calculator - Dedicated route
  { id: 'gift-calc', icon: User, label: 'Gift Calculator', labelAr: 'حاسبة الهدايا', path: '/user-gift-calculator' },
  { id: 'alerts', icon: Bell, label: 'Alerts', labelAr: 'التنبيهات', path: '/price-alerts' },
  { id: 'settings', icon: Settings, label: 'Settings', labelAr: 'الإعدادات', path: '/settings' },
];

interface AppSidebarProps {
  className?: string;
  onGoToHome?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ className, onGoToHome }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const isRTL = language === 'ar';

  // Smart hover behavior - expanded only on hover
  const isExpanded = isHovered;

  // Get nav items with gift calc action
  const navItems = getNavItems(onGoToHome);

  // Memoized hover handlers for performance
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleNavigation = useCallback((item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  }, [navigate]);

  const getActiveItem = useCallback(() => {
    const path = location.pathname;
    if (path === '/' || path === '/chart') return 'chart';
    const item = navItems.find(item => item.path && path.startsWith(item.path));
    return item?.id || 'chart';
  }, [location.pathname, navItems]);

  const activeItem = getActiveItem();

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'fixed top-0 left-0 z-50 h-screen',
        'hidden lg:flex flex-col',
        // GPU-accelerated transition for 60fps on low-end devices
        'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        // GPU acceleration for smooth performance
        'transform-gpu will-change-[width]',
        // Collapsed: 60px, Expanded: 250px (as per spec)
        isExpanded ? 'w-[250px]' : 'w-[60px]',
        isRTL && 'left-auto right-0',
        className
      )}
      style={{
        // Force GPU layer for smooth animations
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Sidebar Background with Glassmorphism - GPU accelerated */}
      <div 
        className="absolute inset-0 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 opacity-50" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Logo Section */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border/50',
          isExpanded ? 'justify-start gap-3' : 'justify-center'
        )}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0 transform-gpu">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
                Nova
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 whitespace-nowrap">
                Gift Analytics
              </span>
            </div>
          )}
        </div>

        {/* Navigation - Lazy loaded items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const label = isRTL ? item.labelAr : item.label;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                  // GPU-accelerated transitions
                  'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
                  'transform-gpu',
                  'group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                  !isExpanded && 'justify-center px-0'
                )}
                style={{ transform: 'translateZ(0)' }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full',
                    'bg-gradient-to-b from-primary to-accent',
                    isRTL && 'left-auto right-0 rounded-r-none rounded-l-full'
                  )} />
                )}

                {/* Icon container */}
                <div className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                  'transition-all duration-200 transform-gpu',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'group-hover:bg-sidebar-accent'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    'group-hover:scale-110'
                  )} />
                </div>

                {/* Label - only shown when expanded */}
                {isExpanded && (
                  <span className={cn(
                    'flex-1 text-sm font-medium truncate whitespace-nowrap',
                    isRTL ? 'text-right' : 'text-left'
                  )}>
                    {label}
                  </span>
                )}

                {/* Badge */}
                {isExpanded && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent/20 text-accent">
                    {item.badge}
                  </span>
                )}

                {/* Hover effect - GPU accelerated */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  '-z-10 transform-gpu'
                )} />
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-sidebar-border/50 space-y-2">
          {/* Nova Channel Link */}
          <button
            onClick={() => window.open(NOVA_CHANNEL, '_blank', 'noopener,noreferrer')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'text-muted-foreground hover:text-accent',
              'hover:bg-accent/10 transition-all duration-200',
              'group transform-gpu border border-transparent hover:border-accent/30',
              !isExpanded && 'justify-center px-0'
            )}
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <ExternalLink className="w-4 h-4 text-accent" />
            </div>
            {isExpanded && (
              <span className={cn(
                'flex-1 text-sm font-medium whitespace-nowrap text-accent',
                isRTL ? 'text-right' : 'text-left'
              )}>
                {isRTL ? 'قناة نوفا' : 'Nova Channel'}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-sidebar-accent transition-all duration-200',
              'group transform-gpu',
              !isExpanded && 'justify-center px-0'
            )}
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-sidebar-accent transition-colors">
              {isDark ? (
                <Sun className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 group-hover:text-primary transition-colors" />
              )}
            </div>
            {isExpanded && (
              <span className={cn(
                'flex-1 text-sm font-medium whitespace-nowrap',
                isRTL ? 'text-right' : 'text-left'
              )}>
                {isDark
                  ? (isRTL ? 'الوضع الفاتح' : 'Light Mode')
                  : (isRTL ? 'الوضع الداكن' : 'Dark Mode')
                }
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
