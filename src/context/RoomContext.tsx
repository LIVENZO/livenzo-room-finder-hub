import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { Room, RoomFilters, PropertyTypeFilter } from "@/types/room";
import { fetchRooms as fetchRoomsService } from "@/services/roomService";
import { useRoomFilters } from "@/hooks/useRoomFilters";
import { useNearMe } from "@/hooks/useNearMe";
import { useHotspotSearch } from "@/hooks/useHotspotSearch";
import { Hotspot } from "@/services/HotspotService";

interface RoomContextType {
  rooms: Room[];
  isLoading: boolean;
  filters: RoomFilters;
  filteredRooms: Room[];
  setFilters: (filters: RoomFilters) => void;
  getRoom: (id: string) => Room | undefined;
  refreshRooms: () => Promise<void>;
  clearAllFilters: () => void;
  searchText: string;
  setSearchText: (text: string) => void;
  // Near Me state
  nearMeActive: boolean;
  nearMeLoading: boolean;
  nearMeError: string | null;
  activateNearMe: () => void;
  deactivateNearMe: () => void;
  // Hotspot state
  hotspotSuggestions: Hotspot[];
  activeHotspot: Hotspot | null;
  updateHotspotSuggestions: (query: string) => void;
  selectHotspot: (hotspot: Hotspot) => void;
  clearHotspot: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchScopeRooms, setSearchScopeRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const fetchRequestRef = useRef(0);

  const {
    isActive: nearMeActive,
    isLoading: nearMeLoading,
    error: nearMeError,
    activateNearMe,
    deactivateNearMe,
    calculateRoomDistances,
  } = useNearMe();

  const {
    suggestions: hotspotSuggestions,
    activeHotspot,
    updateSuggestions: updateHotspotSuggestions,
    selectHotspot,
    clearHotspot,
  } = useHotspotSearch();

  const { filters, setFilters, filteredRooms, clearAllFilters, searchText, setSearchText } = useRoomFilters(
    useMemo(() => {
      if (nearMeActive) {
        return calculateRoomDistances(searchScopeRooms);
      }
      return searchScopeRooms.map((room) => ({ ...room, distance: undefined }));
    }, [searchScopeRooms, nearMeActive, calculateRoomDistances]),
    activeHotspot,
  );

  const syncRooms = async (propertyType: PropertyTypeFilter = filters.propertyType ?? 'all', showSuccessToast = false) => {
    const requestId = ++fetchRequestRef.current;
    setIsLoading(true);

    try {
      const [allRooms, scopedRooms] = await Promise.all([
        fetchRoomsService('all'),
        propertyType === 'all' ? Promise.resolve<Room[] | null>(null) : fetchRoomsService(propertyType),
      ]);

      if (requestId !== fetchRequestRef.current) return;

      setRooms(allRooms);
      setSearchScopeRooms(scopedRooms ?? allRooms);

      if (showSuccessToast) {
        toast.success("Rooms refreshed successfully");
      }
    } catch {
      if (requestId === fetchRequestRef.current) {
        toast.error(showSuccessToast ? "Failed to refresh rooms" : "Failed to load rooms");
      }
    } finally {
      if (requestId === fetchRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setSearchScopeRooms([]);
      setIsLoading(false);
      return;
    }

    void syncRooms(filters.propertyType ?? 'all');
  }, [user?.id, filters.propertyType]);

  const refreshRooms = async () => {
    await syncRooms(filters.propertyType ?? 'all', true);
  };

  const getRoom = (id: string) => {
    return rooms.find((room) => room.id === id);
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        isLoading,
        filters,
        filteredRooms,
        setFilters,
        getRoom,
        refreshRooms,
        clearAllFilters,
        searchText,
        setSearchText,
        nearMeActive,
        nearMeLoading,
        nearMeError,
        activateNearMe,
        deactivateNearMe,
        hotspotSuggestions,
        activeHotspot,
        updateHotspotSuggestions,
        selectHotspot,
        clearHotspot,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRooms must be used within a RoomProvider");
  }
  return context;
};

export type { Room } from "@/types/room";
