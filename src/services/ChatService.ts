import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  room_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

export const sendMessage = async (
  message: Omit<ChatMessage, 'id' | 'created_at' | 'read'>
): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ ...message, read: false })
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
      return null;
    }

    return data;
  } catch (error) {
    toast.error("Failed to send message");
    console.error("Exception sending message:", error);
    return null;
  }
};

export const fetchRoomMessages = async (
  userId: string,
  roomId: string
): Promise<ChatMessage[]> => {
  try {
    // First, let's fetch all messages for the room
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at");

    if (error) {
      console.error("Error fetching room messages:", error);
      return [];
    }

    // Then, get user info for each message sender
    const messages: ChatMessage[] = [];
    
    for (const msg of data || []) {
      // Get sender profile info
      const { data: senderData } = await supabase
        .from("user_profiles")
        .select("full_name, hostel_pg_name, avatar_url")
        .eq("id", msg.sender_id)
        .single();
        
      messages.push({
        ...msg,
        sender: senderData ? {
          full_name: senderData.hostel_pg_name || senderData.full_name || 'Unknown',
          avatar_url: senderData.avatar_url
        } : { full_name: 'Unknown', avatar_url: '' }
      });
    }

    return messages;
  } catch (error) {
    console.error("Exception fetching room messages:", error);
    return [];
  }
};

export const fetchUserConversations = async (
  userId: string
): Promise<{ room_id: string; last_message: ChatMessage }[]> => {
  try {
    // This is a bit complex - we need to get the latest message for each room
    // First, get all rooms the user has messages in
    const { data: rooms, error: roomsError } = await supabase
      .from("chat_messages")
      .select("room_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (roomsError) {
      console.error("Error fetching conversations:", roomsError);
      return [];
    }

    // Get unique room IDs
    const uniqueRoomIds = [...new Set(rooms.map(r => r.room_id))];
    
    // For each room, fetch the latest message
    const conversations: { room_id: string; last_message: ChatMessage }[] = [];
    
    for (const roomId of uniqueRoomIds) {
      const { data: messages, error: msgError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(1);
          
      if (msgError || !messages || messages.length === 0) {
        console.error("Error fetching messages for room:", roomId, msgError);
        continue;
      }
      
      // Get sender profile info
      const { data: senderData } = await supabase
        .from("user_profiles")
        .select("full_name, hostel_pg_name, avatar_url")
        .eq("id", messages[0].sender_id)
        .single();
      
      conversations.push({ 
        room_id: roomId, 
        last_message: {
          ...messages[0],
          sender: senderData ? {
            full_name: senderData.hostel_pg_name || senderData.full_name || 'Unknown',
            avatar_url: senderData.avatar_url
          } : { full_name: 'Unknown', avatar_url: '' }
        }
      });
    }
    
    return conversations;
  } catch (error) {
    console.error("Exception fetching conversations:", error);
    return [];
  }
};

export const markMessagesAsRead = async (
  userId: string,
  roomId: string,
  senderId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("chat_messages")
      .update({ read: true })
      .match({ room_id: roomId, sender_id: senderId, receiver_id: userId, read: false });

    if (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception marking messages as read:", error);
    return false;
  }
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const { data, error, count } = await supabase
      .from("chat_messages")
      .select("id", { count: 'exact', head: true })
      .eq("receiver_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error getting unread message count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Exception getting unread message count:", error);
    return 0;
  }
};
