import { supabase } from "@/integrations/supabase/client";

export interface Suggestion {
  name: string;
  slug: string;
  type: "listing" | "event";
  reason: string;
  context: string;
  category?: string;
  categorySlug?: string;
  rating?: number | null;
  reviewCount?: number | null;
  address?: string | null;
  priceLevel?: string | null;
  familyFriendly?: boolean;
  imageUrl?: string | null;
  imageStatus?: string;
}

export interface RoamResponse {
  lead: string;
  suggestions: Suggestion[];
  followUp: string;
  source: "ai" | "curated";
}

export async function askRoamConcierge(
  query: string,
  citySlug: string = "belfast",
): Promise<RoamResponse> {
  const { data, error } = await supabase.functions.invoke("roam-concierge", {
    body: { query, citySlug },
  });

  if (error) {
    console.error("ROAM concierge error:", error);
    throw new Error("Unable to get recommendations right now.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as RoamResponse;
}
