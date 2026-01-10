import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider, AIProvider, DebateProvider, VoiceProvider } from "@/core/contexts";
import { ThemeProvider } from "@/core/contexts/ThemeProvider";
import { ErrorBoundary } from "./components/features";
import { Index } from "./pages/Index";
import { NotFound } from "./pages/NotFound";
import { LandingPage } from "./components/landing";
import { BusinessCaseAnalyzer } from "./modules/business-case";
import { MarketAnalysisSuite } from "./modules/market-analysis";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="bizcaseland-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <DataProvider>
              <AIProvider>
                <DebateProvider>
                  <VoiceProvider>
                    <Toaster />
                    <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/business" element={<BusinessCaseAnalyzer />} />
                      <Route path="/market" element={<MarketAnalysisSuite />} />
                      <Route path="/legacy" element={<Index />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                  </VoiceProvider>
                </DebateProvider>
              </AIProvider>
            </DataProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export { App };
