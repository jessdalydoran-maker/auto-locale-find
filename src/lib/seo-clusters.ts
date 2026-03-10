/**
 * SEO cluster definitions for Belfast-first information architecture.
 * Each cluster groups related pages for strong internal linking.
 */

export interface ClusterPage {
  url: string;
  label: string;
  description: string;
}

export interface Cluster {
  id: string;
  name: string;
  pages: ClusterPage[];
}

/**
 * Get all clusters for a given city.
 */
export function getCityClusters(citySlug: string, cityName: string): Cluster[] {
  return [
    {
      id: "whats-on",
      name: `What's On ${cityName}`,
      pages: [
        { url: `/whats-on-${citySlug}`, label: `What's On ${cityName}`, description: `Everything happening in ${cityName} right now` },
        { url: `/events-${citySlug}`, label: `Events ${cityName}`, description: `All upcoming events in ${cityName}` },
        { url: `/whats-on-${citySlug}-today`, label: `Today`, description: `What's on in ${cityName} today` },
        { url: `/whats-on-${citySlug}-this-week`, label: `This Week`, description: `What's on in ${cityName} this week` },
        { url: `/whats-on-${citySlug}-this-weekend`, label: `This Weekend`, description: `What's on in ${cityName} this weekend` },
        { url: `/free-events-${citySlug}`, label: `Free Events`, description: `Free events happening in ${cityName}` },
        { url: `/family-events-${citySlug}`, label: `Family Events`, description: `Family-friendly events in ${cityName}` },
        { url: `/live-music-${citySlug}`, label: `Live Music`, description: `Live music and gigs in ${cityName}` },
      ],
    },
    {
      id: "things-to-do",
      name: `Things To Do ${cityName}`,
      pages: [
        { url: `/things-to-do-${citySlug}`, label: `Things To Do`, description: `Best things to do in ${cityName}` },
        { url: `/free-things-to-do-${citySlug}`, label: `Free Things To Do`, description: `Free activities and attractions in ${cityName}` },
        { url: `/family-activities-${citySlug}`, label: `Family Activities`, description: `Family-friendly activities in ${cityName}` },
        { url: `/date-night-${citySlug}`, label: `Date Night`, description: `Date night ideas in ${cityName}` },
        { url: `/indoor-activities-${citySlug}`, label: `Indoor Activities`, description: `Indoor activities for rainy days in ${cityName}` },
        { url: `/things-to-do-${citySlug}-this-weekend`, label: `This Weekend`, description: `Things to do in ${cityName} this weekend` },
        { url: `/things-to-do-${citySlug}-today`, label: `Today`, description: `Things to do in ${cityName} today` },
      ],
    },
    {
      id: "food-drink",
      name: `Food & Drink ${cityName}`,
      pages: [
        { url: `/best-restaurants-${citySlug}`, label: `Best Restaurants`, description: `Top-rated restaurants in ${cityName}` },
        { url: `/best-brunch-${citySlug}`, label: `Best Brunch`, description: `Best brunch spots in ${cityName}` },
        { url: `/best-cafes-${citySlug}`, label: `Best Cafes`, description: `Best cafes and coffee shops in ${cityName}` },
        { url: `/bars-${citySlug}`, label: `Bars`, description: `Best bars in ${cityName}` },
        { url: `/cocktail-bars-${citySlug}`, label: `Cocktail Bars`, description: `Best cocktail bars in ${cityName}` },
        { url: `/cheap-restaurants-${citySlug}`, label: `Cheap Eats`, description: `Budget-friendly restaurants in ${cityName}` },
        { url: `/romantic-restaurants-${citySlug}`, label: `Romantic Restaurants`, description: `Romantic dining in ${cityName}` },
        { url: `/vegan-restaurants-${citySlug}`, label: `Vegan`, description: `Vegan-friendly restaurants in ${cityName}` },
      ],
    },
  ];
}

/**
 * Get landmark cluster for a city.
 */
export function getLandmarkCluster(
  citySlug: string,
  cityName: string,
  landmarks: { name: string; slug: string }[]
): Cluster {
  const pages: ClusterPage[] = [];
  for (const lm of landmarks) {
    pages.push(
      { url: `/things-to-do-near-${lm.slug}-${citySlug}`, label: `Near ${lm.name}`, description: `Things to do near ${lm.name}` },
      { url: `/restaurants-near-${lm.slug}-${citySlug}`, label: `Eat Near ${lm.name}`, description: `Restaurants near ${lm.name}` },
      { url: `/bars-near-${lm.slug}-${citySlug}`, label: `Drink Near ${lm.name}`, description: `Bars near ${lm.name}` },
    );
  }
  return {
    id: "landmarks",
    name: `Near ${cityName} Landmarks`,
    pages,
  };
}

/**
 * Get neighbourhood cluster for a city.
 */
export function getNeighbourhoodCluster(
  citySlug: string,
  cityName: string,
  neighbourhoods: { name: string; slug: string }[]
): Cluster {
  const pages: ClusterPage[] = [];
  for (const nb of neighbourhoods) {
    pages.push(
      { url: `/things-to-do-${nb.slug}-${citySlug}`, label: `Things To Do ${nb.name}`, description: `Best things to do in ${nb.name}, ${cityName}` },
      { url: `/restaurants-${nb.slug}-${citySlug}`, label: `Restaurants ${nb.name}`, description: `Best restaurants in ${nb.name}, ${cityName}` },
    );
  }
  return {
    id: "neighbourhoods",
    name: `${cityName} Neighbourhoods`,
    pages,
  };
}

/**
 * Find which cluster a given page URL belongs to.
 */
export function findPageCluster(url: string, clusters: Cluster[]): Cluster | null {
  for (const cluster of clusters) {
    if (cluster.pages.some((p) => p.url === url)) {
      return cluster;
    }
  }
  return null;
}

/**
 * Get sibling pages in the same cluster (excluding the current page).
 */
export function getSiblingPages(url: string, clusters: Cluster[]): ClusterPage[] {
  const cluster = findPageCluster(url, clusters);
  if (!cluster) return [];
  return cluster.pages.filter((p) => p.url !== url);
}

/**
 * Get cross-cluster related pages (one from each other cluster).
 */
export function getCrossClusterLinks(url: string, clusters: Cluster[]): ClusterPage[] {
  const currentCluster = findPageCluster(url, clusters);
  return clusters
    .filter((c) => c.id !== currentCluster?.id)
    .map((c) => c.pages[0])
    .filter(Boolean);
}
