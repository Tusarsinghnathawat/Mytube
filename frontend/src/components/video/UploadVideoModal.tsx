import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { videoAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { VideoUploadFormData } from '@/types';

const videoUploadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  videoFile: z.any(),
  thumbnail: z.any().optional(),
});

type FormData = z.infer<typeof videoUploadSchema>;

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const onDropVideo = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setVideoFile(acceptedFiles[0]);
      setValue('videoFile', acceptedFiles[0]);
    }
  };

  const onDropThumbnail = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setThumbnailFile(acceptedFiles[0]);
      setValue('thumbnail', acceptedFiles[0]);
    }
  };

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': [] },
    multiple: false,
  });

  const { getRootProps: getThumbRootProps, getInputProps: getThumbInputProps, isDragActive: isThumbDragActive } = useDropzone({
    onDrop: onDropThumbnail,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const onSubmit = async (data: FormData) => {
    if (!videoFile) {
      showToast('Video file is required', 'error');
      return;
    }
    setIsLoading(true);
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      // Debug: Log form data and files
      console.log('Submitting video upload:');
      console.log('Title:', data.title);
      console.log('Description:', data.description);
      console.log('Video file:', videoFile);
      console.log('Thumbnail file:', thumbnailFile);

      // Show a warning if the request takes too long
      timeoutId = setTimeout(() => {
        showToast('Upload is taking longer than expected. Please check your network or try a smaller file.', 'warning');
      }, 10000);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('videoFile', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      // Debug: Log FormData keys
      for (let pair of formData.entries()) {
        console.log('FormData:', pair[0], pair[1]);
      }
      const response = await videoAPI.publishVideo(formData);
      console.log('Upload response:', response);
      if (response.success) {
        showToast('Video uploaded successfully!', 'success');
        reset();
        setVideoFile(null);
        setThumbnailFile(null);
        onSuccess?.();
        onClose();
      } else {
        showToast(response.message || 'Upload failed', 'error');
      }
    } catch (error: unknown) {
      const err = error as any;
      console.error('Upload error:', err);
      showToast(err?.response?.data?.message || 'Upload failed', 'error');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Upload Video">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="Enter video title"
          error={errors.title?.message}
          {...register('title')}
        />
        <Input
          label="Description"
          placeholder="Enter video description (optional)"
          error={errors.description?.message}
          {...register('description')}
        />
        <div>
          <label className="block text-sm font-medium mb-1">Video File</label>
          <div {...getVideoRootProps()} className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${isVideoDragActive ? 'border-red-500' : 'border-gray-600'}`}>
            <input {...getVideoInputProps()} />
            {videoFile ? (
              <span>{videoFile.name}</span>
            ) : (
              <span>Drag & drop a video file here, or click to select</span>
            )}
          </div>
          {errors.videoFile && <p className="text-red-500 text-xs mt-1">{errors.videoFile.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Thumbnail (optional)</label>
          <div {...getThumbRootProps()} className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${isThumbDragActive ? 'border-red-500' : 'border-gray-600'}`}>
            <input {...getThumbInputProps()} />
            {thumbnailFile ? (
              <span>{thumbnailFile.name}</span>
            ) : (
              <span>Drag & drop an image here, or click to select</span>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
          Upload Video
        </Button>
      </form>
    </Modal>
  );
}; 