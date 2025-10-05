import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ElectricityBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (totalAmount: number, electricBillAmount: number) => void;
  rentAmount: number;
}

export const ElectricityBillModal = ({ 
  isOpen, 
  onClose, 
  onContinue,
  rentAmount
}: ElectricityBillModalProps) => {
  const [electricityBill, setElectricityBill] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const billAmount = parseFloat(electricityBill);
    
    if (isNaN(billAmount) || billAmount < 0) {
      toast.error("Please enter a valid electricity bill amount");
      return;
    }

    try {
      setIsSaving(true);
      
      const totalAmount = rentAmount + billAmount;
      
      // Pass both total amount and electric bill amount separately
      toast.success(`Electricity bill (₹${billAmount.toLocaleString()}) added successfully`);
      
      setTimeout(() => {
        onContinue(totalAmount, billAmount);
      }, 500);
      
    } catch (error) {
      console.error('Error saving electricity bill:', error);
      toast.error("⚠️ Could not save bill. Check your network and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setElectricityBill("");
    onClose();
  };

  const totalAmount = rentAmount + (parseFloat(electricityBill) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Add Electricity Bill
          </DialogTitle>
          <DialogDescription>
            Enter your electricity charges to calculate the total amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rent Amount Display */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-lg font-semibold">₹{rentAmount.toLocaleString()}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  (Read-only)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Electricity Bill Input */}
          <div className="space-y-2">
            <Label htmlFor="electricity-bill">Electricity Bill Amount</Label>
            <Input
              id="electricity-bill"
              type="number"
              placeholder="Enter amount (e.g., 1200)"
              value={electricityBill}
              onChange={(e) => setElectricityBill(e.target.value)}
              className="text-lg"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Enter the electricity charges for this month
            </p>
          </div>

          {/* Total Amount Display */}
          {electricityBill && !isNaN(parseFloat(electricityBill)) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Amount to Pay</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rent (₹{rentAmount.toLocaleString()}) + Electricity (₹{parseFloat(electricityBill).toLocaleString()})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={!electricityBill || isNaN(parseFloat(electricityBill)) || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="w-full"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};