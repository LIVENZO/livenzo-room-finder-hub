import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  Check, 
  X, 
  Eye, 
  Calendar, 
  User, 
  CreditCard,
  MessageSquare,
  Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ManualPayment {
  id: string;
  renter_id: string;
  amount: number;
  transaction_id: string;
  proof_image_url?: string;
  status: string;
  notes?: string;
  submitted_at: string;
  verified_at?: string;
  relationship_id: string;
  relationships?: {
    user_profiles?: {
      full_name: string;
    };
  };
}

export const ManualPaymentVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchManualPayments();
  }, [user]);

  const fetchManualPayments = async () => {
    if (!user) return;

    try {
      // First get manual payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('manual_payments')
        .select('*')
        .eq('owner_id', user.id)
        .order('submitted_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Then get renter names for each payment
      const paymentsWithNames = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', payment.renter_id)
            .maybeSingle();

          return {
            ...payment,
            relationships: {
              user_profiles: {
                full_name: profileData?.full_name || 'Unknown Renter'
              }
            }
          };
        })
      );

      setPayments(paymentsWithNames);
    } catch (error) {
      console.error('Error fetching manual payments:', error);
      toast({ description: "Failed to fetch payment submissions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
    setVerifying(true);
    try {
      const updateData: any = {
        status,
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (verificationNotes.trim()) {
        updateData.notes = verificationNotes.trim();
      }

      const { error } = await supabase
        .from('manual_payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // If verified, also update rent status to paid
      if (status === 'verified' && selectedPayment) {
        const { error: rentError } = await supabase
          .from('rent_status')
          .update({ 
            status: 'paid',
            last_payment_id: paymentId,
            updated_at: new Date().toISOString()
          })
          .eq('relationship_id', selectedPayment.relationship_id);

        if (rentError) {
          console.error('Error updating rent status:', rentError);
          // Don't throw here as payment verification was successful
        }
      }

      toast({ 
        description: status === 'verified' 
          ? "Payment verified and rent marked as paid!" 
          : "Payment rejected successfully" 
      });

      setShowDetailsModal(false);
      setSelectedPayment(null);
      setVerificationNotes("");
      fetchManualPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({ description: "Failed to verify payment", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const openDetailsModal = (payment: ManualPayment) => {
    setSelectedPayment(payment);
    setVerificationNotes("");
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manual Payment Verification</span>
            <Badge variant="outline">
              {payments.filter(p => p.status === 'pending').length} Pending
            </Badge>
          </CardTitle>
          <CardDescription>
            Review and verify UPI direct payments submitted by your renters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Renters will be able to submit UPI payment proofs here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {payment.relationships?.user_profiles?.full_name || 'Unknown Renter'}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          ₹{payment.amount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(payment.submitted_at), 'MMM dd, yyyy')}
                        </span>
                        {payment.proof_image_url && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Screenshot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsModal(payment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Verification</DialogTitle>
            <DialogDescription>
              Review the payment details and verify the transaction
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Renter</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.relationships?.user_profiles?.full_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    ₹{selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Transaction ID</Label>
                  <p className="text-sm text-muted-foreground break-all">
                    {selectedPayment.transaction_id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedPayment.submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {/* Renter Notes */}
              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium">Renter Notes</Label>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}

              {/* Proof Image */}
              {selectedPayment.proof_image_url && (
                <div>
                  <Label className="text-sm font-medium">Payment Screenshot</Label>
                  <div className="mt-2">
                    <img
                      src={selectedPayment.proof_image_url}
                      alt="Payment proof"
                      className="max-w-full h-auto border rounded-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              )}

              {/* Verification Notes */}
              {selectedPayment.status === 'pending' && (
                <div className="space-y-2">
                  <Label htmlFor="verificationNotes">Verification Notes (Optional)</Label>
                  <Textarea
                    id="verificationNotes"
                    placeholder="Add any notes about this verification..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {selectedPayment.status === 'pending' ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleVerifyPayment(selectedPayment.id, 'rejected')}
                    disabled={verifying}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleVerifyPayment(selectedPayment.id, 'verified')}
                    disabled={verifying}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {verifying ? "Verifying..." : "Verify & Mark Paid"}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This payment has been {selectedPayment.status}
                    {selectedPayment.verified_at && 
                      ` on ${format(new Date(selectedPayment.verified_at), 'MMM dd, yyyy HH:mm')}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};