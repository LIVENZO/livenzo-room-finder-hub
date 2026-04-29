import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';

interface FormState {
  hostel_pg_name: string;
  accommodation_type: string;
  house_number: string;
  property_name: string;
  property_location: string;
  total_rental_rooms: string;
  resident_type: string;
  upi_phone_number: string;
  upi_id: string;
  razorpay_merchant_id: string;
}

const initialState: FormState = {
  hostel_pg_name: '',
  accommodation_type: '',
  house_number: '',
  property_name: '',
  property_location: '',
  total_rental_rooms: '',
  resident_type: '',
  upi_phone_number: '',
  upi_id: '',
  razorpay_merchant_id: '',
};

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { refresh, setActivePropertyId } = useOwnerProperty();
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (userRole !== 'owner') {
      toast.error('Only property owners can add properties');
      navigate('/dashboard');
    }
  }, [user, userRole, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.hostel_pg_name.trim()) {
      toast.error('Please enter the hostel/PG name');
      return;
    }
    if (!form.accommodation_type) {
      toast.error('Please select accommodation type');
      return;
    }
    if (!form.house_number.trim()) {
      toast.error('Please enter the house number');
      return;
    }
    if (!form.property_location.trim()) {
      toast.error('Please enter the property location');
      return;
    }
    if (!form.upi_phone_number.trim()) {
      toast.error('Please enter your UPI phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('add_owner_property', {
        p_hostel_pg_name: form.hostel_pg_name.trim(),
        p_accommodation_type: form.accommodation_type || null,
        p_house_number: form.house_number.trim() || null,
        p_property_name: form.property_name.trim() || form.hostel_pg_name.trim(),
        p_property_location: form.property_location.trim() || null,
        p_total_rental_rooms: form.total_rental_rooms ? parseInt(form.total_rental_rooms, 10) : null,
        p_resident_type: form.resident_type || null,
        p_upi_id: form.upi_id.trim() || null,
        p_upi_phone_number: form.upi_phone_number.trim() || null,
        p_razorpay_merchant_id: form.razorpay_merchant_id.trim() || null,
      });

      if (error) {
        console.error('add_owner_property failed:', error);
        toast.error('Could not add property. Please try again.');
        return;
      }

      toast.success('Property added successfully');
      await refresh();

      // Switch to the new property
      const newRow = (data as any) as { id?: string } | null;
      if (newRow?.id) {
        setActivePropertyId(newRow.id);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error adding property:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add a new property</h1>
              <p className="text-sm text-muted-foreground">
                Manage another PG or hostel from the same account.
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-soft">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="hostel_pg_name">
                    Hostel/PG Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hostel_pg_name"
                    name="hostel_pg_name"
                    value={form.hostel_pg_name}
                    onChange={handleChange}
                    placeholder="e.g. Krishna PG"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>
                    Accommodation Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.accommodation_type}
                    onValueChange={(v) => handleSelect('accommodation_type', v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PG">PG</SelectItem>
                      <SelectItem value="Hostel">Hostel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="house_number">
                    House Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="house_number"
                    name="house_number"
                    value={form.house_number}
                    onChange={handleChange}
                    placeholder="e.g. 5468"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="property_location">
                    Property Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="property_location"
                    name="property_location"
                    value={form.property_location}
                    onChange={handleChange}
                    placeholder="Enter address / area"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="total_rental_rooms">Total Rooms</Label>
                    <Input
                      id="total_rental_rooms"
                      name="total_rental_rooms"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={form.total_rental_rooms}
                      onChange={handleChange}
                      placeholder="e.g. 24"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Resident Type</Label>
                    <Select
                      value={form.resident_type}
                      onValueChange={(v) => handleSelect('resident_type', v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boys">Boys</SelectItem>
                        <SelectItem value="Girls">Girls</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="upi_phone_number">
                    UPI Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="upi_phone_number"
                    name="upi_phone_number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.upi_phone_number}
                    onChange={handleChange}
                    placeholder="10-digit phone linked to UPI"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="upi_id">UPI ID (optional)</Label>
                  <Input
                    id="upi_id"
                    name="upi_id"
                    value={form.upi_id}
                    onChange={handleChange}
                    placeholder="yourname@paytm"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="razorpay_merchant_id">Razorpay Merchant ID (optional)</Label>
                  <Input
                    id="razorpay_merchant_id"
                    name="razorpay_merchant_id"
                    value={form.razorpay_merchant_id}
                    onChange={handleChange}
                    placeholder="From Razorpay dashboard"
                    className="h-11 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-base font-semibold mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding property...
                    </>
                  ) : (
                    'Add Property'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AddProperty;
