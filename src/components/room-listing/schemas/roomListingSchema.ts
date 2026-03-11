
import * as z from 'zod';

export const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  house_no: z.string().optional(),
  house_name: z.string().optional(),
  room_number: z.string().optional(),
  location: z.string().min(5, "Location must be at least 5 characters"),
  propertyType: z.enum(['PG', 'Hostel', 'BHK', 'PG_HOSTEL'], { required_error: "Please select a property type" }),
  price: z.number().optional(),
  pgRent: z.number().optional(),
  hostelRent: z.number().optional(),
  gender: z.enum(['male', 'female', 'any'], { required_error: "Please select a gender preference" }),
  roomType: z.enum(['single', 'sharing'], { required_error: "Please select a room type" }),
  coolingType: z.enum(['ac', 'cooler', 'none'], { required_error: "Please select a cooling type" }),
  food: z.enum(['included', 'not_included'], { required_error: "Please select a food option" }),
  wifi: z.enum(['yes', 'no'], { required_error: "Please select WiFi availability" }),
  bathroom: z.enum(['yes', 'no'], { required_error: "Please select bathroom option" }),
  laundry: z.enum(['yes', 'no'], { required_error: "Please select laundry option" }),
  electricBill: z.enum(['yes', 'no'], { required_error: "Please select electric bill option" }),
  owner_phone: z.string().min(10, "Phone number must be valid"),
}).superRefine((data, ctx) => {
  if (data.propertyType === 'PG_HOSTEL') {
    if (!data.pgRent || data.pgRent < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PG Monthly Rent must be greater than 0",
        path: ['pgRent'],
      });
    }
    if (!data.hostelRent || data.hostelRent < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hostel Monthly Rent must be greater than 0",
        path: ['hostelRent'],
      });
    }
  } else {
    if (!data.price || data.price < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be greater than 0",
        path: ['price'],
      });
    }
  }
});

export type FormValues = z.infer<typeof formSchema>;
