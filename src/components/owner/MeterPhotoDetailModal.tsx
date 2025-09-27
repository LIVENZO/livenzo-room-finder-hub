import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Camera, Calendar, Calculator, IndianRupee, User, ImageIcon } from "lucide-react";
import { MeterPhoto } from "../dashboard/rent-management/ActiveRentersList";
import { supabase } from "@/integrations/supabase/client";

interface ElectricityBillData {
  amount: number;
  created_at: string;
}

interface MeterPhotoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  renterName: string;
  relationshipId: string;
  meterPhotos: MeterPhoto[];
}

export const MeterPhotoDetailModal = ({
  isOpen,
  onClose,
  renterName,
  relationshipId,
  meterPhotos
}: MeterPhotoDetailModalProps) => {
  const [electricityBillData, setElectricityBillData] = useState<ElectricityBillData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch electricity bill data when modal opens
  useEffect(() => {
    if (isOpen && relationshipId) {
      fetchElectricityBillData();
    }
  }, [isOpen, relationshipId]);

  const fetchElectricityBillData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get the most recent payment for this relationship in current month
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('relationship_id', relationshipId)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && payments && payments.length > 0) {
        setElectricityBillData({
          amount: parseFloat(payments[0].amount.toString()),
          created_at: payments[0].created_at
        });
      }
    } catch (error) {
      console.error('Error fetching electricity bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Meter Photo Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Renter Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{renterName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Bills
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meter Photos Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold">Meter Photos</h4>
                <Badge variant="outline" className="ml-auto">
                  {meterPhotos.length} photo{meterPhotos.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {meterPhotos.length > 0 ? (
                <div className="space-y-3">
                  {meterPhotos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={photo.photo_url}
                            alt="Meter reading"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(photo.photo_url, '_blank')}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Uploaded on {formatDate(photo.created_at)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            File: {photo.photo_name} • {(photo.file_size / 1024 / 1024).toFixed(2)}MB
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {photo.billing_month}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">No meter photo uploaded</h3>
                  <p className="text-sm text-muted-foreground">
                    The renter hasn't uploaded a meter photo for this month yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Electric Bill Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold">Electric Bill Information</h4>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ) : electricityBillData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Total Amount</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ₹{electricityBillData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {formatDate(electricityBillData.created_at)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calculator className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No electric bill amount recorded for this month
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};