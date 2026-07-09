import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { fetchOwnerRelationships } from "@/services/relationship";
import { fetchMyCollaborations } from "@/services/collaborationService";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { fetchUserProfile } from "@/services/UserProfileService";
import { toast } from "sonner";
import WelcomeHeader from "./components/WelcomeHeader";
import OwnerDashboardTabs from "./components/OwnerDashboardTabs";
import OwnerHeroCarousel from "./OwnerHeroCarousel";
import { usePropertyScope } from "@/hooks/usePropertyScope";

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireOwnerComplete } = useProfileCompletion();
  const { propertyId, isPrimary, effectiveOwnerId, activeProperty } = usePropertyScope();

  const [listingsCount, setListingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConnections, setPendingConnections] = useState(0);
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchListingsCount = async () => {
      try {
        let q = supabase.from("rooms").select("id", { count: "exact" }).eq("owner_id", effectiveOwnerId ?? user.id);
        if (propertyId) {
          q = isPrimary ? q.or(`property_id.eq.${propertyId},property_id.is.null`) : q.eq("property_id", propertyId);
        }
        const { count, error } = await q;

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
        const [relationships, collaborations] = await Promise.all([
          fetchOwnerRelationships(effectiveOwnerId ?? user.id, propertyId, isPrimary),
          fetchMyCollaborations().catch(() => []),
        ]);
        const pendingRenters = relationships.filter((r) => r.status === "pending").length;
        // Count collaboration requests received (current user is owner of the property, status pending)
        const pendingCollabs = (collaborations || []).filter(
          (c) => c.status === "pending" && c.i_am === "owner",
        ).length;
        const total = pendingRenters + pendingCollabs;
        setPendingConnections(total);
        console.log(`Pending: ${pendingRenters} renters + ${pendingCollabs} collaborators = ${total}`);
      } catch (error) {
        console.error("Error fetching connection requests:", error);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchListingsCount();
    fetchConnectionRequests();

    // Realtime: refresh counts on collaborator or relationship changes
    const channel = supabase
      .channel(`owner_dashboard_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "property_collaborators" }, () => fetchConnectionRequests())
      .on("postgres_changes", { event: "*", schema: "public", table: "relationships" }, () => fetchConnectionRequests())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, propertyId, isPrimary, effectiveOwnerId]);

  const handleListRoomClick = async () => {
    if (!user) return;

    // Step 1: Check if user has any property
    if (!activeProperty) {
      toast.info("Please add a property first.");
      navigate("/add-property");
      return;
    }

    try {
      // Step 2: Check if the active property has a live location set
      const propLat = activeProperty?.location_latitude;
      const propLng = activeProperty?.location_longitude;
      const propertyHasLocation =
        propLat !== null && propLat !== undefined &&
        propLng !== null && propLng !== undefined &&
        Number(propLat) !== 0 && Number(propLng) !== 0;

      let hasValidLocation = propertyHasLocation;
      if (!hasValidLocation) {
        const profile = await fetchUserProfile(user.id);
        hasValidLocation =
          !!profile?.location_latitude &&
          !!profile?.location_longitude &&
          typeof profile.location_latitude === "number" &&
          typeof profile.location_longitude === "number";
      }

      if (!hasValidLocation) {
        toast.info("Please set your property location before listing rooms.");
        navigate("/set-location", { replace: true, state: { backTo: "/list-room" } });
        return;
      }

      // Step 3: Property and location are both set — proceed to listing
      navigate("/list-room");
    } catch (error) {
      console.error("Error checking prerequisites:", error);
      toast.error("Failed to check prerequisites. Please try again.");
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
