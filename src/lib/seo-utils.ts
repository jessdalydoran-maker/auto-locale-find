/**
 * Programmatic SEO slug parsing and content generation.
 *
 * Supported URL patterns:
 *   /best-restaurants-belfast                         → modifier + category + city
 *   /cheap-cafes-cathedral-quarter-belfast             → modifier + category + neighbourhood + city
 *   /restaurants-belfast                               → category + city
 *   /things-to-do-belfast-this-weekend                 → category + city + timeIntent
 *   /free-events-belfast-this-weekend                  → modifier + category + city + timeIntent
 *   /whats-on-belfast                                  → alias → events + city
 *   /restaurants-near-titanic-belfast                  → category + near landmark + city
 *   /indoor-activities-belfast                         → category + city
 *   /things-to-do-belfast-rainy-day                    → category + city + special modifier
 */

export interface ParsedSlug {
  modifierSlug: string | null;
  categorySlug: string;
  neighbourhoodSlug: string | null;
  citySlug: string;
  timeIntent: string | null;
  nearLandmark: string | null;
}

const KNOWN_MODIFIERS = [
  "best",
  "cheap",
  "romantic",
  "family",
  "late-night",
  "vegan",
  "dog-friendly",
  "outdoor",
  "free",
  "indoor",
  "date-night",
  "rainy-day",
  "top",
];

const KNOWN_TIME_INTENTS = [
  "this-weekend",
  "this-week",
  "tonight",
  "today",
  "rainy-day",
];

const CATEGORY_ALIASES: Record<string, string> = {
  "whats-on": "events",
  "what-to-do": "things-to-do",
  "activities": "things-to-do",
  "family-day-out": "things-to-do",
  "day-out": "things-to-do",
  "rainy-day-activities": "things-to-do",
  "cheap-things-to-do": "things-to-do",
};

/**
 * Parse a programmatic SEO slug into its components.
 */
export function parseSlug(
  slug: string,
  knownCities: string[],
  knownNeighbourhoods: { slug: string; citySlug: string }[]
): ParsedSlug | null {
  if (!slug) return null;

  let remaining = slug;

  // 1. Extract time intent from end
  let timeIntent: string | null = null;
  for (const ti of KNOWN_TIME_INTENTS) {
    if (remaining.endsWith("-" + ti)) {
      timeIntent = ti;
      remaining = remaining.slice(0, -(ti.length + 1));
      break;
    }
  }

  // 2. Extract modifier from start
  let modifierSlug: string | null = null;
  const sortedMods = [...KNOWN_MODIFIERS].sort((a, b) => b.length - a.length);
  for (const mod of sortedMods) {
    if (remaining.startsWith(mod + "-")) {
      modifierSlug = mod;
      remaining = remaining.slice(mod.length + 1);
      break;
    }
  }

  // 3. Try to match city at the end
  let citySlug: string | null = null;
  const sortedCities = [...knownCities].sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    if (remaining.endsWith("-" + city) || remaining === city) {
      citySlug = city;
      remaining =
        remaining === city ? "" : remaining.slice(0, -(city.length + 1));
      break;
    }
  }

  if (!citySlug) return null;

  // 4. Check for "near-[landmark]" pattern
  let nearLandmark: string | null = null;
  const nearMatch = remaining.match(/^(.+?)-near-(.+)$/);
  if (nearMatch) {
    nearLandmark = nearMatch[2];
    remaining = nearMatch[1];
  } else if (remaining.startsWith("near-")) {
    nearLandmark = remaining.slice(5);
    remaining = "things-to-do";
  }

  // 5. Try to match neighbourhood
  let neighbourhoodSlug: string | null = null;
  if (!nearLandmark) {
    const cityNeighbourhoods = knownNeighbourhoods
      .filter((n) => n.citySlug === citySlug)
      .sort((a, b) => b.slug.length - a.slug.length);

    for (const nb of cityNeighbourhoods) {
      if (remaining.endsWith("-" + nb.slug)) {
        neighbourhoodSlug = nb.slug;
        remaining = remaining.slice(0, -(nb.slug.length + 1));
        break;
      } else if (remaining === nb.slug) {
        neighbourhoodSlug = nb.slug;
        remaining = "";
        break;
      }
    }
  }

  // 6. Whatever remains is the category slug
  let categorySlug = remaining || "things-to-do";

  // Apply aliases
  if (CATEGORY_ALIASES[categorySlug]) {
    categorySlug = CATEGORY_ALIASES[categorySlug];
  }

  if (!categorySlug) return null;

  return { modifierSlug, categorySlug, neighbourhoodSlug, citySlug, timeIntent, nearLandmark };
}

