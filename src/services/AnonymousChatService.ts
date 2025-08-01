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
  participant_2: string;
  status: 'waiting' | 'active' | 'ended';
  created_at: string;
  ended_at?: string;
}

// Find or create an anonymous chat session
export const findAnonymousChat = async (userId: string): Promise<string | null> => {
  try {
    // First, try to find an existing waiting session (not created by this user)
    const { data: waitingSessions, error: findError } = await supabase
      .from("anonymous_chat_sessions")
      .select("*")
      .eq("status", "waiting")
      .neq("participant_1", userId)
      .limit(1);

    if (findError) {
      console.error("Error finding waiting session:", findError);
      return null;
    }

    if (waitingSessions && waitingSessions.length > 0) {
      // Join the existing session
      const session = waitingSessions[0];
      const { error: updateError } = await supabase
        .from("anonymous_chat_sessions")
        .update({ 
          participant_2: userId, 
          status: 'active' 
        })
        .eq("id", session.id);

      if (updateError) {
        console.error("Error joining session:", updateError);
        return null;
      }

      return session.id;
    } else {
      // Create a new waiting session
      const { data: newSession, error: createError } = await supabase
        .from("anonymous_chat_sessions")
        .insert({
          participant_1: userId,
          status: 'waiting'
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error creating session:", createError);
        return null;
      }

      return newSession.id;
    }
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

    return data;
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