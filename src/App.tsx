import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CityPage from "./pages/CityPage.tsx";
import CitiesPage from "./pages/CitiesPage.tsx";
import CategoriesPage from "./pages/CategoriesPage.tsx";
import ProgrammaticPage from "./pages/ProgrammaticPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/best-:slug" element={<ProgrammaticPage />} />
          <Route path="/:citySlug" element={<CityPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
