import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LogBoulder from "./pages/LogBoulder";
import Character from "./pages/Character";
import Shop from "./pages/Shop";
import Inventory from "./pages/Inventory";
import MyGym from "./pages/MyGym";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import { GameBackground } from "./components/pixel/GameBackground";
import { LevelUpBanner } from "./components/pixel/LevelUpBanner";
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GameSync />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/log" element={<LogBoulder />} />
                <Route path="/bosses" element={<Bosses />} />
                <Route path="/character" element={<Character />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/gym" element={<MyGym />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<Admin />} />
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
