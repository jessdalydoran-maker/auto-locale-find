/**
 * Vite plugin: build-time prerendering for SEO.
 *
 * During `closeBundle` it fetches cities, categories and listing counts from
 * Supabase, determines which routes are indexable (≥ 6 listings), then writes
 * a static HTML file for each route into `dist/`.  The HTML contains:
 *   • <title>, <meta description>, <link rel="canonical">
 *   • An H1 heading and intro paragraph
 *   • A listing of venue names (so Googlebot sees real content)
 *   • The normal SPA entry point so the React app hydrates on top
 *
 * No framework migration required — works as a plain Vite plugin.
 */

import fs from "fs";
import path from "path";

const SITE_DOMAIN = "https://cityscoutguide.com";
const MIN_LISTINGS = 4;

interface CityRow {
  slug: string;
  name: string;
}

interface CategoryRow {
  slug: string;
  name: string;
}

interface VenueRow {
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  price_level: string | null;
  phone: string | null;
  website: string | null;
  cities: { slug: string; name: string };
  categories: { slug: string; name: string };
}

interface RouteData {
  path: string;
  title: string;
  description: string;
  h1: string;
  cityName: string;
  categoryName?: string;
  listings: { name: string; slug: string }[];
}

/* ── Intro text helpers (mirrors CityCategoryPage) ── */
const CATEGORY_INTROS: Record<string, (c: string) => string> = {
  "things-to-do": (c) =>
    `Discover the best things to do in ${c}. From top attractions to hidden gems, here's our curated guide.`,
  restaurants: (c) =>
    `Looking for great places to eat in ${c}? Browse the best restaurants, rated and reviewed by locals.`,
  pubs: (c) =>
    `Find the best pubs in ${c}. Cosy locals, live music, craft beer and more.`,
  cafes: (c) =>
    `The best cafes and coffee shops in ${c}. Brunch, flat whites, and quiet afternoons.`,
  bars: (c) =>
    `Explore the best bars in ${c}. Cocktail lounges, wine bars, and everything in between.`,
  nightlife: (c) =>
    `Your guide to nightlife in ${c}. Clubs, late bars, DJ nights and more.`,
  "live-music": (c) =>
    `Find live music venues and gigs in ${c}. Intimate sessions to headline shows.`,
  attractions: (c) =>
    `Top attractions and sightseeing spots in ${c}. Plan your visit today.`,
  parks: (c) =>
    `The best parks and green spaces in ${c} for walks, picnics, and outdoor activities.`,
  museums: (c) =>
    `Discover museums, galleries and cultural venues in ${c}.`,
  shopping: (c) =>
    `The best shopping destinations in ${c}. High street, boutiques, and retail parks.`,
  "family-activities": (c) =>
    `Fun things to do with kids in ${c}. Family-friendly activities and days out.`,
  hotels: (c) =>
    `Find the best hotels and places to stay in ${c}.`,
  "b-and-bs": (c) =>
    `Cosy B&Bs and guesthouses in ${c}. Book your perfect stay.`,
  accommodation: (c) =>
    `Places to stay in ${c}. Hotels, B&Bs, and holiday rentals.`,
  brunch: (c) =>
    `The best brunch spots in ${c}. Weekend brunch, all-day breakfast, and more.`,
  gyms: (c) =>
    `Gyms and fitness centres in ${c}. Find the right workout spot.`,
  theatre: (c) =>
    `Theatre and performing arts in ${c}. Shows, plays, and live performances.`,
  markets: (c) =>
    `Markets and food halls in ${c}. Local produce, street food, and weekend markets.`,
};

function introText(catSlug: string, catName: string, cityName: string): string {
  return (
    CATEGORY_INTROS[catSlug]?.(cityName) ??
    `Explore the best ${catName.toLowerCase()} in ${cityName}. Our curated guide features top-rated venues.`
  );
}