/**
 * Cluster-aware title generation with unique templates per intent cluster.
 */
export function generateTitle(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string,
  timeIntent?: string | null,
  nearLandmark?: string | null
): string {
  const location = cityName ? `${locationName}, ${cityName}` : locationName;
  const timeLabel = formatTimeIntent(timeIntent);

  // Near-landmark pattern
  if (nearLandmark) {
    const landmarkLabel = nearLandmark.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (categoryName.toLowerCase() === "things to do") {
      return `Things To Do Near ${landmarkLabel} | Activities & Attractions Nearby`;
    }
    return `${categoryName} Near ${landmarkLabel} | Best Places Nearby`;
  }

  // Event / What's On cluster
  if (categoryName.toLowerCase() === "events") {
    if (timeLabel) return `What's On in ${location} ${timeLabel} | Events, Activities & More`;
    return `What's On in ${location} | Events, Food & Things To Do`;
  }

  // Things to do cluster
  if (categoryName.toLowerCase() === "things to do") {
    if (modifier === "free" || modifier === "cheap") return `Cheap & Free Things To Do in ${location}${timeLabel ? ` ${timeLabel}` : ""} | Budget-Friendly Activities`;
    if (modifier === "family") return `Family Day Out in ${location}${timeLabel ? ` ${timeLabel}` : ""} | Kids & Family Fun`;
    if (modifier === "date-night" || modifier === "romantic") return `Date Night Ideas in ${location} | Romantic Restaurants & Activities`;
    if (modifier === "rainy-day" || modifier === "indoor" || timeIntent === "rainy-day") return `Rainy Day Ideas in ${location} | Indoor Activities & Things To Do`;
    if (timeLabel) return `Things To Do in ${location} ${timeLabel} | Activities & Events`;
    return `Things To Do in ${location} | Best Activities & Attractions`;
  }

  // Food & Drink cluster
  if (["restaurants", "brunch", "cafes", "bars", "cocktail bars"].includes(categoryName.toLowerCase())) {
    if (modifier === "best") return `Best ${categoryName} in ${location} | Top-Rated ${categoryName}`;
    if (modifier === "cheap") return `Cheap ${categoryName} in ${location} | Budget-Friendly Dining`;
    if (modifier === "romantic") return `Romantic ${categoryName} in ${location} | Date Night Dining`;
    if (modifier === "vegan") return `Vegan ${categoryName} in ${location} | Plant-Based Dining`;
    if (modifier) {
      const cap = modifier.charAt(0).toUpperCase() + modifier.slice(1);
      return `${cap} ${categoryName} in ${location} | Top ${categoryName}`;
    }
    return `${categoryName} in ${location} | Find the Best ${categoryName}`;
  }

  // Generic fallback
  const timeSuffix = timeLabel ? ` ${timeLabel}` : "";
  if (modifier) {
    const cap = modifier.charAt(0).toUpperCase() + modifier.slice(1);
    return `${cap} ${categoryName} in ${location}${timeSuffix} | Top ${categoryName} Spots`;
  }
  return `${categoryName} in ${location}${timeSuffix} | Find the Best ${categoryName}`;
}

/**
 * Cluster-aware meta description generation.
 */
