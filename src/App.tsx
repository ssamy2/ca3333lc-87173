import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Chart from "./pages/Chart";
import GiftDetail from "./pages/GiftDetail";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLoader from "@/components/AppLoader";
import { useDataPrefetch } from "@/hooks/useDataPrefetch";
import { AuthProvider } from "@/contexts/AuthContext";

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        themes={["light", "dark"]}
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
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/chart" element={<Chart />} />
                      <Route path="/gift/:name" element={<GiftDetail />} />
                      <Route path="/settings" element={<ProfileSettingsPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
