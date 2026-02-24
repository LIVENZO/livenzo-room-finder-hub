
import * as z from 'zod';

export const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  house_no: z.string().optional(),
  house_name: z.string().optional(),
  room_number: z.string().optional(),
  location: z.string().min(5, "Location must be at least 5 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  gender: z.enum(['male', 'female', 'any'], { required_error: "Please select a gender preference" }),
  roomType: z.enum(['single', 'sharing'], { required_error: "Please select a room type" }),
  coolingType: z.enum(['ac', 'cooler', 'none'], { required_error: "Please select a cooling type" }),
  food: z.enum(['included', 'not_included'], { required_error: "Please select a food option" }),
  wifi: z.enum(['yes', 'no'], { required_error: "Please select WiFi availability" }),
  bathroom: z.enum(['yes', 'no'], { required_error: "Please select bathroom option" }),
  laundry: z.enum(['yes', 'no'], { required_error: "Please select laundry option" }),
  electricBill: z.enum(['yes', 'no'], { required_error: "Please select electric bill option" }),
  owner_phone: z.string().min(10, "Phone number must be valid"),
});

export type FormValues = z.infer<typeof formSchema>;