export function generateMetaDescription(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  cityName?: string,
  timeIntent?: string | null,
  nearLandmark?: string | null
): string {
  const location = cityName ? `${locationName}, ${cityName}` : locationName;
  const catLower = categoryName.toLowerCase();
  const timeLabel = formatTimeIntent(timeIntent);
  const timePart = timeLabel ? ` ${timeLabel.toLowerCase()}` : "";

  // Near-landmark
  if (nearLandmark) {
    const landmarkLabel = nearLandmark.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `Discover the best ${catLower} near ${landmarkLabel} including cafes, bars and places to visit within walking distance.`;
  }

  // Event cluster
  if (catLower === "events") {
    if (modifier === "free") return `Discover free events in ${location}${timePart}. Find free gigs, exhibitions, markets, family events and more.`;
    if (modifier === "family") return `Family-friendly events in ${location}${timePart}. Fun activities for kids and families including shows, workshops and outdoor events.`;
    if (timeLabel) return `Discover what's on in ${location} ${timeLabel.toLowerCase()}, including events, family activities, live music, food, free things to do and more.`;
    return `What's on in ${location}? Browse upcoming events, live music, theatre, exhibitions, food events and things to do.`;
  }

  // Things to do cluster
  if (catLower === "things to do") {
    if (modifier === "free" || modifier === "cheap") return `Cheap and free things to do in ${location}${timePart}. Discover parks, museums, walks, free events and budget-friendly activities.`;
    if (modifier === "family") return `Family day out in ${location}${timePart}. Top-rated family attractions, kids activities, soft play, parks and family-friendly fun.`;
    if (modifier === "date-night" || modifier === "romantic") return `Discover the best date night ideas in ${location} including romantic restaurants, cocktail bars and fun evening activities.`;
    if (modifier === "rainy-day" || modifier === "indoor" || timeIntent === "rainy-day") return `Rainy day ideas in ${location}. Museums, indoor activities, cafes, cinemas, escape rooms and more things to do indoors.`;
    if (timeLabel) return `Things to do in ${location} ${timeLabel.toLowerCase()}. Discover events, activities, restaurants and free things to do near you.`;
    return `Discover the best things to do in ${location}. Events, activities, restaurants, attractions and hidden gems — all in one place.`;
  }

  // Food cluster
  if (["restaurants", "brunch", "cafes", "bars", "cocktail bars"].includes(catLower)) {
    if (modifier === "best") return `Best ${catLower} in ${location}. Hand-picked top-rated ${catLower} with ratings, reviews, photos and directions.`;
    if (modifier === "cheap") return `Cheap ${catLower} in ${location}. Budget-friendly dining spots that don't compromise on quality or taste.`;
    if (modifier === "vegan") return `Vegan-friendly ${catLower} in ${location}. Plant-based dining options with reviews and ratings.`;
    return `Find the best ${catLower} in ${location}. Browse ratings, reviews and directions for top ${catLower} near you.`;
  }

  // Generic fallback
  if (modifier) {
    return `Discover the ${modifier} ${catLower} in ${location}${timePart}. Our curated guide to top-rated ${catLower} with ratings, reviews and maps.`;
  }
  return `Find the best ${catLower} in ${location}${timePart}. Browse ratings, reviews and directions for top ${catLower} near you.`;
}

/**
 * Cluster-aware intro text generation — unique per page combination.
 */
