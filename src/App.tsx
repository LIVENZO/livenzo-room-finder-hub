import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { RoomProvider } from "./context/RoomContext";
import ProfileCompletionCheck from "./components/ProfileCompletionCheck";
import { useFCMRegistration } from "./hooks/useFCMRegistration";
import SetLocation from "./pages/SetLocation";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FindRoom from "./pages/FindRoom";
import RoomDetail from "./pages/RoomDetail";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Chats from "./pages/Chats";
import AnonymousChat from "./pages/AnonymousChat";
import Connections from "./pages/Connections";
import ListRoom from "./pages/ListRoom";
import MyListings from "./pages/MyListings";
import Notices from "./pages/Notices";
import Payments from "./pages/Payments";
import ActiveRenters from "./pages/ActiveRenters";
import FirebaseTest from "./pages/FirebaseTest";

const queryClient = new QueryClient();

const FCMWrapper = () => {
  useFCMRegistration();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoomProvider>
          <FCMWrapper />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProfileCompletionCheck />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/find-room" element={<FindRoom />} />
              <Route path="/room/:id" element={<RoomDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/chats/:roomId" element={<Chats />} />
              <Route path="/anonymous-chat" element={<AnonymousChat />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/connections/:relationshipId" element={<Connections />} />
              <Route path="/list-room" element={<ListRoom />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/active-renters" element={<ActiveRenters />} />
              <Route path="/set-location" element={<SetLocation />} />
              <Route path="/firebase-test" element={<FirebaseTest />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoomProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
