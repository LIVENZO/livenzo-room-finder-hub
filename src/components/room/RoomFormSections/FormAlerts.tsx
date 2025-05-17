
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormAlertsProps {
  session: any;
  isCheckingStorage: boolean;
  storageReady: boolean;
  uploadError: string | null;
  uploadProgress: string | null;
}

const FormAlerts: React.FC<FormAlertsProps> = ({
  session,
  isCheckingStorage,
  storageReady,
  uploadError,
  uploadProgress
}) => {
  return (
    <>
      {!session && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to upload images and list rooms. Please log in before proceeding.
          </AlertDescription>
        </Alert>
      )}
      
      {session && isCheckingStorage && (
        <Alert variant="default" className="mb-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            Checking storage access...
          </AlertDescription>
        </Alert>
      )}
      
      {session && !isCheckingStorage && !storageReady && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Storage access is not available. Please log out and log in again to refresh your session.
          </AlertDescription>
        </Alert>
      )}
      
      {uploadError && (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">
          {uploadError}
        </div>
      )}
      
      {uploadProgress && (
        <div className="text-sm text-blue-500 p-2 bg-blue-50 rounded border border-blue-200">
          {uploadProgress}
        </div>
      )}
    </>
  );
};

export default FormAlerts;
