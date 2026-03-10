
-- Add unique constraint on search_trends.query for upsert
ALTER TABLE public.search_trends ADD CONSTRAINT search_trends_query_key UNIQUE (query);
