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
          {/* Catch-all: programmatic SEO pages, city pages, or 404 */}
          <Route path="/*" element={<ProgrammaticPageOrCity />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

/**
 * Smart router: tries to match programmatic SEO slug first,
 * falls back to city page, then 404.
 */
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProgrammaticPageOrCity = () => {
  const { "*": path } = useParams();
  const slug = path || "";

  const { data: city, isLoading } = useQuery({
    queryKey: ["check-city", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("cities")
        .select("slug")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;

  // Exact city match → CityPage
  if (city) return <CityPage />;

  // Contains hyphens or matches known patterns → programmatic page
  if (slug.includes("-")) return <ProgrammaticPage />;

  // Nothing matched
  return <NotFound />;
};

export default App;
