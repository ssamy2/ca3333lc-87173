/**
 * ============================================================================
 * NOVA APP SIDEBAR - Premium Desktop Navigation
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import {
  TrendingUp,
  LineChart,
  Wrench,
  Bitcoin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Flame,
  BarChart3,
  Calculator,
  Bell,
  Sparkles,
  Menu,
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  labelAr: string;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'chart', icon: TrendingUp, label: 'Market', labelAr: 'السوق', path: '/chart' },
  { id: 'trade', icon: LineChart, label: 'Trade', labelAr: 'تداول', path: '/trade' },
  { id: 'heatmap', icon: Flame, label: 'Heatmap', labelAr: 'خريطة حرارية', path: '/heatmap' },
  { id: 'stats', icon: BarChart3, label: 'Statistics', labelAr: 'الإحصائيات', path: '/market-stats' },
  { id: 'tools', icon: Wrench, label: 'Tools', labelAr: 'أدوات', path: '/tools' },
  { id: 'calculator', icon: Calculator, label: 'Calculator', labelAr: 'حاسبة', path: '/profit-calculator' },
  { id: 'alerts', icon: Bell, label: 'Alerts', labelAr: 'التنبيهات', path: '/price-alerts' },
  { id: 'settings', icon: Settings, label: 'Settings', labelAr: 'الإعدادات', path: '/settings' },
];

interface AppSidebarProps {
  className?: string;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = language === 'ar';

  const isExpanded = !isCollapsed;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getActiveItem = () => {
    const path = location.pathname;
    if (path === '/' || path === '/chart') return 'chart';
    const item = navItems.find(item => path.startsWith(item.path));
    return item?.id || 'chart';
  };

  const activeItem = getActiveItem();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-screen',
        'hidden lg:flex flex-col',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-[280px]' : 'w-[72px]',
        isRTL && 'left-auto right-0',
        className
      )}
    >
      {/* Sidebar Background with Glassmorphism */}
      < div className="absolute inset-0 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border" >
        {/* Gradient overlay */}
        < div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 opacity-50" />
      </div >

      {/* Content */}
      < div className="relative flex flex-col h-full" >
        {/* Logo Section */}
        < div className={
          cn(
            'flex items-center h-16 px-4 border-b border-sidebar-border/50',
            isExpanded ? 'justify-between' : 'justify-center'
          )
        } >
          {
            isExpanded ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Nova
                    </span>
                    <span className="text-[10px] text-muted-foreground -mt-1">
                      Gift Analytics
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                >
                  <ChevronLeft className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isRTL && 'rotate-180'
                  )} />
                </button>
              </>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
        </div >

        {/* Navigation */}
        < nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" >
          {
            navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const label = isRTL ? item.labelAr : item.label;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                    'transition-all duration-200 ease-out',
                    'group relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                    !isExpanded && 'justify-center px-0'
                  )}
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
                    'transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'group-hover:bg-sidebar-accent'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      'group-hover:scale-110'
                    )} />
                  </div>

                  {/* Label */}
                  {isExpanded && (
                    <span className={cn(
                      'flex-1 text-sm font-medium truncate',
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

                  {/* Hover effect */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                    '-z-10'
                  )} />
                </button>
              );
            })
          }
        </nav >

        {/* Bottom Section */}
        < div className="p-3 border-t border-sidebar-border/50 space-y-2" >
          {/* Theme Toggle */}
          < button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={
              cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-sidebar-accent transition-all duration-200',
                'group',
                !isExpanded && 'justify-center px-0'
              )}
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-sidebar-accent transition-colors">
              {isDark ? (
                <Sun className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 group-hover:text-primary transition-colors" />
              )}
            </div>
            {
              isExpanded && (
                <span className={cn(
                  'flex-1 text-sm font-medium',
                  isRTL ? 'text-right' : 'text-left'
                )}>
                  {isDark
                    ? (isRTL ? 'الوضع الفاتح' : 'Light Mode')
                    : (isRTL ? 'الوضع الداكن' : 'Dark Mode')
                  }
                </span>
              )
            }
          </button >

          {/* Collapse Toggle (visible when expanded) */}
          {
            isExpanded && (
              <button
                onClick={() => setIsCollapsed(true)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-xl',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-sidebar-accent transition-all duration-200',
                  'text-xs'
                )}
              >
                <Menu className="w-4 h-4" />
                <span>{isRTL ? 'طي القائمة' : 'Collapse Menu'}</span>
              </button>
            )
          }
        </div >
      </div >
    </aside >
  );
};

export default AppSidebar;
