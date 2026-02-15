import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Maps service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'geocode') {
      const { placeName } = body;
      if (!placeName || typeof placeName !== 'string' || placeName.trim().length < 2) {
        return new Response(
          JSON.stringify({ error: 'Invalid place name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use Google Places Text Search to geocode
      const query = encodeURIComponent(`${placeName.trim()}, Kota, Rajasthan, India`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('Geocoding URL:', url.replace(GOOGLE_MAPS_API_KEY, '***'));
      const response = await fetch(url);
      const data = await response.json();
      console.log('Google Places response status:', data.status, 'results count:', data.results?.length, 'error_message:', data.error_message);

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return new Response(
          JSON.stringify({ error: `Could not find "${placeName}". Try a different place name.`, googleStatus: data.status, googleError: data.error_message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const place = data.results[0];
      return new Response(
        JSON.stringify({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          formattedName: place.name || placeName,
          formattedAddress: place.formatted_address,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'walking-distances') {
      const { originLat, originLng, destinations } = body;

      if (!originLat || !originLng || !Array.isArray(destinations) || destinations.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid parameters for walking distances' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Limit to 25 destinations (Distance Matrix API limit)
      const limitedDests = destinations.slice(0, 25);
      const destString = limitedDests
        .map((d: { lat: number; lng: number }) => `${d.lat},${d.lng}`)
        .join('|');

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destString}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        return new Response(
          JSON.stringify({ error: 'Failed to calculate walking distances' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const elements = data.rows[0]?.elements || [];
      const results = limitedDests.map((dest: { roomId: string }, index: number) => {
        const element = elements[index];
        if (element?.status === 'OK') {
          return {
            roomId: dest.roomId,
            walkingDuration: element.duration.text,
            walkingDurationSeconds: element.duration.value,
            walkingDistance: element.distance.text,
            walkingDistanceMeters: element.distance.value,
          };
        }
        return { roomId: dest.roomId, walkingDuration: null, walkingDistance: null };
      });

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "geocode" or "walking-distances"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Near place search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
