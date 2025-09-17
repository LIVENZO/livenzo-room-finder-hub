import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";

interface RenterPaymentStatusProps {
  ownerUpiConfigured: boolean;
  ownerName?: string;
}

export const RenterPaymentStatus = ({ ownerUpiConfigured, ownerName = "your owner" }: RenterPaymentStatusProps) => {
  if (ownerUpiConfigured) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-orange-900 mb-1">
              Payment Setup Pending
            </h3>
            <p className="text-sm text-orange-700">
              {ownerName} needs to configure their payment settings before you can make rent payments through the app. 
              Please contact them to set up their UPI details.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};