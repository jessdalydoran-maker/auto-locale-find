import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Intent extraction ── */

const INTENT_CATEGORIES: Record<string, string[]> = {
  eat: ['restaurants', 'cafes', 'brunch'],
  food: ['restaurants', 'cafes', 'brunch'],
  restaurant: ['restaurants'],
  restaurants: ['restaurants'],
  dining: ['restaurants'],
  breakfast: ['brunch', 'cafes'],
  brunch: ['brunch', 'cafes'],
  lunch: ['restaurants', 'cafes'],
  dinner: ['restaurants'],
  coffee: ['cafes'],
  cafe: ['cafes'],
  cafes: ['cafes'],
  bar: ['bars', 'cocktail-bars'],
  bars: ['bars', 'cocktail-bars'],
  pub: ['bars', 'pubs'],
  pubs: ['bars', 'pubs'],
  drink: ['bars', 'cocktail-bars'],
  drinks: ['bars', 'cocktail-bars'],
  cocktail: ['cocktail-bars'],
  cocktails: ['cocktail-bars'],
  nightlife: ['bars', 'nightlife', 'cocktail-bars'],
  'night out': ['bars', 'nightlife'],
  family: ['family-activities', 'parks', 'attractions'],
  kids: ['family-activities', 'parks'],
  children: ['family-activities', 'parks'],
  museum: ['museums'],
  museums: ['museums'],
  park: ['parks'],
  parks: ['parks'],
  walk: ['parks', 'tours'],
  walks: ['parks', 'tours'],
  shopping: ['shopping'],
  event: ['events'],
  events: ['events'],
  tonight: ['events', 'bars', 'live-music'],
  music: ['live-music'],
  'live music': ['live-music'],
  gig: ['live-music'],
  gigs: ['live-music'],
  theatre: ['theatre'],
  theater: ['theatre'],
  indoor: ['museums', 'escape-rooms', 'cinemas', 'cafes'],
  rainy: ['museums', 'escape-rooms', 'cinemas', 'cafes'],
  rain: ['museums', 'escape-rooms', 'cinemas', 'cafes'],
  date: ['restaurants', 'cocktail-bars'],
  romantic: ['restaurants', 'cocktail-bars'],
  'date night': ['restaurants', 'cocktail-bars', 'bars'],
  healthy: ['restaurants', 'cafes'],
  free: ['parks', 'museums'],
  cheap: ['cafes', 'parks'],
  afternoon: ['cafes', 'parks', 'museums', 'shopping', 'things-to-do'],
  morning: ['cafes', 'brunch', 'parks'],
  evening: ['restaurants', 'bars', 'cocktail-bars', 'live-music'],
  attraction: ['attractions', 'things-to-do'],
  attractions: ['attractions', 'things-to-do'],
  'things to do': ['things-to-do', 'attractions'],
  activities: ['things-to-do', 'family-activities'],
  explore: ['things-to-do', 'attractions', 'tours'],
}

function extractCategorySlugs(query: string): string[] {
  const lower = query.toLowerCase()
  const slugs = new Set<string>()
  const sortedKeys = Object.keys(INTENT_CATEGORIES).sort((a, b) => b.length - a.length)
  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      INTENT_CATEGORIES[keyword].forEach((s) => slugs.add(s))
    }
  }
  return Array.from(slugs)
}

function detectModifiers(query: string) {
  const lower = query.toLowerCase()
  return {
    family: /\b(family|kids?|children|toddler|baby|babies)\b/.test(lower),
    indoor: /\b(indoor|rainy?|rain|inside|wet)\b/.test(lower),
    free: /\b(free|cheap|budget)\b/.test(lower),
    evening: /\b(tonight|evening|night)\b/.test(lower),
  }
}

/* ── Prompt builder ── */

interface PlaceContext {
  name: string
  slug: string
  type: 'listing' | 'event'
  description: string | null
  category?: string
  categorySlug?: string
  rating?: number | null
  reviewCount?: number | null
  address?: string | null
  priceLevel?: string | null
  familyFriendly?: boolean
  imageUrl?: string | null
  imageStatus?: string
  dateStart?: string
  timeStart?: string | null
  venueName?: string | null
  isFree?: boolean
  isIndoor?: boolean
}

