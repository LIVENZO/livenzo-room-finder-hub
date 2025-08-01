
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { Complaint } from '@/services/ComplaintService';

interface ComplaintCardProps {
  complaint: Complaint;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <MessageSquare className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive' as const;
      case 'in_progress':
        return 'secondary' as const;
      case 'resolved':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-lg leading-relaxed break-words flex-1">
          {complaint.title}
        </h3>
        <Badge variant={getStatusVariant(complaint.status)} className="flex items-center gap-2 shrink-0 px-3 py-1">
          {getStatusIcon(complaint.status)}
          {getStatusLabel(complaint.status)}
        </Badge>
      </div>
      
      <div className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap p-4 bg-muted/30 rounded-lg">
        {complaint.description}
      </div>
      
      {complaint.response && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-800 mb-3">Owner Response:</p>
          <div className="text-sm text-blue-700 leading-relaxed break-words whitespace-pre-wrap">
            {complaint.response}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
        Submitted on {new Date(complaint.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export default ComplaintCard;
