import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Camera, Calendar, Calculator, IndianRupee, User, ImageIcon } from "lucide-react";
import { MeterPhoto } from "../dashboard/rent-management/ActiveRentersList";
import { supabase } from "@/integrations/supabase/client";

interface ElectricityBillData {
  billing_month: string;
  amount: number;
}

interface MeterPhotoWithBill extends MeterPhoto {
  electricBillAmount?: number;
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
  const [photosWithBills, setPhotosWithBills] = useState<MeterPhotoWithBill[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch electricity bill data and prepare photos when modal opens
  useEffect(() => {
    if (isOpen && relationshipId) {
      preparePhotosWithBills();
    }
  }, [isOpen, relationshipId, meterPhotos]);

  const preparePhotosWithBills = async () => {
    setLoading(true);
    try {
      // Get only the latest photo per month
      const photosByMonth = new Map<string, MeterPhoto>();
      
      meterPhotos.forEach(photo => {
        const existingPhoto = photosByMonth.get(photo.billing_month);
        if (!existingPhoto || new Date(photo.created_at) > new Date(existingPhoto.created_at)) {
          photosByMonth.set(photo.billing_month, photo);
        }
      });

      const latestPhotos = Array.from(photosByMonth.values());

      // Fetch all electric bill amounts for these months
      const { data: payments, error } = await supabase
        .from('payments')
        .select('electric_bill_amount, billing_month')
        .eq('relationship_id', relationshipId)
        .not('electric_bill_amount', 'is', null)
        .in('billing_month', latestPhotos.map(p => p.billing_month));

      if (!error && payments) {
        // Create a map of billing_month to electric_bill_amount
        const billMap = new Map<string, number>();
        payments.forEach(payment => {
          if (!billMap.has(payment.billing_month)) {
            billMap.set(payment.billing_month, parseFloat(payment.electric_bill_amount.toString()));
          }
        });

        // Combine photos with their electric bill amounts
        const combined = latestPhotos.map(photo => ({
          ...photo,
          electricBillAmount: billMap.get(photo.billing_month)
        }));

        // Sort by billing_month descending (most recent first)
        combined.sort((a, b) => b.billing_month.localeCompare(a.billing_month));
        
        setPhotosWithBills(combined);
      } else {
        setPhotosWithBills(latestPhotos);
      }
    } catch (error) {
      console.error('Error fetching electricity bill data:', error);
      setPhotosWithBills(meterPhotos);
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
                  {photosWithBills.length} photo{photosWithBills.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-24 bg-muted rounded"></div>
                </div>
              ) : photosWithBills.length > 0 ? (
                <div className="space-y-3">
                  {photosWithBills.map((photo) => (
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
                          {photo.electricBillAmount !== undefined ? (
                            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                              ⚡ Electric Bill: ₹{photo.electricBillAmount.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              No electric bill recorded
                            </div>
                          )}
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
                    The renter hasn't uploaded a meter photo yet.
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