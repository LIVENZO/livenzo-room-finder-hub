
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isUploading: boolean;
  isDisabled: boolean;
  uploadProgress: string | null;
}

const FormActions: React.FC<FormActionsProps> = ({ 
  isUploading, 
  isDisabled,
  uploadProgress 
}) => {
  const navigate = useNavigate();
  
  return (
    <CardFooter className="flex flex-col sm:flex-row gap-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => navigate('/dashboard')}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="w-full sm:w-auto"
        disabled={isUploading || isDisabled}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {uploadProgress || 'Uploading...'}
          </>
        ) : "List Room"}
      </Button>
    </CardFooter>
  );
};

export default FormActions;