/* ── Supabase fetch helpers ── */
async function supaFetch(url: string, key: string, path: string, params: URLSearchParams) {
  const res = await fetch(`${url}/rest/v1/${path}?${params}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase fetch ${path} failed: ${res.status}`);
  return res.json();
}

/* ── Plugin ── */
export default function prerenderSeoPlugin() {
  let outDir = "dist";

  return {
    name: "prerender-seo",
    configResolved(config: any) {
      outDir = config.build?.outDir ?? "dist";
    },
    async closeBundle() {
      const supaUrl = process.env.VITE_SUPABASE_URL;
      const supaKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!supaUrl || !supaKey) {
        console.warn("[prerender-seo] Missing SUPABASE env vars — skipping prerender.");
        return;
      }

      console.log("[prerender-seo] Fetching route data from database...");

      // 1. Fetch cities & categories
      const [citiesRaw, categoriesRaw] = await Promise.all([
        supaFetch(supaUrl, supaKey, "cities", new URLSearchParams({ select: "slug,name" })),
        supaFetch(
          supaUrl,
          supaKey,
          "categories",
          new URLSearchParams({ select: "slug,name", is_active: "eq.true" })
        ),
      ]);
      const cities = citiesRaw as CityRow[];
      const categories = categoriesRaw as CategoryRow[];

      // 2. Fetch approved, non-archived listings — light fields for landing pages
      const listingsLight = (await supaFetch(
        supaUrl,
        supaKey,
        "listings",
        new URLSearchParams({
          select: "name,slug,rating,cities!inner(slug),categories!inner(slug)",
          is_approved: "eq.true",
          is_archived: "eq.false",
          order: "rating.desc.nullslast",
        })
      )) as { name: string; slug: string; rating: number | null; cities: { slug: string }; categories: { slug: string } }[];

      // 2b. Fetch full venue data for detail pages (all fields needed for meta + JSON-LD)
      const venues = (await supaFetch(
        supaUrl,
        supaKey,
        "listings",
        new URLSearchParams({
          select: "slug,name,short_description,description,address,rating,review_count,image_url,latitude,longitude,price_level,phone,website,cities!inner(slug,name),categories!inner(slug,name)",
          is_approved: "eq.true",
          is_archived: "eq.false",
        })
      )) as VenueRow[];

      // 3. Build maps
      const cityMap = new Map(cities.map((c) => [c.slug, c.name]));
      const catMap = new Map(categories.map((c) => [c.slug, c.name]));

      // Group listings by city, and by city+cat
      const cityListings = new Map<string, { name: string; slug: string }[]>();
      const cityCatListings = new Map<string, { name: string; slug: string }[]>();

      for (const l of listingsLight) {
        const cs = l.cities?.slug;
        const cats = l.categories?.slug;
        if (!cs) continue;

        if (!cityListings.has(cs)) cityListings.set(cs, []);
        cityListings.get(cs)!.push({ name: l.name, slug: l.slug });

        if (cats) {
          const key = `${cs}/${cats}`;
          if (!cityCatListings.has(key)) cityCatListings.set(key, []);
          cityCatListings.get(key)!.push({ name: l.name, slug: l.slug });
        }
      }

      // 4. Build routes
      const routes: RouteData[] = [];

      // Homepage
      routes.push({
        path: "/",
        title: "City Scout Guide — Things To Do & Events in Northern Ireland",
        description:
          "Discover the best things to do, events, festivals and activities across Northern Ireland. Your local guide to Belfast, Antrim and beyond.",
        h1: "Discover Things To Do Across Northern Ireland",
        cityName: "Northern Ireland",
        listings: (cityListings.get("belfast") || []).slice(0, 12),
      });

      // NI-wide modifier/category pages
      const niWidePages: { path: string; title: string; description: string; h1: string }[] = [
        {
          path: "/date-night",
          title: "Date Night Ideas in Northern Ireland",
          description: "Romantic restaurants, cocktail bars and date night activities across Northern Ireland.",
          h1: "Date Night Ideas in Northern Ireland",
        },
        {
          path: "/rainy-day-activities",
          title: "Rainy Day Activities in Northern Ireland",
          description: "Indoor activities and things to do on a rainy day across Northern Ireland.",
          h1: "Rainy Day Activities in Northern Ireland",
        },
        {
          path: "/free-things-to-do",
          title: "Free Things To Do in Northern Ireland",
          description: "Free activities, parks, museums and things to do across Northern Ireland.",
          h1: "Free Things To Do in Northern Ireland",
        },
        {
          path: "/nightlife",
          title: "Nightlife in Northern Ireland",
          description: "Clubs, late bars, DJ nights and nightlife across Northern Ireland.",
          h1: "Nightlife in Northern Ireland",
        },
        {
          path: "/things-to-do",
          title: "Things To Do in Northern Ireland",
          description: "Discover the best things to do across Northern Ireland. Activities, attractions and more.",
          h1: "Things To Do in Northern Ireland",
        },
      ];

      // Gather some Belfast listings for NI-wide pages
      const belfastListings = (cityListings.get("belfast") || []).slice(0, 12);
      for (const nip of niWidePages) {
        routes.push({
          ...nip,
          cityName: "Northern Ireland",
          listings: belfastListings,
        });
      }

      // Town pages
      for (const [slug, items] of cityListings) {
        if (items.length < MIN_LISTINGS) continue;
        const name = cityMap.get(slug) || slug;
        routes.push({
          path: `/${slug}`,
          title: `Things To Do in ${name} | City Scout Guide`,
          description: `Discover the best things to do in ${name}. Restaurants, pubs, attractions, family activities and more.`,
          h1: `Things To Do in ${name}`,
          cityName: name,
          listings: items.slice(0, 20),
        });
      }

      // Town + Category pages
      for (const [key, items] of cityCatListings) {
        if (items.length < MIN_LISTINGS) continue;
        const [citySlug, catSlug] = key.split("/");
        const cityName = cityMap.get(citySlug) || citySlug;
        const catName = catMap.get(catSlug) || catSlug;
        routes.push({
          path: `/${citySlug}/${catSlug}`,
          title: `Best ${catName} in ${cityName} | City Scout Guide`,
          description: introText(catSlug, catName, cityName),
          h1: `Best ${catName} in ${cityName}`,
          cityName,
          categoryName: catName,
          listings: items.slice(0, 20),
        });
      }

      // 5. Read the SPA index.html template
      const indexPath = path.resolve(outDir, "index.html");
      if (!fs.existsSync(indexPath)) {
        console.warn("[prerender-seo] dist/index.html not found — skipping.");
        return;
      }
      const template = fs.readFileSync(indexPath, "utf-8");

      // 6. Write one HTML file per route
      let written = 0;
      for (const route of routes) {
        const html = buildHtml(template, route);
        const filePath =
          route.path === "/"
            ? path.resolve(outDir, "index.html")
            : path.resolve(outDir, route.path.slice(1), "index.html");

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, html, "utf-8");
        written++;
      }

      console.log(`[prerender-seo] ✅ Prerendered ${written} landing pages.`);

      // 7. Generate venue detail pages (meta + JSON-LD only, no content shell)
      let venueWritten = 0;
      for (const v of venues) {
        const html = buildVenueHtml(template, v);
        const filePath = path.resolve(outDir, "place", v.slug, "index.html");
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, html, "utf-8");
        venueWritten++;
      }
      console.log(`[prerender-seo] ✅ Injected SEO meta for ${venueWritten} venue pages.`);

      // 8. Write manifest for verification
      const manifest = {
        landingPages: routes.map((r) => ({ path: r.path, title: r.title, listings: r.listings.length })),
        venuePages: venueWritten,
        total: written + venueWritten,
      };
      fs.writeFileSync(
        path.resolve(outDir, "prerender-manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      );
      console.log(`[prerender-seo] Manifest written — ${manifest.total} total pages.`);
    },
  };
}

