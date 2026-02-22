
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { getMapsUrlsSecure } from '@/services/security/secureLocationService';
import { Room } from '@/types/room';

interface LocationViewerProps {
  room: Room;
}

const LocationViewer: React.FC<LocationViewerProps> = ({ room }) => {
  const [open, setOpen] = useState(false);
  const [mapsUrls, setMapsUrls] = useState<{ embedUrl?: string; directionsUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Use room's latitude/longitude (already includes fallback from database)
  const latitude = room.latitude;
  const longitude = room.longitude;
  const hasLocation = latitude && longitude;

  useEffect(() => {
    if (hasLocation && open) {
      loadMapsUrls();
    }
  }, [hasLocation, open]);

  const loadMapsUrls = async () => {
    if (!latitude || !longitude) return;
    
    setLoading(true);
    try {
      const urls = await getMapsUrlsSecure(latitude, longitude);
      setMapsUrls(urls);
    } catch (error) {
      console.error('Error loading maps URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (mapsUrls?.directionsUrl) {
      // Use window.location.href for better Android WebView compatibility
      window.location.href = mapsUrls.directionsUrl;
    }
  };

  if (!hasLocation) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <AlertCircle className="h-4 w-4 mr-2" />
        Location not available for this property
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium">
          <MapPin className="h-4 w-4 mr-2" />
          View Location on Map
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-foreground">{room.title}</h4>
            <p className="text-sm text-muted-foreground">{room.location}</p>
          </div>
          
          {/* Map */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="h-[250px] flex items-center justify-center bg-muted">
                <div className="text-sm text-muted-foreground">Loading map...</div>
              </div>
            ) : mapsUrls?.embedUrl ? (
              <iframe
                src={mapsUrls.embedUrl}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location"
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center bg-muted">
                <div className="text-sm text-muted-foreground">Map unavailable</div>
              </div>
            )}
          </div>
          
          {/* Get Directions Button */}
          <Button 
            onClick={handleGetDirections}
            disabled={!mapsUrls?.directionsUrl}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            Tap "Get Directions" to open Google Maps with navigation
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationViewer;
