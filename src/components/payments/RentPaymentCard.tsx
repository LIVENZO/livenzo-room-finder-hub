import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CreditCard, AlertCircle } from "lucide-react";
import { PayRentButton } from "./PayRentButton";
import { format } from "date-fns";

interface RentPaymentCardProps {
  relationshipId?: string;
  amount: number;
  dueDate?: string;
  status?: string;
  ownerName?: string;
  propertyName?: string;
}

export const RentPaymentCard = ({
  relationshipId,
  amount,
  dueDate,
  status = 'pending',
  ownerName,
  propertyName
}: RentPaymentCardProps) => {
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'paid';
  const isDueSoon = dueDate && new Date(dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && status !== 'paid';

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`${isOverdue ? 'border-red-200 bg-red-50' : isDueSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Monthly Rent Payment
          </div>
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {ownerName && (
          <div>
            <p className="text-sm text-muted-foreground">Property Owner</p>
            <p className="font-medium">{ownerName}</p>
          </div>
        )}

        {propertyName && (
          <div>
            <p className="text-sm text-muted-foreground">Property</p>
            <p className="font-medium">{propertyName}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-bold">₹{amount.toLocaleString()}</p>
          </div>
          
          {dueDate && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Due Date
              </p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : ''}`}>
                {format(new Date(dueDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        {isOverdue && (
          <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">This payment is overdue!</p>
          </div>
        )}

        {isDueSoon && !isOverdue && (
          <div className="flex items-center gap-2 p-3 bg-yellow-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">Payment due soon!</p>
          </div>
        )}

        {status !== 'paid' && (
          <PayRentButton 
            amount={amount}
            relationshipId={relationshipId || 'temp'}
            className="w-full"
          />
        )}
      </CardContent>
    </Card>
  );
};