function buildSystemPrompt(cityName: string, places: PlaceContext[]): string {
  const placesText = places
    .map((p, i) => {
      if (p.type === 'listing') {
        return `${i + 1}. [LISTING] "${p.name}" (slug: ${p.slug}) — ${p.category || 'General'}
   ${p.description || 'No description available'}
   Rating: ${p.rating ?? 'N/A'} | Reviews: ${p.reviewCount ?? 0} | Price: ${p.priceLevel || 'N/A'}
   Address: ${p.address || 'N/A'} | Family-friendly: ${p.familyFriendly ? 'Yes' : 'Not specified'}`
      } else {
        return `${i + 1}. [EVENT] "${p.name}" (slug: ${p.slug})
   ${p.description || 'No description available'}
   Date: ${p.dateStart}${p.timeStart ? ' at ' + p.timeStart : ''} | Venue: ${p.venueName || 'N/A'}
   Free: ${p.isFree ? 'Yes' : 'No'} | Indoor: ${p.isIndoor ? 'Yes' : 'Not specified'} | Family: ${p.familyFriendly ? 'Yes' : 'Not specified'}`
      }
    })
    .join('\n\n')

  return `You are ROAM, a premium local concierge for hotel guests staying in ${cityName}. You help guests discover curated local recommendations — restaurants, activities, events, and hidden gems.

Your tone: warm, knowledgeable, concise. Like a trusted concierge at a boutique hotel. Never robotic. Never generic tourist copy. Never say "I'm just an AI" or similar.

Rules:
- ONLY recommend places from the data below. Never invent venues.
- Never fabricate opening hours, booking availability, or accessibility claims.
- If data is incomplete, acknowledge gracefully (e.g. "worth calling ahead to confirm times").
- If you cannot find strong matches, say so honestly and suggest how to refine the search.
- Keep the lead to 1–2 warm, natural sentences.
- Provide 2–4 specific suggestions with clear reasons.
- End with one smart follow-up question the guest might want to ask next.
- If the guest's request is too vague, ask a clarifying question instead of guessing.

Available local places and events:

${placesText}

Respond with ONLY valid JSON in this exact format (no markdown, no code fences, no extra text):
{"lead":"A warm 1-2 sentence lead recommendation","suggestions":[{"name":"Exact name from data","slug":"exact-slug-from-data","type":"listing or event","reason":"Why this fits their request (1 sentence)","context":"Practical detail: price, vibe, indoor/outdoor, family-friendly, distance, etc."}],"followUp":"A relevant follow-up question"}`
}

/* ── Curated fallback (no AI key) ── */

function buildCuratedFallback(places: PlaceContext[]) {
  const suggestions = places.slice(0, 4).map((p) => ({
    name: p.name,
    slug: p.slug,
    type: p.type,
    reason: p.description?.substring(0, 120) || 'A local favourite worth exploring.',
    context: [p.priceLevel, p.familyFriendly ? 'Family-friendly' : null, p.address]
      .filter(Boolean)
      .join(' · '),
    category: p.category,
    categorySlug: p.categorySlug,
    rating: p.rating,
    reviewCount: p.reviewCount,
    address: p.address,
    priceLevel: p.priceLevel,
    familyFriendly: p.familyFriendly,
    imageUrl: p.imageUrl,
    imageStatus: p.imageStatus,
  }))

  return {
    lead: 'Here are some curated local picks that might suit you.',
    suggestions,
    followUp: 'Would you like to narrow this down by cuisine, activity type, or time of day?',
    source: 'curated' as const,
  }
}

