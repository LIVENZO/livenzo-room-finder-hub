
import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from './schemas/roomListingSchema';
import { EnhancedValidator } from '@/services/security/enhancedValidation';
import { securityMonitor } from '@/services/security/securityMonitor';
import { toast } from 'sonner';

interface BasicRoomInfoFieldsProps {
  control: Control<FormValues>;
}

const BasicRoomInfoFields: React.FC<BasicRoomInfoFieldsProps> = ({ control }) => {
  
  // Security validation for room listing inputs
  const validateRoomInput = (value: string, fieldType: 'title' | 'description' | 'location' | 'house') => {
    let validationResult;
    
    switch (fieldType) {
      case 'title':
      case 'house':
        validationResult = EnhancedValidator.validateAndSanitize(value, 'safeName', {
          required: fieldType === 'title',
          minLength: fieldType === 'title' ? 5 : 0,
          maxLength: 100
        });
        break;
      case 'description':
        validationResult = EnhancedValidator.validateDescription(value, true);
        break;
      case 'location':
        validationResult = EnhancedValidator.validateAndSanitize(value, 'safeName', {
          required: true,
          minLength: 5,
          maxLength: 200
        });
        break;
      default:
        validationResult = { isValid: true, sanitizedValue: value };
    }
    
    if (validationResult.securityIssue) {
      securityMonitor.logSuspiciousActivity('form_injection_attempt', {
        field: fieldType,
        value: value.substring(0, 50),
        action: 'room_listing_input'
      });
      toast.error(`Invalid input detected in ${fieldType} field`);
      return false;
    }
    
    return validationResult;
  };
  return (
    <>
      {/* Room Title */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Spacious Single Room near University" {...field} />
            </FormControl>
            <FormDescription>
              Choose a descriptive title to attract potential renters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Room Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your room in detail, including features, nearby amenities, etc."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide a detailed description of your room and what makes it special
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* House Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="house_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel>House No.</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="house_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>House Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sunshine Apartments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Location */}
      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Near Central Park, New York" {...field} />
            </FormControl>
            <FormDescription>
              Enter a descriptive location to help renters find your property
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default BasicRoomInfoFields;
