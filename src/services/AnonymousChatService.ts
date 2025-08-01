import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnonymousMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_from_current_user?: boolean;
}

export interface AnonymousChatSession {
  id: string;
  participant_1: string;
  participant_2: string | null;
  status: string;
  created_at: string;
  ended_at?: string | null;
}

// Find or create an anonymous chat session using database function
export const findAnonymousChat = async (userId: string): Promise<string | null> => {
  try {
    console.log("Finding anonymous chat for user:", userId);
    
    // Use the database function for atomic matching
    const { data, error } = await supabase.rpc('find_or_create_anonymous_chat', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error finding/creating anonymous chat:", error);
      return null;
    }

    console.log("Database function returned session ID:", data);
    return data;
  } catch (error) {
    console.error("Exception in findAnonymousChat:", error);
    return null;
  }
};

// Send an anonymous message
export const sendAnonymousMessage = async (
  sessionId: string,
  senderId: string,
  message: string
): Promise<AnonymousMessage | null> => {
  try {
    const { data, error } = await supabase
      .from("anonymous_chat_messages")
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        message: message.trim()
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending anonymous message:", error);
      return null;
    }

    return data;
  } catch (error) {
    toast.error("Failed to send message");
    console.error("Exception sending anonymous message:", error);
    return null;
  }
};

// Fetch messages for a session
export const fetchAnonymousMessages = async (
  sessionId: string,
  userId: string
): Promise<AnonymousMessage[]> => {
  try {
    const { data, error } = await supabase
      .from("anonymous_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");

    if (error) {
      console.error("Error fetching anonymous messages:", error);
      return [];
    }

    return (data || []).map(msg => ({
      ...msg,
      is_from_current_user: msg.sender_id === userId
    }));
  } catch (error) {
    console.error("Exception fetching anonymous messages:", error);
    return [];
  }
};

// End anonymous chat session
export const endAnonymousChat = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("anonymous_chat_sessions")
      .update({ 
        status: 'ended', 
        ended_at: new Date().toISOString() 
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error ending session:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception ending session:", error);
    return false;
  }
};

// Get session details
export const getAnonymousSession = async (sessionId: string): Promise<AnonymousChatSession | null> => {
  try {
    const { data, error } = await supabase
      .from("anonymous_chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }

    return data as AnonymousChatSession;
  } catch (error) {
    console.error("Exception fetching session:", error);
    return null;
  }
};

// Find next chat partner
export const findNextChat = async (currentUserId: string, currentSessionId: string): Promise<string | null> => {
  try {
    // End current session
    await endAnonymousChat(currentSessionId);
    
    // Find a new chat
    return await findAnonymousChat(currentUserId);
  } catch (error) {
    console.error("Exception finding next chat:", error);
    return null;
  }
};