/* ── Main handler ── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const query = body?.query
    const citySlug = body?.citySlug || 'belfast'

    if (!query || typeof query !== 'string' || query.trim().length === 0 || query.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Please provide a question (up to 500 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Resolve city
    const { data: city } = await supabase
      .from('cities')
      .select('id, name')
      .eq('slug', citySlug)
      .single()

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'Location not recognised.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Parse intent
    const categorySlugs = extractCategorySlugs(query)
    const modifiers = detectModifiers(query)

    // 3. Resolve category IDs for filtering
    let categoryIds: string[] = []
    if (categorySlugs.length > 0) {
      const { data: cats } = await supabase
        .from('categories')
        .select('id')
        .in('slug', categorySlugs)
        .eq('is_active', true)
      categoryIds = (cats || []).map((c: any) => c.id)
    }

    // 4. Fetch listings
    let listingsQ = supabase
      .from('listings')
      .select(
        'name, slug, short_description, description, rating, review_count, address, price_level, family_friendly, kids_friendly, audience_tags, image_url, image_status, category_id, categories(slug, name)',
      )
      .eq('is_approved', true)
      .eq('is_archived', false)
      .eq('city_id', city.id)
      .order('rating', { ascending: false, nullsFirst: false })

    if (categoryIds.length > 0) {
      listingsQ = listingsQ.in('category_id', categoryIds).limit(15)
    } else {
      listingsQ = listingsQ.limit(20)
    }

    if (modifiers.family) {
      listingsQ = listingsQ.or('family_friendly.eq.true,kids_friendly.eq.true')
    }

    const { data: listings } = await listingsQ

    // 5. Fetch upcoming events
    const today = new Date().toISOString().split('T')[0]
    let eventsQ = supabase
      .from('events')
      .select(
        'title, slug, short_description, date_start, date_end, time_start, venue_name, venue_address, is_free, is_family_friendly, is_indoor, is_outdoor, tags',
      )
      .eq('status', 'active')
      .eq('city_id', city.id)
      .gte('date_start', today)
      .order('date_start', { ascending: true })
      .limit(8)

    if (modifiers.family) {
      eventsQ = eventsQ.eq('is_family_friendly', true)
    }
    if (modifiers.indoor) {
      eventsQ = eventsQ.eq('is_indoor', true)
    }

    const { data: events } = await eventsQ

    // 6. Build unified context
    const places: PlaceContext[] = [
      ...(listings || []).map((l: any) => ({
        name: l.name,
        slug: l.slug,
        type: 'listing' as const,
        description: l.short_description || l.description,
        category: l.categories?.name,
        categorySlug: l.categories?.slug,
        rating: l.rating,
        reviewCount: l.review_count,
        address: l.address,
        priceLevel: l.price_level,
        familyFriendly: l.family_friendly || l.kids_friendly,
        imageUrl: l.image_url,
        imageStatus: l.image_status,
      })),
      ...(events || []).map((e: any) => ({
        name: e.title,
        slug: e.slug,
        type: 'event' as const,
        description: e.short_description,
        dateStart: e.date_start,
        timeStart: e.time_start,
        venueName: e.venue_name,
        isFree: e.is_free,
        familyFriendly: e.is_family_friendly,
        isIndoor: e.is_indoor,
      })),
    ]

    if (places.length === 0) {
      return new Response(
        JSON.stringify({
          lead: "I don't have specific recommendations for that right now. The front desk would be happy to help with more tailored suggestions.",
          suggestions: [],
          followUp: 'Would you like to try a broader search, or browse our curated local guides?',
          source: 'curated',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 7. Claude API call (or curated fallback)
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      console.log('ROAM: No ANTHROPIC_API_KEY configured — returning curated fallback')
      return new Response(JSON.stringify(buildCuratedFallback(places)), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = buildSystemPrompt(city.name, places)
    console.log(`ROAM query: "${query}" | City: ${city.name} | Places found: ${places.length}`)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    })

    if (!claudeRes.ok) {
      console.error('Claude API error:', claudeRes.status, await claudeRes.text())
      return new Response(JSON.stringify(buildCuratedFallback(places)), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const claudeData = await claudeRes.json()
    const responseText = claudeData.content?.[0]?.text

    if (!responseText) {
      return new Response(JSON.stringify(buildCuratedFallback(places)), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 8. Parse + enrich
    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      const enriched = (parsed.suggestions || []).map((s: any) => {
        const match = places.find((p) => p.slug === s.slug || p.name === s.name)
        return {
          ...s,
          category: match?.category || s.category,
          categorySlug: match?.categorySlug || s.categorySlug,
          rating: match?.rating,
          reviewCount: match?.reviewCount,
          address: match?.address,
          priceLevel: match?.priceLevel,
          familyFriendly: match?.familyFriendly,
          imageUrl: match?.imageUrl,
          imageStatus: match?.imageStatus,
        }
      })

      return new Response(
        JSON.stringify({
          lead: parsed.lead || 'Here are some recommendations for you.',
          suggestions: enriched,
          followUp: parsed.followUp || 'Would you like more specific suggestions?',
          source: 'ai',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', parseErr, responseText)
      return new Response(JSON.stringify(buildCuratedFallback(places)), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    console.error('ROAM concierge error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again in a moment.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
