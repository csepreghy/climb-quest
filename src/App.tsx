import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LogBoulder from "./pages/LogBoulder";

import Shop from "./pages/Shop";
import Inventory from "./pages/Inventory";
import MyGym from "./pages/MyGym";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import Hangboard from "./pages/Hangboard";
import HangboardBuilder from "./pages/HangboardBuilder";
import HangboardCalibration from "./pages/HangboardCalibration";
import { GameBackground } from "./components/pixel/GameBackground";
import { LevelUpBanner } from "./components/pixel/LevelUpBanner";
import { BadgeUnlockBanner } from "./components/pixel/BadgeUnlockBanner";
import { StreakMilestoneBanner } from "./components/pixel/StreakMilestoneBanner";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import { RequireAuth, RequireAdmin } from "./components/RequireAuth";
import { GameSync } from "./game/sync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <GameBackground />
      <LevelUpBanner />
      <BadgeUnlockBanner />
      <StreakMilestoneBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GameSync />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/home" element={<Dashboard />} />
                <Route path="/log" element={<LogBoulder />} />
                
                <Route path="/shop" element={<Shop />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/gym" element={<MyGym />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/hangboard" element={<Hangboard />} />
                <Route path="/hangboard/new" element={<HangboardBuilder />} />
                <Route path="/hangboard/edit/:id" element={<HangboardBuilder />} />
                <Route path="/hangboard/run/:id" element={<Hangboard />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/hangboard-calibration" element={<HangboardCalibration />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
