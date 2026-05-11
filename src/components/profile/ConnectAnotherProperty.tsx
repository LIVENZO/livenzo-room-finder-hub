import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { sendCollaborationRequest } from '@/services/collaborationService';

const ConnectAnotherProperty: React.FC = () => {
  const [propertyId, setPropertyId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = propertyId.trim().toLowerCase();
    if (id.length < 3 || id.length > 10) {
      toast.error('Enter a valid Property Owner ID (3–10 characters)');
      return;
    }
    setSending(true);
    try {
      await sendCollaborationRequest(id);
      toast.success('🎉 Collaboration request sent. The property owner will review it.');
      setPropertyId('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send collaboration request');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Connect With Another Property</CardTitle>
            <CardDescription className="text-sm">
              Send a collaboration request to another property owner
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collab-property-id" className="text-sm font-medium">
              Property Owner ID
            </Label>
            <Input
              id="collab-property-id"
              placeholder="e.g. abc123xy"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              maxLength={10}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={sending}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Once accepted, the owner can assign you as Manager or Viewer.
            </p>
          </div>
          <Button
            type="submit"
            disabled={sending || !propertyId.trim()}
            className="w-full h-11"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConnectAnotherProperty;
