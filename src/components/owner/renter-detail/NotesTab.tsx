
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';
import { toast } from 'sonner';

const NotesTab: React.FC = () => {
  const [notes, setNotes] = useState('');

  const handleSaveNotes = () => {
    // TODO: Implement notes saving functionality
    toast.success('Notes saved successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add private notes about this renter (only visible to you)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
        />
        <Button onClick={handleSaveNotes}>
          Save Notes
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotesTab;
