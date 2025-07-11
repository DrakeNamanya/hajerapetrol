import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, Users, DollarSign } from 'lucide-react';
import { useApprovalReminders } from '@/hooks/useApprovalReminders';
import { toast } from "@/hooks/use-toast";

export const ApprovalReminderManager: React.FC = () => {
  const { sendReminder, sending } = useApprovalReminders();

  const handleSendReminder = async (type: 'sales' | 'expenses' | 'purchase_orders') => {
    try {
      await sendReminder(type);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const reminderTypes = [
    {
      type: 'sales' as const,
      title: 'Sales Approvals',
      description: 'Remind accountants and managers about pending sales',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: 'expenses' as const,
      title: 'Expense Approvals',
      description: 'Remind approvers about pending expense requests',
      icon: Clock,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      type: 'purchase_orders' as const,
      title: 'Purchase Orders',
      description: 'Remind managers and directors about purchase order requests',
      icon: Users,
      color: 'bg-green-100 text-green-800'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Approval Reminders
          </CardTitle>
          <p className="text-sm text-gray-600">
            Send email reminders to team members about pending approvals
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reminderTypes.map((reminder) => (
              <Card key={reminder.type} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <reminder.icon className="h-6 w-6 text-gray-600" />
                    <div>
                      <h3 className="font-semibold">{reminder.title}</h3>
                      <p className="text-xs text-gray-500">{reminder.description}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSendReminder(reminder.type)}
                    disabled={sending}
                    className="w-full"
                    size="sm"
                  >
                    {sending ? 'Sending...' : 'Send Reminder'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Reminders Work:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sales: Emails accountants for pending sales, managers for accountant-approved sales</li>
              <li>• Expenses: Emails accountants, managers, and directors based on approval stage</li>
              <li>• Purchase Orders: Emails managers for new requests, directors for manager-approved requests</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};