export function generateIntroText(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  listingCount: number,
  cityName?: string,
  timeIntent?: string | null
): string {
  const location = cityName ? `${locationName}, ${cityName}` : locationName;
  const catLower = categoryName.toLowerCase();
  const count = listingCount > 0 ? listingCount.toString() : "the best";

  // Event cluster
  if (catLower === "events") {
    if (modifier === "free") return `Looking for free things to do in ${location}? We've found ${count} free events happening right now — from exhibitions and markets to live music and outdoor activities. No ticket needed.`;
    if (modifier === "family") return `Planning a family day out in ${location}? Browse ${count} family-friendly events including workshops, shows, outdoor adventures and activities the whole family will enjoy.`;
    if (timeIntent === "today") return `Here's what's happening in ${location} today. We've gathered ${count} events taking place right now — from live music and food events to exhibitions and community gatherings.`;
    if (timeIntent === "this-weekend") return `Planning your weekend in ${location}? Here are ${count} events happening this Saturday and Sunday, including gigs, markets, family activities and more.`;
    if (timeIntent === "this-week") return `What's on in ${location} this week? Browse ${count} events happening over the coming days, from live performances to food events and exhibitions.`;
    return `Looking for events in ${location}? We've curated ${count} upcoming events including live music, theatre, exhibitions, markets and more. Updated regularly so you never miss out.`;
  }

  // Things to do cluster
  if (catLower === "things to do") {
    if (modifier === "free") return `${location} is full of free things to do — you just need to know where to look. We've found ${count} free activities, from scenic walks and parks to museums and galleries with free admission.`;
    if (modifier === "family") return `Every listing on this page has been curated specifically for families and children visiting ${location}. Whether it's school holidays or a rainy Saturday, here are ${count} family-friendly activities — from soft play centres and parks to museums, markets and kid-friendly restaurants.`;
    if (modifier === "date-night" || modifier === "romantic") return `Planning a date in ${location}? Whether you're after cocktails, a candlelit dinner, or something more adventurous, we've picked ${count} of the best date night ideas to impress.`;
    if (modifier === "indoor" || timeIntent === "rainy-day") return `Raining again? Don't let the weather ruin your plans. Here are ${count} indoor activities in ${location} — from escape rooms and bowling to museums, cinemas and indoor climbing.`;
    if (timeIntent === "this-weekend") return `Not sure what to do this weekend in ${location}? Here are ${count} activities and events happening this Saturday and Sunday.`;
    if (timeIntent === "today") return `Looking for something to do in ${location} today? Here are ${count} activities happening right now.`;
    return `Whether you're a local or just visiting, ${location} has no shortage of things to do. We've picked ${count} of the best activities, attractions and hidden gems to help you make the most of your time.`;
  }

  // Food cluster
  if (["restaurants", "brunch", "cafes", "bars", "cocktail bars"].includes(catLower)) {
    if (modifier === "best") return `We've done the hard work of finding the best ${catLower} in ${location}. These ${count} spots have been hand-picked based on real reviews, quality of food, atmosphere and value for money.`;
    if (modifier === "cheap") return `Great food doesn't have to break the bank. Here are ${count} budget-friendly ${catLower} in ${location} where you can eat well without spending a fortune.`;
    if (modifier === "romantic") return `Looking for somewhere special for a romantic meal? These ${count} ${catLower} in ${location} are perfect for date night, anniversaries and celebrations.`;
    if (modifier === "vegan") return `Whether you're fully plant-based or just fancy something different, ${location} has a growing vegan scene. Here are ${count} ${catLower} with excellent vegan options.`;
    return `Hungry? Here are ${count} of the top ${catLower} in ${location}, hand-picked and rated by locals. From hidden gems to well-known favourites, you'll find something to suit every taste and budget.`;
  }

  // Generic
  const intros = [
    `Looking for ${modifier ? modifier + " " : ""}${catLower} in ${location}? We've hand-picked ${count} places based on real reviews and ratings to help you find exactly what you're after.`,
    `Whether you're a local or just visiting, ${location} has no shortage of fantastic ${catLower}. Here are our top picks${modifier ? ` for ${modifier} options` : ""}.`,
    `${location} is home to some incredible ${catLower}. We've done the research so you don't have to — browse our curated selection below.`,
  ];
  const hash = (modifier || "").length + categoryName.length + locationName.length;
  return intros[hash % intros.length];
}

/**
 * Build a programmatic page URL from components.
 */
export function buildPageUrl(
  modifierSlug: string | null,
  categorySlug: string,
  neighbourhoodSlug: string | null,
  citySlug: string,
  timeIntent?: string | null
): string {
  const parts = [modifierSlug, categorySlug, neighbourhoodSlug, citySlug].filter(Boolean);
  let url = "/" + parts.join("-");
  if (timeIntent) url += "-" + timeIntent;
  return url;
}

/**
 * Format time intent for display.
 */
export function formatTimeIntent(timeIntent?: string | null): string {
  if (!timeIntent) return "";
  const map: Record<string, string> = {
    "today": "Today",
    "tonight": "Tonight",
    "this-week": "This Week",
    "this-weekend": "This Weekend",
    "rainy-day": "Rainy Day",
  };
  return map[timeIntent] || "";
}

/**
 * Get date range for a time intent.
 */
