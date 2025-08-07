'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload, User, Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { isValidEmail, validatePassword } from '@/lib/utils';

// Validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  // Avatar dropzone
  const avatarDropzone = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setAvatarFile(acceptedFiles[0]);
    }
  });

  // Cover image dropzone
  const coverImageDropzone = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setCoverImageFile(acceptedFiles[0]);
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (!avatarFile) {
      showToast('Avatar is required', 'error');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.errors[0], 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('FullName', data.fullName);
      formData.append('avatar', avatarFile);
      
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }

      // Debug: Log what we're sending
      console.log('Form data being sent:');
      console.log('Username:', data.username);
      console.log('Email:', data.email);
      console.log('FullName:', data.fullName);
      console.log('Avatar file:', avatarFile);
      console.log('Cover image file:', coverImageFile);

      const response = await authAPI.register(formData);
      
      if (response.success) {
        showToast('Registration successful! Please log in.', 'success');
        onSuccess?.();
        onSwitchToLogin?.();
      }
    } catch (error: unknown) {
      const err = error as any;
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
        <p className="text-sm text-gray-400">Join MyTube and start sharing your world</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        {/* Username */}
        <Input
          label="Username"
          placeholder="Choose a username"
          error={errors.username?.message}
          {...register('username')}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && (
            <div className="text-xs text-gray-400">
              {validatePassword(password).isValid ? (
                <span className="text-green-500">✓ Password is strong</span>
              ) : (
                <div>
                  <span className="text-red-500">Password must contain:</span>
                  <ul className="ml-3 mt-1 space-y-0.5">
                    {validatePassword(password).errors.map((error, index) => (
                      <li key={index} className="text-red-400">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar Upload */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">
            Avatar <span className="text-red-500">*</span>
          </label>
          <div
            {...avatarDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              avatarDropzone.isDragActive
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input {...avatarDropzone.getInputProps()} />
            {avatarFile ? (
              <div className="flex items-center justify-center space-x-2">
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="Avatar preview"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs text-white truncate max-w-32">{avatarFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarFile(null);
                  }}
                  className="text-red-500 hover:text-red-400 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">
                  {avatarDropzone.isDragActive
                    ? 'Drop the avatar here'
                    : 'Click to upload avatar or drag and drop'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image Upload (Optional) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">
            Cover Image <span className="text-gray-500">(Optional)</span>
          </label>
          <div
            {...coverImageDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              coverImageDropzone.isDragActive
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input {...coverImageDropzone.getInputProps()} />
            {coverImageFile ? (
              <div className="flex items-center justify-center space-x-2">
                <img
                  src={URL.createObjectURL(coverImageFile)}
                  alt="Cover image preview"
                  className="w-6 h-6 rounded object-cover"
                />
                <span className="text-xs text-white truncate max-w-32">{coverImageFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverImageFile(null);
                  }}
                  className="text-red-500 hover:text-red-400 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">
                  {coverImageDropzone.isDragActive
                    ? 'Drop the cover image here'
                    : 'Click to upload cover image or drag and drop'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full mt-6"
          isLoading={isLoading}
          disabled={!avatarFile}
        >
          Create Account
        </Button>

        {/* Test Backend Connection */}
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={async () => {
            console.log('Testing backend connection...');
            await authAPI.testBackendConnection();
            console.log('Testing registration endpoint...');
            await authAPI.testRegistrationEndpoint();
          }}
        >
          Test Backend Connection
        </Button>

        {/* Switch to Login */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-red-500 hover:text-red-400 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}; 