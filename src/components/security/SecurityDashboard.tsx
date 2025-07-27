import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details: Record<string, any>;
}

const SecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    lastHourEvents: 0,
    blockedAttempts: 0
  });

  useEffect(() => {
    loadSecurityEvents();
    // Refresh every 30 seconds
    const interval = setInterval(loadSecurityEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityEvents = () => {
    try {
      // Load from localStorage (in production, this would come from a secure API)
      const storedEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      const recentEvents = storedEvents
        .sort((a: SecurityEvent, b: SecurityEvent) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 50); // Show last 50 events

      setEvents(recentEvents);

      // Calculate stats
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const stats = {
        totalEvents: storedEvents.length,
        criticalEvents: storedEvents.filter((e: SecurityEvent) => e.severity === 'critical').length,
        lastHourEvents: storedEvents.filter((e: SecurityEvent) => 
          new Date(e.timestamp) > oneHourAgo
        ).length,
        blockedAttempts: storedEvents.filter((e: SecurityEvent) => 
          e.event_type === 'suspicious_activity' || 
          e.event_type === 'unauthorized_access'
        ).length
      };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  };

  const clearEvents = () => {
    localStorage.removeItem('security_events');
    setEvents([]);
    setStats({ totalEvents: 0, criticalEvents: 0, lastHourEvents: 0, blockedAttempts: 0 });
    toast.success('Security events cleared');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Dashboard
        </h2>
        <div className="flex gap-2">
          <Button onClick={loadSecurityEvents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearEvents} variant="outline" size="sm">
            Clear Events
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Hour</p>
                <p className="text-2xl font-bold">{stats.lastHourEvents}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Attempts</p>
                <p className="text-2xl font-bold text-orange-500">{stats.blockedAttempts}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events recorded
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{event.event_type}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(event.details, null, 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Regularly monitor security events and investigate any suspicious activity.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Consider implementing additional security measures if you see frequent critical events.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;