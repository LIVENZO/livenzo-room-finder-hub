import React from 'react';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Video, X, UploadCloud } from 'lucide-react';

interface VideoUploadSectionProps {
  videoFiles: File[];
  videoPreviews: string[];
  existingVideos?: string[];
  isSubmitting: boolean;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (index: number) => void;
}

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  videoFiles,
  videoPreviews,
  existingVideos = [],
  isSubmitting,
  onVideoChange,
  onRemoveVideo,
}) => {
  const totalVideos = existingVideos.length + videoFiles.length;
  const allPreviews = [...existingVideos, ...videoPreviews];

  return (
    <div className="space-y-2">
      <FormLabel>Room Videos (Optional)</FormLabel>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="video/mp4"
          multiple
          onChange={onVideoChange}
          className="hidden"
          id="video-upload"
          disabled={totalVideos >= 2 || isSubmitting}
        />
        
        {allPreviews.length === 0 ? (
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Video className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Upload Room Video Tour</p>
            <p className="text-xs text-gray-500 mt-1">MP4 format only, max 100MB each (up to 2 videos)</p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {allPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <video
                    src={preview}
                    className="h-32 w-48 object-cover rounded-lg bg-black"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => onRemoveVideo(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {totalVideos < 2 && (
              <label
                htmlFor="video-upload"
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                <span>Add more videos ({2 - totalVideos} remaining)</span>
              </label>
            )}
          </div>
        )}
      </div>
      <FormDescription>
        Upload up to 2 video tours of your room (MP4 format, max 100MB each)
      </FormDescription>
    </div>
  );
};

export default VideoUploadSection;
