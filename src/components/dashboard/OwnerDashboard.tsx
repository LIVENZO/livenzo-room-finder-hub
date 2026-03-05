import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { fetchOwnerRelationships } from "@/services/relationship";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { fetchUserProfile } from "@/services/UserProfileService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import WelcomeHeader from "./components/WelcomeHeader";
import OwnerDashboardTabs from "./components/OwnerDashboardTabs";

const ownerHeroImages = [
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770549274905_4gl3bp8nx9i.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770549670438_r9uhoctwnhi.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/e02288a5-2628-4a59-9f90-ac99151177f9/1768481622588_ba4c1lww6ke.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767528319032_j7mjrqzq9ol.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770624046569_pmhxhc6obc.jpg",
];

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireOwnerComplete } = useProfileCompletion();

  const [listingsCount, setListingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConnections, setPendingConnections] = useState(0);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % ownerHeroImages.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + ownerHeroImages.length) % ownerHeroImages.length);
  }, []);

  // Auto-slide every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStart(null);
  };

  useEffect(() => {
    if (!user) return;

    const fetchListingsCount = async () => {
      try {
        const { count, error } = await supabase.from("rooms").select("id", { count: "exact" }).eq("owner_id", user.id);

        if (error) {
          console.error("Error fetching listings count:", error);
          return;
        }

        setListingsCount(count || 0);
      } catch (error) {
        console.error("Error in fetchListingsCount:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConnectionRequests = async () => {
      setLoadingConnections(true);
      try {
        const relationships = await fetchOwnerRelationships(user.id);
        const pending = relationships.filter((r) => r.status === "pending").length;
        setPendingConnections(pending);
        console.log(`Found ${pending} pending connection requests`);
      } catch (error) {
        console.error("Error fetching connection requests:", error);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchListingsCount();
    fetchConnectionRequests();
  }, [user]);

  const handleListRoomClick = async () => {
    if (!user) return;

    try {
      // Only check if location is set - no need for complete property details to list a room
      const profile = await fetchUserProfile(user.id);
      const hasValidLocation =
        !!profile?.location_latitude &&
        !!profile?.location_longitude &&
        typeof profile.location_latitude === "number" &&
        typeof profile.location_longitude === "number";

      if (!hasValidLocation) {
        toast.info("Set your property location before listing a room.");
        navigate("/set-location", { replace: true, state: { backTo: "/list-room" } });
        return;
      }

      // Location is set, proceed to listing
      navigate("/list-room");
    } catch (error) {
      console.error("Error checking location:", error);
      toast.error("Failed to check location. Please try again.");
    }
  };

  const handleViewListingsClick = () => {
    navigate("/my-listings");
  };

  const handleManageConnectionsClick = () => {
    navigate("/connections");
  };

  const handleStatsCardClick = (type: "listings" | "connections") => {
    if (type === "listings") {
      handleViewListingsClick();
    } else if (type === "connections") {
      handleManageConnectionsClick();
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Carousel Section - identical to Renter Dashboard */}
      <div
        className="relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-medium"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {ownerHeroImages.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === currentSlide ? "opacity-100" : "opacity-0",
            )}
          >
            <img src={image} alt={`Room ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-lg animate-float">
            <Home className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          {ownerHeroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide ? "bg-white w-4" : "bg-white/50 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      </div>

      <OwnerDashboardTabs
        listingsCount={listingsCount}
        isLoading={isLoading}
        pendingConnections={pendingConnections}
        loadingConnections={loadingConnections}
        onStatsCardClick={handleStatsCardClick}
        onListRoomClick={handleListRoomClick}
        onViewListingsClick={handleViewListingsClick}
        onManageConnectionsClick={handleManageConnectionsClick}
        userId={user.id}
      />

      {/* Background decorative elements */}
      <div className="fixed top-1/3 right-1/4 opacity-5 pointer-events-none">
        <Home className="h-48 w-48 text-primary-300 animate-float" />
      </div>
    </div>
  );
};

export default OwnerDashboard;
