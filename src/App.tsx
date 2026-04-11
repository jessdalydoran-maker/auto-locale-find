import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import CitiesPage from "./pages/CitiesPage.tsx";
import CategoriesPage from "./pages/CategoriesPage.tsx";
import ProgrammaticPage from "./pages/ProgrammaticPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import PlaceDetailPage from "./pages/PlaceDetailPage.tsx";
import EventDetailPage from "./pages/EventDetailPage.tsx";
import SubmitVenuePage from "./pages/SubmitVenuePage.tsx";
import SuggestEventPage from "./pages/SuggestEventPage.tsx";
import WeekendGuidePage from "./pages/WeekendGuidePage.tsx";
import BlogPage from "./pages/BlogPage.tsx";
import BlogPostPage from "./pages/BlogPostPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import RoamPage from "./pages/RoamPage.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminListingsPage from "./pages/admin/AdminListingsPage.tsx";
import AdminEventsPage from "./pages/admin/AdminEventsPage.tsx";
import AdminCitiesPage from "./pages/admin/AdminCitiesPage.tsx";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage.tsx";
import AdminAutomationPage from "./pages/admin/AdminAutomationPage.tsx";

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
          <Route path="/things-to-do-belfast-this-weekend" element={<WeekendGuidePage />} />
          <Route path="/submit-venue" element={<SubmitVenuePage />} />
          <Route path="/suggest-event" element={<SuggestEventPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/roam" element={<RoamPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/place/:slug" element={<PlaceDetailPage />} />
          <Route path="/event/:slug" element={<EventDetailPage />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="automation" element={<AdminAutomationPage />} />
          </Route>
          <Route path="/:citySlug/:slug" element={<CitySlugDetailPage />} />
          <Route path="/*" element={<ProgrammaticPageOrCity />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const CitySlugDetailPage = () => {
  const { citySlug, slug } = useParams();
  const isEventsRoute = slug === "events";

  const { data: isCategory, isLoading: catLoading } = useQuery({
    queryKey: ["check-category-slug", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("slug")
        .eq("slug", slug || "")
        .eq("is_active", true)
        .maybeSingle();
      return !!data;
    },
    enabled: !!slug && !isEventsRoute,
    staleTime: 1000 * 60 * 30,
  });

  if (catLoading) return null;

  if (isEventsRoute || isCategory) {
    return (
      <SearchPage
        presetTown={citySlug || ""}
        presetCategory={slug || "things-to-do"}
        forceExactTownOnly
        headingMode="location"
      />
    );
  }

  return <PlaceDetailPage />;
};

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

  if (city) {
    return (
      <SearchPage
        presetTown={slug}
        presetCategory="things-to-do"
        forceExactTownOnly
        headingMode="location"
      />
    );
  }

  return <ProgrammaticPage />;
};

export default App;
