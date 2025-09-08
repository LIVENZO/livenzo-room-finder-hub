
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { sendNoticeToRenter, fetchOwnerConnections } from '@/services/NoticeService';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface SendNoticeFormProps {
  ownerId: string;
}

const SendNoticeForm: React.FC<SendNoticeFormProps> = ({ ownerId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedRenterId, setSelectedRenterId] = useState<string>('');
  const [renters, setRenters] = useState<{ id: string; name: string }[]>([]);
  const [loadingRenters, setLoadingRenters] = useState<boolean>(true);

  useEffect(() => {
    const loadRenters = async () => {
      try {
        setLoadingRenters(true);
        const renterIds = await fetchOwnerConnections(ownerId);
        if (renterIds.length === 0) {
          setRenters([]);
          return;
        }
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', renterIds);
        if (error) {
          console.error('Error fetching renter profiles:', error);
          setRenters(renterIds.map((id) => ({ id, name: id })));
        } else {
          setRenters(
            (data || []).map((p: any) => ({ id: p.id, name: p.full_name || p.id }))
          );
        }
      } finally {
        setLoadingRenters(false);
      }
    };
    loadRenters();
  }, [ownerId]);

  const handleSendNotice = async () => {
    if (!message.trim() || !selectedRenterId) {
      return;
    }

    setIsSending(true);
    try {
      await sendNoticeToRenter(ownerId, selectedRenterId, message);
      setMessage(''); // Clear the form after attempt
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notice</CardTitle>
        <CardDescription>
          Send a notice to a selected renter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select
            value={selectedRenterId}
            onValueChange={(v) => setSelectedRenterId(v)}
            disabled={loadingRenters || isSending}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingRenters ? 'Loading renters...' : 'Select renter'} />
            </SelectTrigger>
            <SelectContent>
              {renters.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Type your notice message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
            disabled={isSending}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSendNotice}
          disabled={!message.trim() || !selectedRenterId || isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Notice'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SendNoticeForm;
