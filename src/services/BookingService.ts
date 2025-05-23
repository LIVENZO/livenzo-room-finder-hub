
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string | null;
  move_in_date: string | null;
  created_at: string;
  updated_at: string;
  renter_phone?: string;
  renter_name?: string;
}

export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'renter_phone' | 'renter_name'>): Promise<Booking | null> => {
  try {
    // First, get the renter's profile information
    const { data: renterProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("phone, full_name")
      .eq("id", booking.user_id)
      .single();

    if (profileError) {
      console.error("Error fetching renter profile:", profileError);
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to send booking request");
      console.error("Error creating booking:", error);
      return null;
    }

    // Type cast to ensure the status is one of the allowed values and include renter info
    const typedBooking = {
      ...data,
      status: data.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
      renter_phone: renterProfile?.phone || undefined,
      renter_name: renterProfile?.full_name || undefined
    };

    toast.success("Booking request sent successfully");
    return typedBooking;
  } catch (error) {
    toast.error("Failed to send booking request");
    console.error("Exception creating booking:", error);
    return null;
  }
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user bookings:", error);
      return [];
    }

    // Type cast each booking to ensure status is of the correct type
    return (data || []).map(booking => ({
      ...booking,
      status: booking.status as 'pending' | 'approved' | 'rejected' | 'cancelled'
    }));
  } catch (error) {
    console.error("Exception fetching user bookings:", error);
    return [];
  }
};

export const fetchOwnerBookings = async (ownerId: string): Promise<Booking[]> => {
  try {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", ownerId);

    if (bookingsError) {
      console.error("Error fetching owner bookings:", bookingsError);
      return [];
    }

    // Fetch renter profiles for all bookings
    const bookingsWithRenterInfo = await Promise.all(
      (bookingsData || []).map(async (booking) => {
        const { data: renterProfile } = await supabase
          .from("user_profiles")
          .select("phone, full_name")
          .eq("id", booking.user_id)
          .single();

        return {
          ...booking,
          status: booking.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
          renter_phone: renterProfile?.phone || undefined,
          renter_name: renterProfile?.full_name || undefined
        };
      })
    );

    return bookingsWithRenterInfo;
  } catch (error) {
    console.error("Exception fetching owner bookings:", error);
    return [];
  }
};

export const updateBookingStatus = async (
  bookingId: string, 
  status: 'approved' | 'rejected' | 'cancelled'
): Promise<Booking | null> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to update booking status");
      console.error("Error updating booking status:", error);
      return null;
    }

    // Type cast to ensure the status is one of the allowed values
    const typedBooking = {
      ...data,
      status: data.status as 'pending' | 'approved' | 'rejected' | 'cancelled'
    };

    toast.success(`Booking ${status} successfully`);
    return typedBooking;
  } catch (error) {
    toast.error("Failed to update booking status");
    console.error("Exception updating booking status:", error);
    return null;
  }
};
