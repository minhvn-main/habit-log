import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/contexts/AppContext";
import { PeopleSettingsProvider } from "@/contexts/PeopleSettingsContext";
import { Layout } from "@/components/Layout";
import { Today } from "@/pages/Today";
import { CalendarPage } from "@/pages/Calendar";
import { Habits } from "@/pages/Habits";
import { Goals } from "@/pages/Goals";
import { Stats } from "@/pages/Stats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <PeopleSettingsProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Today />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/habits" element={<Habits />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </AppProvider>
        </PeopleSettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
