
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { sendNoticeToAllRenters } from '@/services/NoticeService';
import { Loader2 } from 'lucide-react';

interface SendNoticeFormProps {
  ownerId: string;
}

const SendNoticeForm: React.FC<SendNoticeFormProps> = ({ ownerId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotice = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await sendNoticeToAllRenters(ownerId, message);
      setMessage(''); // Clear the form after successful send
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notice</CardTitle>
        <CardDescription>
          Send a notice to all your connected renters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your notice message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px]"
          disabled={isSending}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSendNotice}
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send to All Renters'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SendNoticeForm;