/* ── HTML builder ── */
function buildHtml(template: string, route: RouteData): string {
  const canonical = route.path === "/" ? SITE_DOMAIN : `${SITE_DOMAIN}${route.path}`;

  // Build listing HTML
  const listingItems = route.listings
    .map(
      (l) =>
        `<li><a href="/place/${l.slug}">${escHtml(l.name)}</a></li>`
    )
    .join("\n        ");

  const seoShell = `
    <div id="seo-shell" style="padding:24px;max-width:960px;margin:0 auto">
      <h1>${escHtml(route.h1)}</h1>
      <p>${escHtml(route.description)}</p>
      ${
        route.listings.length > 0
          ? `<h2>Top Places${route.categoryName ? ` — ${escHtml(route.categoryName)}` : ""} in ${escHtml(route.cityName)}</h2>
      <ul>
        ${listingItems}
      </ul>`
          : ""
      }
    </div>`;

  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(route.title)}</title>`);

  // Replace or inject meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escAttr(route.description)}">`
    );
  } else {
    html = html.replace("</head>", `<meta name="description" content="${escAttr(route.description)}">\n</head>`);
  }

  // Replace canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // Replace og:title, og:description
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escAttr(route.title)}">`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escAttr(route.description)}">`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escAttr(route.title)}">`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escAttr(route.description)}">`
  );

  // Inject SEO shell into <div id="root">
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${seoShell}</div>`
  );

  return html;
}

/* ── Venue detail page HTML builder (meta + JSON-LD only, no content shell) ── */
function buildVenueHtml(template: string, v: VenueRow): string {
  const cityName = v.cities?.name || "";
  const catName = v.categories?.name || "";
  const canonical = `${SITE_DOMAIN}/place/${v.slug}`;
  const title = `${v.name} — ${catName} in ${cityName} | City Scout Guide`;
  const desc =
    v.short_description ||
    (v.description ? v.description.slice(0, 155) : "") ||
    `${v.name} is a top-rated ${catName.toLowerCase()} in ${cityName}. Find reviews, directions, and more.`;

  // Build JSON-LD LocalBusiness schema
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: v.name,
    url: canonical,
  };
  if (desc) jsonLd.description = desc;
  if (v.address) jsonLd.address = { "@type": "PostalAddress", streetAddress: v.address, addressLocality: cityName };
  if (v.latitude && v.longitude) jsonLd.geo = { "@type": "GeoCoordinates", latitude: v.latitude, longitude: v.longitude };
  if (v.image_url) jsonLd.image = v.image_url;
  if (v.phone) jsonLd.telephone = v.phone;
  if (v.website) jsonLd.sameAs = v.website;
  if (v.rating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: v.rating,
      bestRating: 5,
      ...(v.review_count ? { reviewCount: v.review_count } : {}),
    };
  }
  if (v.price_level) {
    const priceMap: Record<string, string> = { "$": "$", "$$": "$$", "$$$": "$$$", "$$$$": "$$$$" };
    if (priceMap[v.price_level]) jsonLd.priceRange = priceMap[v.price_level];
  }

  const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // Meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escAttr(desc)}">`
    );
  } else {
    html = html.replace("</head>", `<meta name="description" content="${escAttr(desc)}">\n</head>`);
  }

  // Canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // OG + Twitter tags
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escAttr(title)}">`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escAttr(desc)}">`);
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escAttr(title)}">`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escAttr(desc)}">`);

  // og:url
  if (html.includes('property="og:url"')) {
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}">`);
  } else {
    html = html.replace("</head>", `<meta property="og:url" content="${canonical}">\n</head>`);
  }

  // og:image / twitter:image — use venue image if available
  if (v.image_url) {
    html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escAttr(v.image_url)}">`);
    html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escAttr(v.image_url)}">`);
  }

  // Inject JSON-LD before closing </head>
  html = html.replace("</head>", `${jsonLdTag}\n</head>`);

  return html;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
