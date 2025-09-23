import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Bell, TestTube } from 'lucide-react';
import { NotificationNavigationService } from '@/services/NotificationNavigationService';

export const NotificationTester: React.FC = () => {
  const [firebaseUid, setFirebaseUid] = useState('');
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test notification from Livenzo app!');
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!firebaseUid.trim() || !title.trim() || !body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-to-user', {
        body: {
          firebase_uid: firebaseUid,
          title: title,
          body: body,
          data: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast.error('Failed to send notification: ' + error.message);
      } else {
        console.log('Notification sent successfully:', data);
        toast.success('Notification sent successfully!');
      }
    } catch (err) {
      console.error('Exception sending notification:', err);
      toast.error('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testCurrentUser = async () => {
    if ((window as any).Android) {
      const currentUID = (window as any).Android.getCurrentUserUID();
      if (currentUID) {
        setFirebaseUid(currentUID);
        toast.success('Current user UID loaded');
      } else {
        toast.error('No current user found');
      }
    } else {
      toast.error('Android interface not available');
    }
  };

  const testNotificationNavigation = (type: string) => {
    let testData;
    
    switch (type) {
      case 'payment_delay':
        testData = {
          type: 'payment_delay',
          payment_id: "test-payment-123",
          deep_link_url: "https://livenzo-room-finder-hub.lovable.app/payments"
        };
        break;
      case 'owner_notice':
        testData = {
          type: 'notice',
          notice_id: "test-notice-456",
          deep_link_url: "https://livenzo-room-finder-hub.lovable.app/notice?id=test-notice-456"
        };
        break;
      case 'complaint':
        testData = {
          type: 'complaint',
          complaint_id: "test-complaint-789",
          relationship_id: "test-relationship-abc",
          deep_link_url: "https://livenzo-room-finder-hub.lovable.app/connections"
        };
        break;
      case 'connection_request':
        testData = {
          type: 'connection_request',
          deep_link_url: "https://livenzo-room-finder-hub.lovable.app/connections"
        };
        break;
      case 'document':
        testData = {
          type: 'document',
          deep_link_url: "https://livenzo-room-finder-hub.lovable.app/connections"
        };
        break;
      default:
        testData = { type, deep_link_url: "https://livenzo-room-finder-hub.lovable.app/dashboard" };
    }
    
    console.log('🧪 Testing notification navigation with:', testData);
    NotificationNavigationService.handleNotificationTap(testData);
    toast.success(`Testing ${type} notification navigation`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Notification Tester</CardTitle>
        <CardDescription>
          Test sending push notifications to users
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="firebase-uid" className="text-sm font-medium">
            Firebase UID
          </label>
          <div className="flex gap-2">
            <Input
              id="firebase-uid"
              placeholder="Enter Firebase UID"
              value={firebaseUid}
              onChange={(e) => setFirebaseUid(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={testCurrentUser}
              disabled={isLoading}
            >
              Current User
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            Message
          </label>
          <Textarea
            id="body"
            placeholder="Notification message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>
        
        <Button 
          onClick={sendTestNotification} 
          disabled={!firebaseUid.trim() || !title.trim() || !body.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Send className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </>
          )}
        </Button>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Test Notification Navigation (Web Preview)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => testNotificationNavigation('payment_delay')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <TestTube className="mr-1 h-3 w-3" />
              Payment
            </Button>
            <Button 
              onClick={() => testNotificationNavigation('owner_notice')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <TestTube className="mr-1 h-3 w-3" />
              Notice
            </Button>
            <Button 
              onClick={() => testNotificationNavigation('complaint')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <TestTube className="mr-1 h-3 w-3" />
              Complaint
            </Button>
            <Button 
              onClick={() => testNotificationNavigation('connection_request')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <TestTube className="mr-1 h-3 w-3" />
              Request
            </Button>
            <Button 
              onClick={() => testNotificationNavigation('document')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <TestTube className="mr-1 h-3 w-3" />
              Document
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Make sure the user has the app installed and FCM token registered
        </div>
      </CardContent>
    </Card>
  );
};