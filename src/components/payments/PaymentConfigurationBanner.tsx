import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
interface PaymentConfigurationBannerProps {
  isOwner: boolean;
  hasUpiConfigured: boolean;
}
export const PaymentConfigurationBanner = ({
  isOwner,
  hasUpiConfigured
}: PaymentConfigurationBannerProps) => {
  const navigate = useNavigate();
  if (!isOwner || hasUpiConfigured) {
    return null;
  }
  return;
};