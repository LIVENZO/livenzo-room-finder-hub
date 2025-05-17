
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RoomProvider } from "./context/RoomContext";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FindRoom from "./pages/FindRoom";
import RoomDetail from "./pages/RoomDetail";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Bookings from "./pages/Bookings";
import Chats from "./pages/Chats";
import Connections from "./pages/Connections";
import ListRoom from "./pages/ListRoom";
import MyListings from "./pages/MyListings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoomProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/find-room" element={<FindRoom />} />
              <Route path="/room/:id" element={<RoomDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/chats/:roomId" element={<Chats />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/connections/:relationshipId" element={<Connections />} />
              <Route path="/list-room" element={<ListRoom />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoomProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
