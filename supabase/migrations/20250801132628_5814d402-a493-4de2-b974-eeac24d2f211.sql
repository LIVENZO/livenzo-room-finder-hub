-- Create anonymous chat sessions table
CREATE TABLE public.anonymous_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create anonymous chat messages table
CREATE TABLE public.anonymous_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.anonymous_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.anonymous_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous_chat_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.anonymous_chat_sessions 
FOR SELECT 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create sessions" 
ON public.anonymous_chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1);

CREATE POLICY "Users can update their sessions" 
ON public.anonymous_chat_sessions 
FOR UPDATE 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Create policies for anonymous_chat_messages
CREATE POLICY "Users can view messages in their sessions" 
ON public.anonymous_chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.anonymous_chat_sessions 
    WHERE id = session_id 
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  )
);

CREATE POLICY "Users can create messages in their sessions" 
ON public.anonymous_chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.anonymous_chat_sessions 
    WHERE id = session_id 
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    AND status = 'active'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_anonymous_sessions_status ON public.anonymous_chat_sessions(status);
CREATE INDEX idx_anonymous_sessions_participant_1 ON public.anonymous_chat_sessions(participant_1);
CREATE INDEX idx_anonymous_sessions_participant_2 ON public.anonymous_chat_sessions(participant_2);
CREATE INDEX idx_anonymous_messages_session_id ON public.anonymous_chat_messages(session_id);
CREATE INDEX idx_anonymous_messages_created_at ON public.anonymous_chat_messages(created_at);

-- Add the tables to the realtime publication for real-time functionality
ALTER publication supabase_realtime ADD TABLE public.anonymous_chat_sessions;
ALTER publication supabase_realtime ADD TABLE public.anonymous_chat_messages;