
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useRooms } from '@/context/RoomContext';
import RoomImageGallery from '@/components/room/RoomImageGallery';
import RoomHeader from '@/components/room/RoomHeader';
import RoomContent from '@/components/room/RoomContent';
import RoomActionCard from '@/components/room/RoomActionCard';
import RoomImageViewer from '@/components/room/RoomImageViewer';
import { useRoomDetail } from '@/hooks/useRoomDetail';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rooms } = useRooms();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  
  // Load room data
  useEffect(() => {
    if (!id) return;
    
    const roomData = rooms.find(r => r.id === id);
    setRoom(roomData || null);
    setLoading(false);
  }, [id, rooms]);
  
  // Use custom hook to handle room detail logic
  const {
    isFavorite,
    favoritesLoading,
    selectedImage, 
    setSelectedImage,
    ownerPhone,
    handleFavoriteToggle,
    handleCallOwner,
    roomRating,
    roomRules,
    roomAmenities,
    roomAvailability,
  } = useRoomDetail(id, room);
  
  const handleImageClick = (index: number) => {
    setViewerInitialIndex(index);
    setViewerOpen(true);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container max-w-6xl py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!room) {
    return (
      <Layout>
        <div className="container max-w-6xl py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
            <p className="mb-6">The room you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/find-room')}>Browse Available Rooms</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-6xl py-10">
        <Button
          variant="ghost"
          className="mb-4 pl-0"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images and details */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <RoomImageGallery 
              images={room.images} 
              selectedImage={selectedImage} 
              setSelectedImage={setSelectedImage}
              onImageClick={handleImageClick}
            />
            
            {/* Fullscreen Image Viewer */}
            <RoomImageViewer
              images={room.images}
              initialIndex={viewerInitialIndex}
              open={viewerOpen}
              onClose={() => setViewerOpen(false)}
            />
            
            {/* Room header information */}
            <RoomHeader 
              room={room}
              isFavorite={isFavorite}
              favoritesLoading={favoritesLoading}
              handleFavoriteToggle={handleFavoriteToggle}
              roomRating={roomRating}
            />
            
            {/* Room content tabs */}
            <RoomContent 
              description={room.description}
              roomId={room.id}
              roomRules={roomRules}
              roomAmenities={roomAmenities}
              videos={room.videos}
            />
          </div>
          
          {/* Right column - Action card */}
          <div>
            <RoomActionCard 
              room={room} 
              ownerPhone={ownerPhone}
              onCallOwner={handleCallOwner}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RoomDetail;
