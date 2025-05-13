
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, fetchRoomMessages, fetchUserConversations, markMessagesAsRead, sendMessage } from '@/services/ChatService';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [conversations, setConversations] = useState<{ room_id: string; last_message: ChatMessage }[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(roomId || null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  
  // Scroll to bottom ref
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const loadConversations = async () => {
      setLoading(true);
      const userConversations = await fetchUserConversations(user.id);
      setConversations(userConversations);
      setLoading(false);
      
      if (roomId && !activeRoom) {
        setActiveRoom(roomId);
      } else if (userConversations.length > 0 && !activeRoom) {
        setActiveRoom(userConversations[0].room_id);
      }
    };
    
    loadConversations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        // Update messages if it's for the current room
        if (activeRoom === payload.new.room_id) {
          setMessages(prevMessages => [...prevMessages, payload.new as ChatMessage]);
          markMessagesAsRead(user.id, payload.new.room_id, payload.new.sender_id);
        }
        
        // Update conversations list
        loadConversations();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, roomId]);
  
  // Load messages when active room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !activeRoom) return;
      
      setLoading(true);
      const roomMessages = await fetchRoomMessages(user.id, activeRoom);
      setMessages(roomMessages);
      setLoading(false);
      
      // Find the other user in the conversation
      const lastMessage = roomMessages[roomMessages.length - 1];
      if (lastMessage) {
        const otherId = lastMessage.sender_id === user.id ? lastMessage.receiver_id : lastMessage.sender_id;
        setOtherUserId(otherId);
        
        // Mark messages as read
        if (lastMessage.sender_id !== user.id && !lastMessage.read) {
          await markMessagesAsRead(user.id, activeRoom, lastMessage.sender_id);
        }
      }
    };
    
    loadMessages();
  }, [activeRoom, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !activeRoom || !otherUserId || !newMessage.trim()) return;
    
    setSending(true);
    
    const messageToSend = {
      sender_id: user.id,
      receiver_id: otherUserId,
      room_id: activeRoom,
      message: newMessage.trim(),
    };
    
    const sentMessage = await sendMessage(messageToSend);
    
    if (sentMessage) {
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    }
    
    setSending(false);
  };
  
  const selectConversation = (roomId: string) => {
    setActiveRoom(roomId);
    navigate(`/chats/${roomId}`);
  };
  
  return (
    <Layout>
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversations sidebar */}
          <div className="border rounded-lg p-4 overflow-y-auto hidden md:block">
            <h2 className="font-semibold text-lg mb-4">Your Conversations</h2>
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const isActive = activeRoom === conv.room_id;
                  const isCurrentUserSender = conv.last_message.sender_id === user?.id;
                  const otherUser = isCurrentUserSender ? conv.last_message.receiver_id : conv.last_message.sender_id;
                  const hasUnread = !conv.last_message.read && !isCurrentUserSender;
                  
                  return (
                    <div
                      key={conv.room_id}
                      onClick={() => selectConversation(conv.room_id)}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        isActive ? 'bg-primary/10' : hasUnread ? 'bg-blue-50' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={conv.last_message.sender?.avatar_url || ''} />
                        <AvatarFallback>
                          {conv.last_message.sender?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">
                            {conv.last_message.sender?.full_name || otherUser}
                          </p>
                          <small className="text-gray-500 text-xs">
                            {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                          </small>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {isCurrentUserSender ? 'You: ' : ''}{conv.last_message.message}
                        </p>
                      </div>
                      {hasUnread && (
                        <Badge className="ml-2" variant="default">New</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Chat area */}
          <div className="border rounded-lg flex flex-col md:col-span-2">
            {!activeRoom ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-lg text-gray-500 mb-4">Select a conversation to start chatting</p>
                <Button onClick={() => navigate('/dashboard')}>Find Rooms</Button>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="border-b p-3 flex justify-between items-center">
                  <h3 className="font-semibold">
                    {conversations.find(c => c.room_id === activeRoom)?.last_message.sender?.full_name || 'Chat'}
                  </h3>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No messages yet</p>
                  ) : (
                    messages.map((msg) => {
                      const isCurrentUser = msg.sender_id === user?.id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message input */}
                <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chats;
