import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, SkipForward, X, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { findAnonymousChat, sendAnonymousMessage, fetchAnonymousMessages, endAnonymousChat, getAnonymousSession, findNextChat, type AnonymousMessage, type AnonymousChatSession } from '@/services/AnonymousChatService';
import { formatDistanceToNow } from 'date-fns';
const AnonymousChat = () => {
  const {
    user,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<AnonymousChatSession | null>(null);
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const leavingRef = useRef(false);

  // Keep a ref of the active session for cleanup handlers
  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Redirect if not renter
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (userRole !== 'renter') {
      toast.error("This feature is only available for renters");
      navigate('/dashboard');
      return;
    }
  }, [user, userRole, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Real-time message + session + presence subscription
  useEffect(() => {
    if (!currentSessionId || !user) return;
    let presenceReady = false;
    const channel = supabase
      .channel(`anonymous-chat-${currentSessionId}`, {
        config: { presence: { key: user.id } },
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'anonymous_chat_messages',
        filter: `session_id=eq.${currentSessionId}`,
      }, payload => {
        const newMsg = {
          ...payload.new,
          is_from_current_user: payload.new.sender_id === user.id,
        } as AnonymousMessage;
        setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'anonymous_chat_sessions',
        filter: `id=eq.${currentSessionId}`,
      }, payload => {
        const updatedSession = payload.new as AnonymousChatSession;
        setSession(updatedSession);
        if (updatedSession.status === 'active' && isWaiting) {
          setIsWaiting(false);
          toast.success("Connected to a Fellow Kotayan!");
        }
        if (updatedSession.status === 'ended' && !leavingRef.current) {
          toast.info("Your Fellow Kotayan has left the chat.");
          handlePartnerLeft();
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        // Ignore self-leaves and pre-sync leaves
        if (!presenceReady || key === user.id || leavingRef.current) return;
        // Partner disconnected (closed app / refresh / network loss)
        endAnonymousChat(currentSessionId).catch(() => {});
        toast.info("Your Fellow Kotayan has left the chat.");
        handlePartnerLeft();
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
          // Small delay to avoid firing 'leave' for pre-existing presence sync
          setTimeout(() => { presenceReady = true; }, 500);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId, user, isWaiting]);

  // Best-effort cleanup on tab close / refresh
  useEffect(() => {
    const cleanup = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      // Fire-and-forget; presence 'leave' on the other side is the reliable signal
      try { endAnonymousChat(sid); } catch {}
    };
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      // Component unmount: end active session
      cleanup();
    };
  }, []);
  const startNewChat = async () => {
    if (!user) return;
    setIsConnecting(true);
    setMessages([]);
    setPartnerLeft(false);
    leavingRef.current = false;
    try {
      const sessionId = await findAnonymousChat(user.id);
      if (sessionId) {
        setCurrentSessionId(sessionId);
        const sessionData = await getAnonymousSession(sessionId);
        setSession(sessionData);
        if (sessionData?.status === 'waiting') {
          setIsWaiting(true);
          toast.info("Looking for a Fellow Kotayan to chat with...");

          // Set a timeout to show "no one available" message
          setTimeout(() => {
            if (sessionData?.status === 'waiting') {
              toast.info("No one is available right now. Please try again in a few minutes.");
            }
          }, 30000); // 30 seconds timeout
        } else if (sessionData?.status === 'active') {
          toast.success("Connected to a Fellow Kotayan!");
          setIsWaiting(false);
          const existingMessages = await fetchAnonymousMessages(sessionId, user.id);
          setMessages(existingMessages);
        }
      } else {
        toast.error("Unable to start chat. Please try again.");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Unable to start chat. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSessionId || !user || !newMessage.trim() || session?.status !== 'active') return;
    setIsSending(true);
    try {
      const sentMessage = await sendAnonymousMessage(currentSessionId, user.id, newMessage);
      if (sentMessage) {
        setNewMessage('');
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  const handleNextChat = async () => {
    if (!user || !currentSessionId) return;
    setIsConnecting(true);
    setMessages([]);
    setPartnerLeft(false);
    // Mark that we are the one leaving so our own session-ended UPDATE doesn't
    // trigger the "partner left" toast on this client.
    leavingRef.current = true;
    try {
      const newSessionId = await findNextChat(user.id, currentSessionId);
      if (newSessionId) {
        setCurrentSessionId(newSessionId);
        leavingRef.current = false;
        const sessionData = await getAnonymousSession(newSessionId);
        setSession(sessionData);
        if (sessionData?.status === 'waiting') {
          setIsWaiting(true);
          toast.info("Looking for a new Fellow Kotayan...");
        } else {
          toast.success("Connected to a new Fellow Kotayan!");
          const existingMessages = await fetchAnonymousMessages(newSessionId, user.id);
          setMessages(existingMessages);
        }
      } else {
        toast.error("Unable to find next chat. Please try again.");
      }
    } catch (error) {
      console.error("Error finding next chat:", error);
      toast.error("Unable to find next chat. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  const handleEndChat = async () => {
    if (!currentSessionId) return;
    leavingRef.current = true;
    try {
      await endAnonymousChat(currentSessionId);
      toast.info("Chat ended");
      handleBackToStart();
    } catch (error) {
      console.error("Error ending chat:", error);
      toast.error("Unable to end chat");
    }
  };
  const handlePartnerLeft = () => {
    // Show a clear "partner left" state; user can find a new chat or go back
    setPartnerLeft(true);
    setIsWaiting(false);
    setSession(prev => (prev ? { ...prev, status: 'ended' } : prev));
  };
  const handleBackToStart = () => {
    setCurrentSessionId(null);
    setSession(null);
    setMessages([]);
    setIsWaiting(false);
    setPartnerLeft(false);
    leavingRef.current = false;
  };
  const handleBackToDashboard = () => {
    handleBackToStart();
    navigate('/dashboard');
  };

  const handleBackButton = async () => {
    // If in chat/waiting or partner-left state, end session and return to start screen
    if (currentSessionId || partnerLeft) {
      const sid = currentSessionId;
      leavingRef.current = true;
      if (sid) {
        try {
          await endAnonymousChat(sid);
        } catch (e) {
          console.error('Error ending chat on back:', e);
        }
      }
      handleBackToStart();
      return;
    }
    handleBackToDashboard();
  };

  // Intercept hardware/browser back so it returns to the start screen first
  useEffect(() => {
    if (!currentSessionId && !partnerLeft) return;
    window.history.pushState({ anonChat: true }, '');
    const onPopState = () => {
      handleBackButton();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, partnerLeft]);
  if (userRole !== 'renter') {
    return null;
  }
  return <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackButton} className="text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary-foreground/20">
              <AvatarFallback className="bg-transparent text-primary-foreground text-sm font-medium">FS</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-lg">Fellow Student</h1>
              <p className="text-xs text-primary-foreground/80">
                {partnerLeft
                  ? "Partner left"
                  : isWaiting
                    ? "Looking for someone..."
                    : session?.status === 'active'
                      ? "Online"
                      : "Anonymous Chat"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {session?.status === 'active' && !partnerLeft && <>
              <Button variant="ghost" size="icon" onClick={handleNextChat} disabled={isConnecting} className="text-primary-foreground hover:bg-primary-foreground/20">
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleEndChat} className="text-primary-foreground hover:bg-primary-foreground/20">
                <X className="h-5 w-5" />
              </Button>
            </>}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col">
        {!currentSessionId && !partnerLeft ?
      // Start Chat Screen
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
            <div className="text-center space-y-6 max-w-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Talk to a Fellow Student</h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Connect anonymously with other renters. Share experiences, ask questions, or just chat!
                </p>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Completely anonymous</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>No personal details shared</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Renters only</span>
                </div>
              </div>

              <Button onClick={startNewChat} disabled={isConnecting} className="w-full h-12 text-base font-medium rounded-xl">
                {isConnecting ? <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Connecting...
                  </> : 'Start Chatting'}
              </Button>
            </div>
          </div> :
      // Chat Interface
      <>
            {isWaiting && <div className="bg-muted/30 p-4 text-center border-b">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Waiting for a Fellow Kotayan to join...</span>
                </div>
              </div>}

            {partnerLeft && <div className="bg-destructive/10 p-3 text-center border-b">
                <span className="text-sm text-destructive font-medium">Your Fellow Kotayan has left the chat</span>
              </div>}


            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {messages.length === 0 ? <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {isWaiting ? "Start the conversation when connected!" : "No messages yet"}
                  </p>
                </div> : messages.map(msg => <div key={msg.id} className={`flex ${msg.is_from_current_user ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-2 max-w-[85%]">
                      {!msg.is_from_current_user && <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            FS
                          </AvatarFallback>
                        </Avatar>}
                      
                      <div className={`rounded-2xl px-4 py-3 ${msg.is_from_current_user ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-background border rounded-bl-md shadow-sm'}`}>
                        <p className="text-base leading-relaxed">{msg.message}</p>
                        <div className={`text-xs mt-1 ${msg.is_from_current_user ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true
                  })}
                        </div>
                      </div>
                      
                      {msg.is_from_current_user && <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            You
                          </AvatarFallback>
                        </Avatar>}
                    </div>
                  </div>)}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input or Partner-Left actions */}
            {partnerLeft ? (
              <div className="p-4 bg-background border-t flex gap-3">
                <Button variant="outline" onClick={handleBackToStart} className="flex-1 h-12 rounded-xl">
                  Back
                </Button>
                <Button onClick={async () => { handleBackToStart(); await startNewChat(); }} disabled={isConnecting} className="flex-1 h-12 rounded-xl">
                  {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find New Chat'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-4 bg-background border-t">
                <div className="flex gap-3">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={session?.status === 'active' ? "Type your message..." : "Waiting to connect..."} className="flex-1 h-12 text-base rounded-xl" disabled={isSending || session?.status !== 'active'} />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending || session?.status !== 'active'} className="h-12 w-12 rounded-xl">
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            )}
          </>}
      </div>
    </div>;
};
export default AnonymousChat;