
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { openGoogleMapsDirections } from '@/services/LocationService';
import { Room } from '@/types/room';

interface LocationViewerProps {
  room: Room;
  ownerLatitude?: number | null;
  ownerLongitude?: number | null;
}

const LocationViewer: React.FC<LocationViewerProps> = ({ 
  room, 
  ownerLatitude, 
  ownerLongitude 
}) => {
  const [open, setOpen] = useState(false);
  
  const hasLocation = ownerLatitude && ownerLongitude;

  const handleGetDirections = () => {
    if (hasLocation) {
      openGoogleMapsDirections(ownerLatitude, ownerLongitude);
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
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <MapPin className="h-4 w-4 mr-2" />
          📍 View Location on Map
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
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900">{room.title}</h4>
            <p className="text-sm text-gray-600">{room.location}</p>
          </div>
          
          {/* Map */}
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dISGnYJMzXjHQ0&q=${ownerLatitude},${ownerLongitude}&zoom=16`}
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Property Location"
            />
          </div>
          
          {/* Get Directions Button */}
          <Button 
            onClick={handleGetDirections}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Navigation className="h-4 w-4 mr-2" />
            🧭 Get Directions
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Tap "Get Directions" to open Google Maps with navigation
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationViewer;
