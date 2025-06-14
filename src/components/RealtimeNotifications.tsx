
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_sale' | 'sale_approved' | 'sale_completed';
  timestamp: Date;
  dismissed: boolean;
}

export const RealtimeNotifications: React.FC = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase
      .channel('notification-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const sale = payload.new as any;
          let notification: Notification | null = null;

          if (payload.eventType === 'INSERT') {
            // Show to accountants and managers when new sales are created
            if (profile.role === 'accountant' || profile.role === 'manager' || profile.role === 'director') {
              notification = {
                id: `${sale.id}-new`,
                title: 'New Sale Created',
                message: `${sale.department.toUpperCase()} sale: UGX ${Number(sale.total).toLocaleString()}`,
                type: 'new_sale',
                timestamp: new Date(),
                dismissed: false,
              };
            }
          } else if (payload.eventType === 'UPDATE') {
            if (sale.status === 'accountant_approved' && (profile.role === 'manager' || profile.role === 'director')) {
              notification = {
                id: `${sale.id}-approved`,
                title: 'Sale Needs Manager Approval',
                message: `${sale.department.toUpperCase()} sale: UGX ${Number(sale.total).toLocaleString()}`,
                type: 'sale_approved',
                timestamp: new Date(),
                dismissed: false,
              };
            } else if (sale.status === 'approved') {
              notification = {
                id: `${sale.id}-completed`,
                title: 'Sale Fully Approved',
                message: `${sale.department.toUpperCase()} sale: UGX ${Number(sale.total).toLocaleString()}`,
                type: 'sale_completed',
                timestamp: new Date(),
                dismissed: false,
              };
            }
          }

          if (notification) {
            setNotifications(prev => [notification!, ...prev.slice(0, 9)]); // Keep latest 10
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.dismissed).length;

  if (!user || !profile) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative bg-white shadow-lg"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {isExpanded && (
          <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto shadow-xl">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Live Updates</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent updates</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className="border rounded p-3 bg-blue-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
