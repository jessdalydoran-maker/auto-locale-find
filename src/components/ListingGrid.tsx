import { ListingCard, type ListingCardProps } from "@/components/ListingCard";
import { CompactListingRow } from "@/components/CompactListingRow";
import { useMemo } from "react";

interface ListingGridProps {
  listings: any[];
  citySlug: string;
  /** Whether to split into image / no-image sections */
  splitByImage?: boolean;
}

/**
 * Renders listings in the redesigned grid layout:
 * - Cards with images in 3/2/1 responsive grid
 * - "More places" compact list for no-image listings
 */
export const ListingGrid = ({ listings, citySlug, splitByImage = true }: ListingGridProps) => {
  const { withImage, withoutImage } = useMemo(() => {
    if (!splitByImage) return { withImage: listings, withoutImage: [] };

    const wi: any[] = [];
    const wo: any[] = [];
    for (const l of listings) {
      if (l.image_url && (l.image_status === "verified" || l.image_source === "manual" || l.image_source === "google_places")) {
        wi.push(l);
      } else {
        wo.push(l);
      }
    }
    return { withImage: wi, withoutImage: wo };
  }, [listings, splitByImage]);

  return (
    <>
      {/* Main image-first grid */}
      {withImage.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {withImage.map((listing: any, i: number) => (
            <ListingCard
              key={listing.id}
              name={listing.name}
              slug={listing.slug}
              citySlug={(listing.cities as any)?.slug || citySlug}
              shortDescription={listing.short_description || ""}
              rating={listing.rating}
              reviewCount={listing.review_count || 0}
              imageUrl={listing.image_url}
              imageSource={listing.image_source}
              imageAlt={listing.image_alt}
              imageStatus={listing.image_status}
              categorySlug={(listing.categories as any)?.slug}
              categoryName={(listing.categories as any)?.name}
              cityName={(listing.cities as any)?.name}
              address={listing.address}
              priceLevel={listing.price_level}
              googleMapsLink={listing.google_maps_link}
              isFeatured={listing.is_featured}
              audienceTags={listing.audience_tags}
              description={listing.description}
              index={i}
            />
          ))}
        </div>
      )}

      {/* "More places" compact list */}
      {withoutImage.length > 0 && (
        <section className="mt-10">
          <h3 className="font-display font-semibold text-foreground text-base mb-3">
            More Places
          </h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border/50 card-shadow">
            {withoutImage.map((listing: any) => (
              <CompactListingRow
                key={listing.id}
                name={listing.name}
                slug={listing.slug}
                shortDescription={listing.short_description || ""}
                rating={listing.rating}
                reviewCount={listing.review_count || 0}
                address={listing.address}
                categoryName={(listing.categories as any)?.name}
                cityName={(listing.cities as any)?.name}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
