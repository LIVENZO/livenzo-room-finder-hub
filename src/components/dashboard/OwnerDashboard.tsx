import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { fetchOwnerRelationships } from "@/services/relationship";
import { fetchMyCollaborations } from "@/services/collaborationService";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useListRoomFlow } from "@/hooks/useListRoomFlow";
import WelcomeHeader from "./components/WelcomeHeader";
import OwnerDashboardTabs from "./components/OwnerDashboardTabs";
import OwnerHeroCarousel from "./OwnerHeroCarousel";
import { usePropertyScope } from "@/hooks/usePropertyScope";

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireOwnerComplete } = useProfileCompletion();
  const { propertyId, isPrimary, effectiveOwnerId } = usePropertyScope();
  const { openListRoom: handleListRoomClick } = useListRoomFlow();

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
      {/* Hero Carousel - per-property, owner can long-press Home icon to edit */}
      <OwnerHeroCarousel />


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
