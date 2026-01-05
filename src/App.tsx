import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLoader from "@/components/AppLoader";
import AppLayout from "@/components/AppLayout";
import { useDataPrefetch } from "@/hooks/useDataPrefetch";
import { AuthProvider } from "@/contexts/AuthContext";

// Lazy load pages - يتم تحميلها فقط عند الحاجة
// Removed: ProfitCalculatorPage, ToolsPage (merged into sidebar)
const Index = lazy(() => import("./pages/Index"));
const Chart = lazy(() => import("./pages/Chart"));
const HeatmapPage = lazy(() => import("./pages/HeatmapPage"));
const MarketStatsPage = lazy(() => import("./pages/MarketStatsPage"));
const PortfolioTrackerPage = lazy(() => import("./pages/PortfolioTrackerPage"));
const GiftDetail = lazy(() => import("./pages/GiftDetail"));
const RegularGiftDetail = lazy(() => import("./pages/RegularGiftDetail"));
const ProfileSettingsPage = lazy(() => import("./pages/ProfileSettingsPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminAdsPage = lazy(() => import("./pages/AdminAdsPage"));
const TradingPage = lazy(() => import("./pages/TradingPage"));
const PriceAlertsPage = lazy(() => import("./pages/PriceAlertsPage"));
const CryptoPage = lazy(() => import("./pages/CryptoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdsBanner = lazy(() => import("@/components/AdsBanner"));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Configure React Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data stays fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Cache data for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1,
    },
  },
});

// Data prefetch component
const DataPrefetcher = ({ children }: { children: React.ReactNode }) => {
  useDataPrefetch();
  return <>{children}</>;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Force dark theme on mount


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        themes={["light", "dark", "electric"]}
        enableSystem={false}
        storageKey="nova-theme"
      >
        <TooltipProvider>
          <ErrorBoundary>
            <AuthProvider>
              <Toaster />
              <Sonner />
              {isLoading ? (
                <AppLoader onComplete={() => setIsLoading(false)} />
              ) : (
                <BrowserRouter>
                  <DataPrefetcher>
                    <Suspense fallback={<PageLoader />}>
                      <AppLayout>
                        {/* Ads Banner at the top of all pages */}
                        <Suspense fallback={null}>
                          <AdsBanner />
                        </Suspense>

                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/chart" element={<Chart />} />
                          <Route path="/heatmap" element={<HeatmapPage />} />
                          <Route path="/market-stats" element={<MarketStatsPage />} />
                          <Route path="/portfolio-tracker" element={<PortfolioTrackerPage />} />
                          <Route path="/gift/:name" element={<GiftDetail />} />
                          <Route path="/regular-gift/:id" element={<RegularGiftDetail />} />
                          <Route path="/settings" element={<ProfileSettingsPage />} />
                          <Route path="/admin" element={<AdminPanel />} />
                          <Route path="/admin/ads" element={<AdminAdsPage />} />
                          <Route path="/trade" element={<TradingPage />} />
                          <Route path="/price-alerts" element={<PriceAlertsPage />} />
                          <Route path="/crypto" element={<CryptoPage />} />
                          {/* Redirects */}
                          <Route path="/market" element={<Navigate to="/" replace />} />
                          <Route path="/tools" element={<Navigate to="/" replace />} />
                          <Route path="/tools" element={<Navigate to="/" replace />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </Suspense>
                  </DataPrefetcher>
                </BrowserRouter>
              )}
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
