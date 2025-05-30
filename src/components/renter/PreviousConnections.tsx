
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Archive, 
  Calendar,
  Home,
  FileText
} from 'lucide-react';
import { fetchArchivedRenterRelationships } from '@/services/relationship/fetchRenterRelationships';
import { Relationship } from '@/types/relationship';
import { format } from 'date-fns';

interface PreviousConnectionsProps {
  renterId: string;
}

const PreviousConnections: React.FC<PreviousConnectionsProps> = ({ renterId }) => {
  const [archivedRelationships, setArchivedRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadArchivedRelationships();
  }, [renterId]);

  const loadArchivedRelationships = async () => {
    try {
      setLoading(true);
      const archived = await fetchArchivedRenterRelationships(renterId);
      setArchivedRelationships(archived);
    } catch (error) {
      console.error('Error loading archived relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-gray-400 animate-pulse" />
            <span className="text-gray-500">Loading previous connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (archivedRelationships.length === 0) {
    return null; // Don't show the section if there are no archived connections
  }

  return (
    <Card className="border-gray-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Previous Connections</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {archivedRelationships.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {archivedRelationships.map((relationship) => (
              <div 
                key={relationship.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={relationship.owner?.avatar_url || ''} />
                    <AvatarFallback className="bg-gray-200">
                      <Home className="h-6 w-6 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {relationship.owner?.full_name || 'Former Owner'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Connected: {format(new Date(relationship.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {relationship.updated_at !== relationship.created_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>
                          Ended: {format(new Date(relationship.updated_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-gray-600">
                    <FileText className="h-3 w-3 mr-1" />
                    Archived
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-3">
              <strong>Note:</strong> These are your previous rental connections. 
              Documents and chat history from these connections are archived and no longer active.
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PreviousConnections;
