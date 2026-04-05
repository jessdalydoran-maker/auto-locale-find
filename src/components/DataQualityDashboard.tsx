import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { QUALITY_THRESHOLDS } from "@/lib/listing-quality";

const ACCOMMODATION_KEYWORDS = [
  "guest house", "bed & breakfast", "self-catering", "serviced accommodation",
  "hotel", "hostel", "apartment building", "lodging",
];

const THINGS_TO_DO_CATEGORY = "Things To Do";

interface DataQualityDashboardProps {
  listings: any[];
  queryClient: any;
}

export const DataQualityDashboard = ({ listings, queryClient }: DataQualityDashboardProps) => {
  const [isHiding, setIsHiding] = useState(false);

  const stats = useMemo(() => {
    if (!listings?.length) return null;

    const noDescription = listings.filter(l => !l.short_description);
    const lowReviews = listings.filter(l => (l.review_count ?? 0) < QUALITY_THRESHOLDS.MIN_REVIEW_COUNT);
    const lowRating = listings.filter(l => (l.rating ?? 0) < QUALITY_THRESHOLDS.MIN_RATING);
    const noAddress = listings.filter(l => !l.address);

    const miscategorised = listings.filter(l => {
      const catName = (l.categories as any)?.name || "";
      if (catName !== THINGS_TO_DO_CATEGORY) return false;
      const desc = (l.short_description || "").toLowerCase();
      return ACCOMMODATION_KEYWORDS.some(kw => desc.includes(kw));
    });

    const belowThreshold = listings.filter(l => {
      if ((l.review_count ?? 0) < QUALITY_THRESHOLDS.MIN_REVIEW_COUNT) return true;
      if ((l.rating ?? 0) < QUALITY_THRESHOLDS.MIN_RATING) return true;
      if (!l.short_description) return true;
      if (!l.address) return true;
      return false;
    });

    return {
      total: listings.length,
      noDescription,
      lowReviews,
      lowRating,
      noAddress,
      miscategorised,
      belowThreshold,
      passingCount: listings.length - belowThreshold.length,
    };
  }, [listings]);

  const handleHideBelowThreshold = async () => {
    if (!stats?.belowThreshold.length) return;
    const confirmed = window.confirm(
      `This will hide ${stats.belowThreshold.length} listings that don't meet the quality threshold (< ${QUALITY_THRESHOLDS.MIN_REVIEW_COUNT} reviews, < ${QUALITY_THRESHOLDS.MIN_RATING}★, missing description, or missing address).\n\nContinue?`
    );
    if (!confirmed) return;

    setIsHiding(true);
    try {
      const ids = stats.belowThreshold.map(l => l.id);
      // Process in batches of 50
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const { error } = await supabase
          .from("listings")
          .update({ is_approved: false } as any)
          .in("id", batch);
        if (error) throw error;
      }
      toast.success(`Hidden ${ids.length} listings below quality threshold`);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) {
      toast.error("Failed to hide listings: " + String(err));
    } finally {
      setIsHiding(false);
    }
  };

  if (!stats) {
    return (
      <div className="bg-card rounded-xl p-6 card-shadow text-center text-muted-foreground text-sm">
        Loading listing data…
      </div>
    );
  }

  const cards = [
    {
      label: "Missing Description",
      count: stats.noDescription.length,
      total: stats.total,
      color: stats.noDescription.length > 0 ? "text-destructive" : "text-green-600",
      icon: AlertTriangle,
    },
    {
      label: `< ${QUALITY_THRESHOLDS.MIN_REVIEW_COUNT} Reviews`,
      count: stats.lowReviews.length,
      total: stats.total,
      color: stats.lowReviews.length > 0 ? "text-amber-500" : "text-green-600",
      icon: AlertTriangle,
    },
    {
      label: `< ${QUALITY_THRESHOLDS.MIN_RATING}★ Rating`,
      count: stats.lowRating.length,
      total: stats.total,
      color: stats.lowRating.length > 0 ? "text-amber-500" : "text-green-600",
      icon: AlertTriangle,
    },
    {
      label: "Missing Address",
      count: stats.noAddress.length,
      total: stats.total,
      color: stats.noAddress.length > 0 ? "text-amber-500" : "text-green-600",
      icon: AlertTriangle,
    },
    {
      label: "Miscategorised (Accommodation in Things To Do)",
      count: stats.miscategorised.length,
      total: stats.total,
      color: stats.miscategorised.length > 0 ? "text-destructive" : "text-green-600",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card rounded-xl p-6 card-shadow">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Data Quality Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className={`font-display font-bold text-xl ${card.color}`}>
                {card.count}
              </p>
              <p className="text-[10px] text-muted-foreground">of {card.total} listings</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">
              {stats.passingCount} of {stats.total} listings pass quality threshold
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Requires ≥{QUALITY_THRESHOLDS.MIN_REVIEW_COUNT} reviews, ≥{QUALITY_THRESHOLDS.MIN_RATING}★, description, and address
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleHideBelowThreshold}
            disabled={isHiding || stats.belowThreshold.length === 0}
          >
            {isHiding ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Hiding…</>
            ) : (
              <>Hide {stats.belowThreshold.length} Below Threshold</>
            )}
          </Button>
        </div>
      </div>

      {/* Miscategorised listings detail */}
      {stats.miscategorised.length > 0 && (
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground text-sm">
              Potentially Miscategorised ({stats.miscategorised.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              These "Things To Do" listings contain accommodation keywords
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Keyword</th>
                </tr>
              </thead>
              <tbody>
                {stats.miscategorised.slice(0, 20).map((listing: any) => {
                  const desc = (listing.short_description || "").toLowerCase();
                  const matchedKw = ACCOMMODATION_KEYWORDS.find(kw => desc.includes(kw));
                  return (
                    <tr key={listing.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-foreground text-xs font-medium">{listing.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{(listing.cities as any)?.name}</td>
                      <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">{listing.short_description}</td>
                      <td className="p-3">
                        <Badge variant="destructive" className="text-[10px]">{matchedKw}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
