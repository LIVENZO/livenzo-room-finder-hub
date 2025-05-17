
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CardContent } from '@/components/ui/card';
import RoomBasicInfo from './RoomFormSections/RoomBasicInfo';
import RoomDescription from './RoomFormSections/RoomDescription';
import RoomPriceLocation from './RoomFormSections/RoomPriceLocation';
import RoomFacilities from './RoomFormSections/RoomFacilities';
import RoomContact from './RoomFormSections/RoomContact';
import ImageUploader from './ImageUploader';
import FormAlerts from './RoomFormSections/FormAlerts';
import FormActions from './RoomFormSections/FormActions';
import FormSubmissionHandler from './RoomFormSections/FormSubmissionHandler';

interface RoomListingFormProps {
  userId: string;
  userRole: string;
  storageReady?: boolean;
  isCheckingStorage?: boolean;
}

const RoomListingForm: React.FC<RoomListingFormProps> = ({ 
  userId, 
  userRole,
  storageReady = false,
  isCheckingStorage = false
}) => {
  const { session } = useAuth();
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [wifi, setWifi] = useState(false);
  const [bathroom, setBathroom] = useState(false);
  const [gender, setGender] = useState<'any' | 'male' | 'female'>('any');
  const [roomType, setRoomType] = useState<'single' | 'sharing'>('single');
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // State for uploaded images
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const isFormDisabled = userRole !== 'owner' || !session || (!storageReady && !isCheckingStorage);
  
  return (
    <FormSubmissionHandler
      title={title}
      description={description}
      price={price}
      location={location}
      phone={phone}
      wifi={wifi}
      bathroom={bathroom}
      gender={gender}
      roomType={roomType}
      images={images}
      uploadedFiles={uploadedFiles}
      userId={userId}
      session={session}
      storageReady={storageReady}
      setIsUploading={setIsUploading}
      setUploadError={setUploadError}
      setUploadProgress={setUploadProgress}
    >
      <CardContent className="space-y-6">
        <FormAlerts 
          session={session}
          isCheckingStorage={isCheckingStorage}
          storageReady={storageReady}
          uploadError={uploadError}
          uploadProgress={uploadProgress}
        />
      
        <RoomBasicInfo title={title} setTitle={setTitle} />
        
        <RoomDescription description={description} setDescription={setDescription} />
        
        <RoomPriceLocation 
          price={price} 
          setPrice={setPrice} 
          location={location} 
          setLocation={setLocation} 
        />
        
        <ImageUploader 
          images={images} 
          setImages={setImages} 
          uploadedFiles={uploadedFiles} 
          setUploadedFiles={setUploadedFiles} 
          disabled={!session || (!storageReady && !isCheckingStorage)}
        />
        
        <RoomFacilities 
          gender={gender} 
          setGender={setGender}
          roomType={roomType} 
          setRoomType={setRoomType} 
          wifi={wifi} 
          setWifi={setWifi}
          bathroom={bathroom} 
          setBathroom={setBathroom} 
        />
        
        <RoomContact phone={phone} setPhone={setPhone} />
      </CardContent>
      
      <FormActions 
        isUploading={isUploading}
        isDisabled={isFormDisabled}
        uploadProgress={uploadProgress}
      />
    </FormSubmissionHandler>
  );
};

export default RoomListingForm;
