import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Upload, Save, Trash2, QrCode, Check } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface OwnerUpiDetails {
  id: string;
  upi_id: string;
  qr_code_url?: string;
  qr_code_file_name?: string;
  is_active: boolean;
}
export const OwnerUpiSettings = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [upiDetails, setUpiDetails] = useState<OwnerUpiDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [upiPhone, setUpiPhone] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  useEffect(() => {
    fetchUpiDetails();
  }, [user]);
  const fetchUpiDetails = async () => {
    if (!user) {
      console.log('No user found, cannot fetch UPI details');
      setLoading(false);
      return;
    }
    console.log('Fetching UPI details for user:', user.id);
    try {
      const {
        data,
        error
      } = await supabase.from('owner_upi_details').select('*').eq('owner_id', user.id).eq('is_active', true).maybeSingle();
      console.log('UPI fetch result:', {
        data,
        error
      });
      if (error) throw error;
      if (data) {
        setUpiDetails(data);
        setUpiId(data.upi_id);
      }

      // Fetch phone number from user profile
      const {
        data: profile,
        error: profileError
      } = await supabase.from('user_profiles').select('upi_phone_number').eq('id', user.id).maybeSingle();
      if (!profileError && profile) {
        setUpiPhone(profile.upi_phone_number || "");
      }
    } catch (error: any) {
      console.error('Error fetching UPI details:', error);
      if (error?.message?.includes('row-level security')) {
        toast({
          description: "Please log in to access UPI settings",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleQrFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        console.log('File too large:', file.size);
        toast({
          description: "QR code image should be less than 2MB",
          variant: "destructive"
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type);
        toast({
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }
      console.log('File validation passed, setting file');
      setQrFile(file);
      toast({
        description: "QR code selected. Click 'Save UPI Details' to upload."
      });
    }
  };
  const handleSave = async () => {
    if (!upiId.trim()) {
      toast({
        description: "Please enter a valid UPI ID",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        description: "Please log in to save UPI details",
        variant: "destructive"
      });
      return;
    }
    console.log('Starting UPI save process for user:', user.id);
    setSaving(true);
    try {
      let qrCodeUrl = upiDetails?.qr_code_url;
      let qrCodeFileName = upiDetails?.qr_code_file_name;

      // Upload new QR code if provided
      if (qrFile) {
        console.log('Starting QR code upload process');

        // Format filename with user ID prefix to match storage policy
        const fileName = `${user.id}/upi-qr-${Date.now()}-${qrFile.name}`;
        console.log('Upload filename:', fileName);

        // Delete old QR code if exists
        if (qrCodeFileName) {
          console.log('Deleting old QR code:', qrCodeFileName);
          const {
            error: deleteError
          } = await supabase.storage.from('user-uploads').remove([qrCodeFileName]);
          if (deleteError) {
            console.log('Error deleting old QR code:', deleteError);
          }
        }
        console.log('Uploading new QR code file:', qrFile.name, 'Size:', qrFile.size);
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('user-uploads').upload(fileName, qrFile);
        console.log('Upload result:', {
          uploadData,
          uploadError
        });
        if (uploadError) throw uploadError;
        const {
          data: urlData
        } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
        console.log('Public URL data:', urlData);
        qrCodeUrl = urlData.publicUrl;
        qrCodeFileName = fileName;
        console.log('QR code upload successful, URL:', qrCodeUrl);
      }
      if (upiDetails) {
        // Update existing record
        const {
          error
        } = await supabase.from('owner_upi_details').update({
          upi_id: upiId.trim(),
          qr_code_url: qrCodeUrl,
          qr_code_file_name: qrCodeFileName,
          updated_at: new Date().toISOString()
        }).eq('id', upiDetails.id);
        if (error) throw error;
      } else {
        // Create new record
        const {
          error
        } = await supabase.from('owner_upi_details').insert({
          owner_id: user?.id,
          upi_id: upiId.trim(),
          qr_code_url: qrCodeUrl,
          qr_code_file_name: qrCodeFileName,
          is_active: true
        });
        if (error) throw error;
      }

      // Always update phone number in user profile (optional field)
      const {
        error: profileUpdateError
      } = await supabase.from('user_profiles').update({
        upi_phone_number: upiPhone.trim() || null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
      if (profileUpdateError) throw profileUpdateError;

      // Create Razorpay account for Route if UPI ID is provided and account doesn't exist
      const {
        data: userProfile
      } = await supabase.from('user_profiles').select('razorpay_account_id, full_name').eq('id', user.id).maybeSingle();
      if (!userProfile?.razorpay_account_id && user?.email) {
        try {
          toast({
            description: "Creating payment account..."
          });
          const {
            data: accountData,
            error: accountError
          } = await supabase.functions.invoke('create-owner-account', {
            body: {
              upiId: upiId.trim(),
              ownerName: userProfile?.full_name || 'Property Owner',
              phone: upiPhone.trim() || undefined
            }
          });
          if (accountError) {
            console.error('Error creating Razorpay account:', accountError);
            toast({
              description: "UPI saved but failed to create payment account. Please contact support.",
              variant: "destructive"
            });
          } else {
            console.log('Razorpay account created:', accountData);
            toast({
              description: "UPI details saved and automatic payments enabled!"
            });
          }
        } catch (error) {
          console.error('Error in account creation:', error);
          toast({
            description: "UPI saved but failed to create payment account. Please contact support.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          description: "UPI details saved successfully!"
        });
      }
      setQrFile(null);
      fetchUpiDetails();
    } catch (error: any) {
      console.error('Error saving UPI details:', error);
      let errorMessage = "Failed to save UPI details";
      if (error?.message) {
        if (error.message.includes('row-level security')) {
          errorMessage = "Permission denied. Please ensure you're logged in.";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "UPI details already exist. Please try updating instead.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      toast({
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteQr = async () => {
    if (!upiDetails?.qr_code_file_name) return;
    try {
      // Delete from storage
      await supabase.storage.from('user-uploads').remove([upiDetails.qr_code_file_name]);

      // Update database
      const {
        error
      } = await supabase.from('owner_upi_details').update({
        qr_code_url: null,
        qr_code_file_name: null,
        updated_at: new Date().toISOString()
      }).eq('id', upiDetails.id);
      if (error) throw error;
      toast({
        description: "QR code deleted successfully!"
      });
      fetchUpiDetails();
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({
        description: "Failed to delete QR code",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          UPI Payment Settings
        </CardTitle>
        
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UPI ID Setup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="upiId">UPI ID</Label>
            {upiDetails && <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Check className="h-3 w-3 mr-1" />
                Active
              </Badge>}
          </div>
          <Input id="upiId" placeholder="yourname@paytm / yourname@phonepe" value={upiId} onChange={e => setUpiId(e.target.value)} />
          <p className="text-sm text-muted-foreground">
            Enter your UPI ID that renters will use for direct payments
          </p>
        </div>

        {/* UPI Phone Number (optional) */}
        <div className="space-y-3">
          <Label htmlFor="upiPhone">UPI Phone Number (optional)</Label>
          <Input id="upiPhone" type="tel" placeholder="Enter registered UPI phone number" value={upiPhone} onChange={e => setUpiPhone(e.target.value)} />
          <p className="text-sm text-muted-foreground">
            This helps renters verify your UPI ID and receive SMS confirmations.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="space-y-3">
          <Label>UPI QR Code (Optional)</Label>
          
          {upiDetails?.qr_code_url ? <div className="space-y-3">
              <div className="flex items-center gap-4">
                <img src={upiDetails.qr_code_url} alt="UPI QR Code" className="w-24 h-24 object-contain border rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Current QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    Renters can scan this to pay directly
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDeleteQr} className="mt-2">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove QR
                  </Button>
                </div>
              </div>
            </div> : null}

          <div className="space-y-2">
            <Input type="file" accept="image/*" onChange={handleQrFileUpload} className="hidden" id="qrUpload" />
            <Button variant="outline" onClick={() => document.getElementById('qrUpload')?.click()} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {qrFile ? `Selected: ${qrFile.name}` : upiDetails?.qr_code_url ? "Replace QR Code" : "Upload QR Code"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Upload your UPI QR code image (max 2MB). Renters can scan this to pay.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving || !upiId.trim()} className="w-full">
          {saving ? <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </> : <>
              <Save className="h-4 w-4 mr-2" />
              Save UPI Details
            </>}
        </Button>

        {/* Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex gap-2">
            <QrCode className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">How it works:</p>
              <ul className="text-blue-700 mt-1 space-y-1">
                <li>• Renters can pay directly to your UPI ID</li>
                <li>• No processing fees for you or renters</li>
                <li>• Payments require manual verification</li>
                <li>• You'll receive notification for new submissions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};