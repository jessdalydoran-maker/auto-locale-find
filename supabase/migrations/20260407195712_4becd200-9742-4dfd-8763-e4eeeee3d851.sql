
-- Allow authenticated users to insert, update, and delete listings
CREATE POLICY "Authenticated users can insert listings"
ON public.listings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update listings"
ON public.listings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete listings"
ON public.listings FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users full read access (including archived/unapproved)
CREATE POLICY "Authenticated users can read all listings"
ON public.listings FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage events
CREATE POLICY "Authenticated users can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON public.events FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events"
ON public.events FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read all events"
ON public.events FOR SELECT
TO authenticated
USING (true);
