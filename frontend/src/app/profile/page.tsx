'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { User } from '@/types';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  Edit,
  X,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  
  // Helper function to get the actual user object
  const getActualUser = () => {
    if (!user) return null;
    // Check if user is nested in a response object
    if (typeof user === 'object' && (user as any).user) {
      return (user as any).user;
    }
    return user;
  };
  
  // Helper function to get the correct full name
  const getFullName = () => {
    const actualUser = getActualUser();
    return actualUser?.fullName || actualUser?.FullName || 'Not set';
  };
  
  // Helper function to get avatar URL
  const getAvatarUrl = () => {
    const actualUser = getActualUser();
    return actualUser?.avatar || 'Not set';
  };
  
  // Helper function to get cover image URL
  const getCoverImageUrl = () => {
    const actualUser = getActualUser();
    return actualUser?.coverImage || 'Not set';
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: getActualUser()?.fullName || getActualUser()?.FullName || '',
    email: getActualUser()?.email || '',
    username: getActualUser()?.username || ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const actualUser = getActualUser();
      // Update account details
      if (formData.fullName !== (actualUser?.fullName || actualUser?.FullName) || 
          formData.email !== actualUser?.email || 
          formData.username !== actualUser?.username) {
        await authAPI.updateAccount({
          FullName: formData.fullName, // Backend expects FullName
          email: formData.email
        });
      }

      // Update avatar if selected
      if (avatarFile) {
        await authAPI.updateAvatar(avatarFile);
      }

      // Update cover image if selected
      if (coverImageFile) {
        await authAPI.updateCoverImage(coverImageFile);
      }

      // Refresh user data
      const currentUserResponse = await authAPI.getCurrentUser();
      const userData = (currentUserResponse.data as { user?: unknown })?.user || currentUserResponse.data;
      setUser(userData as User);

      setIsEditing(false);
      setAvatarFile(null);
      setCoverImageFile(null);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const actualUser = getActualUser();
    setFormData({
      fullName: actualUser?.fullName || actualUser?.FullName || '',
      email: actualUser?.email || '',
      username: actualUser?.username || ''
    });
    setIsEditing(false);
    setAvatarFile(null);
    setCoverImageFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold">MyTube</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account information</p>
          </div>

          {/* Profile Form */}
          <div className="bg-gray-900 rounded-lg p-6">
            {/* Cover Image */}
            <div className="relative mb-8">
                             <div className="h-48 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg overflow-hidden">
                 {getCoverImageUrl() !== 'Not set' ? (
                   <img 
                     src={getCoverImageUrl()} 
                     alt="Cover"
                     className="w-full h-full object-cover"
                   />
                 ) : null}
               </div>
              {isEditing && (
                <div className="absolute top-4 right-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                    <div className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors">
                      <Camera size={20} />
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
              {/* Avatar */}
              <div className="relative">
                                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800">
                   {getAvatarUrl() !== 'Not set' ? (
                     <img 
                       src={getAvatarUrl()} 
                       alt={getFullName()}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                       <UserIcon size={48} />
                     </div>
                   )}
                 </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div className="bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors">
                        <Camera size={16} />
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="space-y-4">
                                     <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Full Name
                     </label>
                     {isEditing ? (
                       <Input
                         value={formData.fullName}
                         onChange={(e) => handleInputChange('fullName', e.target.value)}
                         placeholder="Enter your full name"
                       />
                     ) : (
                       <p className="text-lg font-semibold">
                         {getFullName()}
                       </p>
                     )}
                   </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Username
                    </label>
                                         <p className="text-lg">@{getActualUser()?.username || 'Not set'}</p>
                    <p className="text-sm text-gray-500">Username cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-lg">{getActualUser()?.email || 'Not set'}</p>
                    )}
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Member Since
                     </label>
                     <p className="text-lg">
                       {getActualUser()?.createdAt ? (() => {
                         try {
                           return new Date(getActualUser()!.createdAt).toLocaleDateString('en-US', {
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric'
                           });
                         } catch (error) {
                           return 'Invalid Date';
                         }
                       })() : 'Unknown'}
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Last Updated
                     </label>
                     <p className="text-lg">
                       {getActualUser()?.updatedAt ? (() => {
                         try {
                           return new Date(getActualUser()!.updatedAt).toLocaleDateString('en-US', {
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric'
                           });
                         } catch (error) {
                           return 'Invalid Date';
                         }
                       })() : 'Unknown'}
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       User ID
                     </label>
                     <p className="text-lg font-mono text-sm">{getActualUser()?._id || 'Not set'}</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Watch History Videos
                     </label>
                     <p className="text-lg">{getActualUser()?.watchHistory?.length || 0} videos</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Avatar URL
                     </label>
                     <p className="text-lg text-sm break-all">{getAvatarUrl()}</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Cover Image URL
                     </label>
                     <p className="text-lg text-sm break-all">{getCoverImageUrl()}</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Available Fields
                     </label>
                     <p className="text-lg text-sm break-all">
                       {user ? Object.keys(user).join(', ') : 'No user data'}
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       User Object Type
                     </label>
                     <p className="text-lg text-sm break-all">
                       {user ? typeof user : 'No user data'}
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">
                       Has User Property
                     </label>
                     <p className="text-lg text-sm break-all">
                       {user && typeof user === 'object' ? (user as any).user ? 'Yes' : 'No' : 'No user data'}
                     </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </Button>
                  <Link href={`/channel/${getActualUser()?.username}`}>
                    <Button variant="outline">
                      View Channel
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

                     {/* Debug Section - Raw User Data */}
           <div className="mt-8">
             <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
             <div className="bg-gray-800 rounded-lg p-4">
               <pre className="text-xs text-gray-300 overflow-x-auto">
                 {JSON.stringify(user, null, 2)}
               </pre>
             </div>
           </div>

           {/* Quick Actions */}
           <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard">
              <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dashboard</h3>
                    <p className="text-sm text-gray-400">Manage your videos</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href={`/channel/${getActualUser()?.username}`}>
              <div className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">My Channel</h3>
                    <p className="text-sm text-gray-400">View your channel</p>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-gray-400">Account preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 