export function getTimeIntentDateRange(timeIntent: string | null): { start: string; end: string } | null {
  if (!timeIntent) return null;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (timeIntent) {
    case "today":
    case "tonight":
      return { start: today, end: today };
    case "this-week": {
      const endOfWeek = new Date(now);
      const daysUntilSunday = 7 - now.getDay();
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      return { start: today, end: endOfWeek.toISOString().split("T")[0] };
    }
    case "this-weekend": {
      // Friday evening → Sunday evening
      const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
      const friday = new Date(now);
      const daysUntilFri = (5 - dayOfWeek + 7) % 7;
      // If it's already Fri/Sat/Sun, use this weekend
      if (dayOfWeek === 5) {
        friday.setDate(now.getDate());
      } else if (dayOfWeek === 6) {
        friday.setDate(now.getDate() - 1);
      } else if (dayOfWeek === 0) {
        friday.setDate(now.getDate() - 2);
      } else {
        friday.setDate(now.getDate() + daysUntilFri);
      }
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      return { start: friday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
    }
    case "rainy-day":
      return null; // Not time-based
    default:
      return null;
  }
}

/**
 * Check if a category slug is event-related.
 */
export function isEventCategory(categorySlug: string): boolean {
  return ["events", "live-music", "theatre", "exhibitions", "comedy", "markets", "festivals"].includes(categorySlug);
}

/**
 * Generate FAQ items specific to the page cluster.
 */
export function generateFaqItems(
  modifier: string | null,
  categoryName: string,
  locationName: string,
  itemCount: number,
  cityName?: string,
  timeIntent?: string | null
): { q: string; a: string }[] {
  const location = cityName ? `${locationName}, ${cityName}` : locationName;
  const catLower = categoryName.toLowerCase();
  const modLabel = modifier || "";

  // Event FAQs
  if (catLower === "events") {
    return [
      { q: `What's on in ${location}${timeIntent ? " " + formatTimeIntent(timeIntent).toLowerCase() : ""}?`, a: `There are currently ${itemCount} events listed in ${location}. Browse our curated selection above to find live music, theatre, exhibitions, food events and more.` },
      { q: `Are there free events in ${location}?`, a: `Yes! ${location} regularly hosts free events including exhibitions, markets, live music and community events. Filter by 'Free' to see what's available.` },
      { q: `How do I find family events in ${location}?`, a: `We tag family-friendly events so you can easily filter for activities suitable for children. Look for the 'Family' badge on event listings.` },
      { q: `How often is the events listing updated?`, a: `Our ${location} events listing is updated regularly to ensure you always have access to the latest happenings. Check back often or subscribe to our newsletter.` },
    ];
  }

  // Things to do FAQs
  if (catLower === "things to do") {
    const faqs = [
      { q: `What are the best things to do in ${location}?`, a: `We've curated ${itemCount} of the best activities in ${location}, from popular attractions to hidden gems. Browse our list above, sorted by rating and reviews.` },
    ];
    if (modifier === "free") {
      faqs.push({ q: `What free activities are there in ${location}?`, a: `${location} offers plenty of free activities including parks, museums with free admission, street art walks, scenic viewpoints and community events.` });
    }
    if (modifier === "family") {
      faqs.push({ q: `What are the best family days out in ${location}?`, a: `Top family activities in ${location} include soft play centres, parks, museums, indoor play areas, nature trails and seasonal events. Many are suitable for all ages.` });
    }
    if (modifier === "indoor" || timeIntent === "rainy-day") {
      faqs.push({ q: `What can I do on a rainy day in ${location}?`, a: `Don't let the rain stop you! ${location} has plenty of indoor activities including escape rooms, bowling, cinemas, museums, indoor climbing, and cosy cafes.` });
    }
    faqs.push({ q: `Is ${location} worth visiting?`, a: `Absolutely! ${location} has a vibrant culture, excellent food scene, beautiful architecture and friendly locals. There's something for everyone, whether you're here for a day or a week.` });
    return faqs;
  }

  // Food FAQs
  if (["restaurants", "brunch", "cafes", "bars", "cocktail bars"].includes(catLower)) {
    return [
      { q: `What are the best ${modLabel} ${catLower} in ${location}?`, a: `We've curated the top ${itemCount} ${modLabel} ${catLower} in ${location} based on reviews, ratings and local recommendations. Browse our full list above.` },
      { q: `Do I need to book ${catLower} in ${location}?`, a: `Popular ${catLower} in ${location} can get busy, especially at weekends. We recommend booking ahead for dinner and weekend brunch at the most popular spots.` },
      { q: `What is the average price for ${catLower} in ${location}?`, a: `${location} has ${catLower} to suit every budget. You'll find options ranging from budget-friendly spots under £15 per head to premium dining experiences.` },
    ];
  }

  // Generic FAQs
  return [
    { q: `What are the best ${modLabel} ${catLower} in ${location}?`, a: `We've curated the top ${itemCount} ${modLabel} ${catLower} in ${location} based on reviews, ratings and local recommendations.` },
    { q: `How many ${catLower} are there in ${location}?`, a: `We currently feature ${itemCount} ${modLabel} ${catLower} in ${location}. We're always adding new places.` },
  ];
}
