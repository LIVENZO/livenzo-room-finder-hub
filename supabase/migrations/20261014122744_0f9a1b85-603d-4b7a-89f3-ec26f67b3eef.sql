CREATE OR REPLACE FUNCTION public.search_public_room_listings(
  p_query text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_room_type text DEFAULT NULL,
  p_wifi boolean DEFAULT NULL,
  p_bathroom boolean DEFAULT NULL,
  p_cooling_type text DEFAULT NULL,
  p_food text DEFAULT NULL,
  p_location_query text DEFAULT NULL,
  p_hotspot_latitude numeric DEFAULT NULL,
  p_hotspot_longitude numeric DEFAULT NULL,
  p_relax_location boolean DEFAULT false,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, title text, description text, images text[], videos text[], price numeric,
  location text, facilities jsonb, owner_id uuid, owner_phone text, created_at timestamptz,
  updated_at timestamptz, available boolean, location_latitude numeric, location_longitude numeric,
  house_no text, house_name text, maximum_price numeric, minimum_price numeric, property_type text,
  pg_rent numeric, hostel_rent numeric, is_top_room boolean, search_score numeric, distance_km numeric
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH normalized AS (
    SELECT nullif(lower(trim(p_query)), '') AS query_text,
      nullif(lower(trim(p_location_query)), '') AS location_text,
      CASE WHEN p_property_type IN ('PG', 'Hostel', 'BHK') THEN p_property_type END AS requested_type,
      CASE WHEN p_gender IN ('male', 'female') THEN p_gender END AS requested_gender,
      greatest(1, least(coalesce(p_limit, 200), 200)) AS result_limit,
      greatest(coalesce(p_offset, 0), 0) AS result_offset
  ),
  candidates AS (
    SELECT r.*, n.query_text, n.location_text, n.requested_type,
      CASE
        WHEN n.requested_type = 'PG' AND r.property_type = 'PG_HOSTEL' THEN coalesce(r.pg_rent, r.price)
        WHEN n.requested_type = 'Hostel' AND r.property_type = 'PG_HOSTEL' THEN coalesce(r.hostel_rent, r.price)
        ELSE r.price
      END AS effective_price,
      lower(coalesce(r.title, '') || ' ' || coalesce(r.description, '') || ' ' || coalesce(r.location, '') || ' ' || coalesce(r.house_name, '')) AS searchable_text,
      CASE WHEN p_hotspot_latitude IS NOT NULL AND p_hotspot_longitude IS NOT NULL AND r.location_latitude IS NOT NULL AND r.location_longitude IS NOT NULL
        THEN 6371 * 2 * asin(sqrt(
          power(sin(radians((r.location_latitude - p_hotspot_latitude)::double precision) / 2), 2) +
          cos(radians(p_hotspot_latitude::double precision)) * cos(radians(r.location_latitude::double precision)) *
          power(sin(radians((r.location_longitude - p_hotspot_longitude)::double precision) / 2), 2)))
        ELSE NULL END AS computed_distance
    FROM public.rooms r CROSS JOIN normalized n
    WHERE r.available = true
      AND (n.requested_type IS NULL
        OR (n.requested_type = 'PG' AND r.property_type IN ('PG', 'PG_HOSTEL'))
        OR (n.requested_type = 'Hostel' AND r.property_type IN ('Hostel', 'PG_HOSTEL'))
        OR (n.requested_type = 'BHK' AND r.property_type = 'BHK'))
      AND (n.requested_gender IS NULL OR coalesce(r.facilities->>'gender', 'any') IN (n.requested_gender, 'any'))
      AND (p_room_type IS NULL OR r.facilities->>'roomType' = p_room_type)
      AND (p_wifi IS DISTINCT FROM true OR coalesce((r.facilities->>'wifi')::boolean, false))
      AND (p_bathroom IS DISTINCT FROM true OR coalesce((r.facilities->>'bathroom')::boolean, false))
      AND (p_cooling_type IS NULL OR r.facilities->>'coolingType' = p_cooling_type)
      AND (p_food IS NULL OR r.facilities->>'food' = p_food)
  ),
  eligible AS (
    SELECT c.* FROM candidates c
    WHERE (p_max_price IS NULL OR c.effective_price <= p_max_price)
      AND (c.location_text IS NULL OR p_relax_location
        OR lower(coalesce(c.location, '') || ' ' || coalesce(c.house_name, '')) LIKE '%' || c.location_text || '%'
        OR similarity(lower(coalesce(c.location, '') || ' ' || coalesce(c.house_name, '')), c.location_text) >= 0.22
        OR (c.computed_distance IS NOT NULL AND c.computed_distance <= 2.5))
  ),
  scored AS (
    SELECT e.*,
      (CASE WHEN e.requested_type IS NOT NULL THEN 100 ELSE 0 END
       + CASE WHEN p_gender IS NOT NULL THEN 80 ELSE 0 END
       + CASE WHEN p_max_price IS NOT NULL THEN 50 ELSE 0 END
       + CASE WHEN e.location_text IS NOT NULL AND lower(coalesce(e.location, '')) LIKE '%' || e.location_text || '%' THEN 70
              WHEN e.location_text IS NOT NULL AND lower(coalesce(e.house_name, '')) LIKE '%' || e.location_text || '%' THEN 65
              WHEN e.location_text IS NOT NULL THEN 30 * similarity(lower(coalesce(e.location, '') || ' ' || coalesce(e.house_name, '')), e.location_text) ELSE 0 END
       + CASE WHEN e.computed_distance IS NOT NULL THEN greatest(0, 55 - least(e.computed_distance, 11) * 5) ELSE 0 END
       + CASE WHEN e.query_text IS NOT NULL AND e.searchable_text LIKE '%' || e.query_text || '%' THEN 30
              WHEN e.query_text IS NOT NULL THEN 20 * similarity(e.searchable_text, e.query_text) ELSE 0 END
       + CASE WHEN e.is_top_room THEN 8 ELSE 0 END
       + CASE WHEN cardinality(coalesce(e.images, ARRAY[]::text[])) > 0 THEN 4 ELSE 0 END
       + CASE WHEN e.description IS NOT NULL AND length(trim(e.description)) >= 40 THEN 3 ELSE 0 END
       + CASE WHEN e.location_latitude IS NOT NULL AND e.location_longitude IS NOT NULL THEN 3 ELSE 0 END
       + CASE WHEN p_max_price IS NOT NULL THEN greatest(0, 10 - (e.effective_price / greatest(p_max_price, 1)) * 10) ELSE 0 END)::numeric AS computed_score
    FROM eligible e
  )
  SELECT s.id, s.title, s.description, coalesce(s.images, ARRAY[]::text[]), coalesce(s.videos, ARRAY[]::text[]),
    s.effective_price, s.location, s.facilities, s.owner_id, 'Contact via app'::text,
    s.created_at, s.updated_at, coalesce(s.available, true), s.location_latitude, s.location_longitude,
    s.house_no, s.house_name, s.maximum_price,
    CASE WHEN s.requested_type IN ('PG', 'Hostel') AND s.property_type = 'PG_HOSTEL' THEN s.effective_price ELSE s.minimum_price END,
    s.property_type, s.pg_rent, s.hostel_rent, coalesce(s.is_top_room, false), round(s.computed_score, 4),
    CASE WHEN s.computed_distance IS NULL THEN NULL ELSE round(s.computed_distance::numeric, 3) END
  FROM scored s
  ORDER BY s.computed_score DESC, s.computed_distance ASC NULLS LAST, s.is_top_room DESC, s.created_at DESC
  LIMIT (SELECT result_limit FROM normalized) OFFSET (SELECT result_offset FROM normalized);
$$;

GRANT EXECUTE ON FUNCTION public.search_public_room_listings(text, text, text, numeric, text, boolean, boolean, text, text, text, numeric, numeric, boolean, integer, integer) TO anon, authenticated, service_role;