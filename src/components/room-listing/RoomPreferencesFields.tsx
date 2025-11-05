
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FormValues } from './schemas/roomListingSchema';

interface RoomPreferencesFieldsProps {
  control: Control<FormValues>;
}

const RoomPreferencesFields: React.FC<RoomPreferencesFieldsProps> = ({ control }) => {
  return (
    <>
      {/* Room Cost */}
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Rent</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                min="1"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Enter the monthly rent amount
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Gender Preference */}
      <FormField
        control={control}
        name="gender"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Gender Preference</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="gender-male" />
                  <FormLabel htmlFor="gender-male" className="cursor-pointer font-normal">
                    Boys Only
                  </FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="gender-female" />
                  <FormLabel htmlFor="gender-female" className="cursor-pointer font-normal">
                    Girls Only
                  </FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="gender-any" />
                  <FormLabel htmlFor="gender-any" className="cursor-pointer font-normal">
                    Any Gender
                  </FormLabel>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Room Type */}
      <FormField
        control={control}
        name="roomType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Room Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="room-single" />
                  <FormLabel htmlFor="room-single" className="cursor-pointer font-normal">
                    Single Room
                  </FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sharing" id="room-sharing" />
                  <FormLabel htmlFor="room-sharing" className="cursor-pointer font-normal">
                    Sharing Room
                  </FormLabel>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Cooling Type */}
      <FormField
        control={control}
        name="coolingType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Cooling Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ac" id="cooling-ac" />
                  <FormLabel htmlFor="cooling-ac" className="cursor-pointer font-normal">
                    AC Room
                  </FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cooler" id="cooling-cooler" />
                  <FormLabel htmlFor="cooling-cooler" className="cursor-pointer font-normal">
                    Cooler Room
                  </FormLabel>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Amenities */}
      <div className="space-y-3">
        <FormLabel>Amenities</FormLabel>
        
        <div className="flex space-x-6">
          <FormField
            control={control}
            name="wifi"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>WiFi Available</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="bathroom"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Connected Bathroom</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
      
      {/* Contact Phone */}
      <FormField
        control={control}
        name="owner_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Phone Number</FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="Your phone number"
                {...field}
              />
            </FormControl>
            <FormDescription>
              This number will be visible to potential renters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default RoomPreferencesFields;
