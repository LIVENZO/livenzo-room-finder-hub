
import * as z from 'zod';

export const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  house_no: z.string().optional(),
  house_name: z.string().optional(),
  location: z.string().min(5, "Location must be at least 5 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  gender: z.enum(['male', 'female', 'any']),
  roomType: z.enum(['single', 'sharing']),
  wifi: z.boolean().default(false),
  bathroom: z.boolean().default(false),
  owner_phone: z.string().min(10, "Phone number must be valid"),
});

export type FormValues = z.infer<typeof formSchema>;
