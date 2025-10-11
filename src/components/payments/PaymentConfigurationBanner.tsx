import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";

interface PaymentConfigurationBannerProps {
  isOwner: boolean;
  hasUpiConfigured: boolean;
}

export const PaymentConfigurationBanner = ({ isOwner, hasUpiConfigured }: PaymentConfigurationBannerProps) => {
  const navigate = useNavigate();

  if (!isOwner || hasUpiConfigured) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-900 mb-1">
              Payment Settings Required
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              To receive rent payments from your tenants, you need to configure your UPI details first.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/profile')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Configure Payment Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};