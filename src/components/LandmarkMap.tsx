import { MapPin } from "lucide-react";

interface LandmarkMapProps {
  landmarkName: string;
  landmarkLat: number;
  landmarkLng: number;
  listings: Array<{
    name: string;
    latitude: number | null;
    longitude: number | null;
    slug: string;
  }>;
  radiusKm: number;
}

/**
 * Simple landmark map using OpenStreetMap static tiles.
 * Shows the landmark pin and nearby listing pins.
 */
export const LandmarkMap = ({
  landmarkName,
  landmarkLat,
  landmarkLng,
  listings,
  radiusKm,
}: LandmarkMapProps) => {
  // Build markers for OpenStreetMap embed
  const validListings = listings.filter((l) => l.latitude && l.longitude);
  const zoom = radiusKm <= 0.8 ? 16 : radiusKm <= 1.2 ? 15 : 14;

  // Use OpenStreetMap embed with marker
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${landmarkLng - 0.015},${landmarkLat - 0.01},${landmarkLng + 0.015},${landmarkLat + 0.01}&layer=mapnik&marker=${landmarkLat},${landmarkLng}`;

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      <div className="relative aspect-[16/9] sm:aspect-[2/1]">
        <iframe
          src={osmUrl}
          className="w-full h-full border-0"
          loading="lazy"
          title={`Map showing ${landmarkName} and nearby venues`}
          aria-label={`Map of ${landmarkName} area`}
        />
      </div>
      <div className="p-3.5 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-teal shrink-0" />
        <div>
          <p className="text-sm font-display font-semibold text-foreground">{landmarkName}</p>
          <p className="text-xs text-muted-foreground">
            {validListings.length} places within {radiusKm} km
          </p>
        </div>
      </div>
    </div>
  );
};
