'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Video, ChannelStats } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authAPI, videoAPI, subscriptionAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { UserIcon, VideoIcon, Upload, Settings, Eye, Calendar } from 'lucide-react';

interface ChannelPageProps {
  params: Promise<{ username: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [channelUser, setChannelUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');
  const [username, setUsername] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Handle params asynchronously
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setUsername(resolvedParams.username);
      } catch (error) {
        console.error('Error resolving params:', error);
        setError('Failed to load channel parameters');
      }
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        // Check if username is available
        if (!username) {
          setError('Username is required');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        
        // Fetch channel profile
        const channelResponse = await authAPI.getChannelProfile(username);
        const channelData = channelResponse.data as User & { isSubscribed?: boolean; subscribersCount?: number };
        setChannelUser(channelData);
        setIsSubscribed(channelData.isSubscribed || false);
        setSubscriberCount(channelData.subscribersCount || 0);
        
        // Initial video fetch will be handled by the separate useEffect
        setCurrentPage(1);
        
        // TODO: Fetch channel stats
        // const statsResponse = await authAPI.getChannelStats(username);
        // setStats(statsResponse.data);
        
      } catch (err: unknown) {
        const error = err as any;
        setError(error?.response?.data?.message || 'Failed to load channel');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();
  }, [username]);

  // Fetch videos when page changes
  useEffect(() => {
    const fetchVideos = async () => {
      if (!username || !channelUser) return;
      
      try {
        setIsLoadingVideos(true);
        
        const videosResponse = await videoAPI.getAllVideos({ 
          page: currentPage,
          limit: 10,
          userId: channelUser._id
        });
        
        const responseData = videosResponse.data as unknown as {
          videos: Video[];
          currentPage: number;
          totalPages: number;
          totalVideos: number;
        };
        const videosData = responseData?.videos || [];
        
        setVideos(videosData);
        setCurrentPage(responseData?.currentPage || 1);
        setTotalPages(responseData?.totalPages || 1);
        setTotalVideos(responseData?.totalVideos || 0);
      } catch (err: unknown) {
        const error = err as any;
        console.error('Failed to fetch videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [currentPage, username, channelUser]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    try {
      setIsSubscribing(true);
      // Use toggleSubscription which handles both subscribe and unsubscribe
      await subscriptionAPI.toggleSubscription(channelUser!._id);
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(prev => isSubscribed ? prev - 1 : prev + 1);
    } catch (err: unknown) {
      const error = err as any;
      console.error('Failed to toggle subscription:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading || !username) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channelUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Channel Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'The channel you are looking for does not exist.'}</p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnChannel = currentUser?._id === channelUser._id;

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
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Channel Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-red-600 to-purple-600 relative">
            {channelUser.coverImage && (
              <img 
                src={channelUser.coverImage} 
                alt="Channel cover"
                className="w-full h-full object-cover"
              />
            )}
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>

          {/* Channel Info */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-20 mb-8 relative z-10">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black">
                {channelUser.avatar ? (
                  <img 
                    src={channelUser.avatar} 
                    alt={channelUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>

              {/* Channel Details */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{channelUser.fullName || channelUser.FullName}</h1>
                <p className="text-gray-400 mb-2">@{channelUser.username}</p>
                
                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                  <span>{formatNumber(subscriberCount)} subscribers</span>
                  <span>{totalVideos} videos</span>
                  <span>Joined {formatDate(channelUser.createdAt)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {isOwnChannel ? (
                    <>
                      <Button variant="primary" size="sm">
                        <Upload size={16} className="mr-2" />
                        Upload Video
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings size={16} className="mr-2" />
                        Channel Settings
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant={isSubscribed ? "outline" : "primary"}
                        size="sm"
                        onClick={handleSubscribe}
                        disabled={isSubscribing}
                      >
                        {isSubscribing ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </Button>
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-b border-gray-800 mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('videos')}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'videos'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                About
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'videos' && (
            <div>
              {videos.length === 0 && !isLoadingVideos ? (
                <div className="text-center py-12">
                  <VideoIcon size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                  <p className="text-gray-400 mb-4">
                    {isOwnChannel 
                      ? "Start creating content by uploading your first video!"
                      : "This channel hasn't uploaded any videos yet."
                    }
                  </p>
                  {isOwnChannel && (
                    <Button variant="primary">
                      <Upload size={16} className="mr-2" />
                      Upload Video
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <Link
                        key={video._id}
                        href={`/video/${video._id}`}
                        className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer group block"
                      >
                        <div className="aspect-w-16 aspect-h-9 bg-black">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold mb-1 truncate" title={video.title}>
                            {video.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                            <Eye size={14} />
                            <span>{formatNumber(video.views)} views</span>
                            <span>•</span>
                            <Calendar size={14} />
                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate" title={video.description}>
                            {video.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1 || isLoadingVideos}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={isLoadingVideos}
                                className="w-10 h-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages || isLoadingVideos}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator for videos */}
                  {isLoadingVideos && (
                    <div className="mt-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                      <p className="text-gray-400">Loading videos...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">About {channelUser.fullName}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Channel Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Subscribers:</span>
                        <span className="ml-2">{formatNumber(subscriberCount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Videos:</span>
                        <span className="ml-2">{totalVideos}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Joined:</span>
                        <span className="ml-2">{formatDate(channelUser.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Username:</span>
                        <span className="ml-2">@{channelUser.username}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* stats && ( // This line was removed as per the edit hint */}
                  {/*   <div> // This line was removed as per the edit hint */}
                  {/*     <h4 className="font-medium mb-2">Channel Analytics</h4> // This line was removed as per the edit hint */}
                  {/*     <div className="grid grid-cols-2 gap-4 text-sm"> // This line was removed as per the edit hint */}
                  {/*       <div> // This line was removed as per the edit hint */}
                  {/*         <span className="text-gray-400">Total Views:</span> // This line was removed as per the edit hint */}
                  {/*         <span className="ml-2">{formatNumber(stats.totalViews)}</span> // This line was removed as per the edit hint */}
                  {/*       </div> // This line was removed as per the edit hint */}
                  {/*       <div> // This line was removed as per the edit hint */}
                  {/*         <span className="text-gray-400">Total Likes:</span> // This line was removed as per the edit hint */}
                  {/*         <span className="ml-2">{formatNumber(stats.totalLikes)}</span> // This line was removed as per the edit hint */}
                  {/*       </div> // This line was removed as per the edit hint */}
                  {/*     </div> // This line was removed as per the edit hint */}
                  {/*   </div> // This line was removed as per the edit hint */}
                  {/* ) // This line was removed as per the edit hint */}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 