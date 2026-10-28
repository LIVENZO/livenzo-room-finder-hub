CREATE OR REPLACE FUNCTION public.get_search_suggestion_catalog()
RETURNS TABLE(name text, kind text, listing_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
WITH names AS (
 SELECT trim(regexp_replace(part, '\s+', ' ', 'g')) AS name, 'location'::text AS kind
 FROM public.rooms r CROSS JOIN LATERAL regexp_split_to_table(r.location, ',') part
 WHERE r.available = true AND length(trim(part)) BETWEEN 3 AND 65
 AND part !~* '(near|\m1 bhk\M|india|rajasthan|[0-9]{5,}|\(|\))'
 UNION ALL
 SELECT trim(regexp_replace(r.house_name, '\s+', ' ', 'g')), 'building'::text
 FROM public.rooms r WHERE r.available = true AND length(trim(r.house_name)) BETWEEN 3 AND 90
 UNION ALL
 SELECT trim(h.name), 'hotspot'::text FROM public.hotspots h WHERE h.city IS NULL OR lower(h.city) = 'kota'
)
SELECT min(name), kind, count(*) FROM names
WHERE name <> '' AND lower(name) <> 'kota'
GROUP BY lower(name), kind ORDER BY count(*) DESC, min(name) LIMIT 500;
$$;
REVOKE ALL ON FUNCTION public.get_search_suggestion_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_search_suggestion_catalog() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_search_suggestion_catalog() IS 'Safe cached name vocabulary only; invoker RLS and available listing restrictions remain intact. No unverified aliases.';