
import React from 'react';
import { Inbox, Users } from 'lucide-react';

interface EmptyStateProps {
  type: 'requests' | 'connected';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const content = {
    requests: {
      title: 'No pending requests',
      description: 'New connection requests from renters will show up here.',
      Icon: Inbox,
    },
    connected: {
      title: 'No connected renters yet',
      description: 'Once you accept a request, your renters will appear here.',
      Icon: Users,
    },
  };

  const { title, description, Icon } = content[type];

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default EmptyState;
