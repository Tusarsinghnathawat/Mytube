'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { videoAPI, dashboardAPI } from '@/lib/api';
import { Video, ChannelStats } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  Video as VideoIcon, 
  Settings, 
  Upload, 
  Eye, 
  Heart, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'analytics' | 'settings'>('overview');
  
  // Pagination state for videos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch channel stats
        const statsResponse = await dashboardAPI.getChannelStats();
        setStats(statsResponse.data);
        
        // Fetch user's videos with analytics
        const videosResponse = await dashboardAPI.getChannelVideos(undefined, {
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortType: 'desc'
        });
        
        const responseData = videosResponse.data;
        setVideos(responseData.videos || []);
        setTotalVideos(responseData.analytics?.totalVideos || 0);
        setCurrentPage(responseData.pagination?.currentPage || 1);
        setTotalPages(responseData.pagination?.totalPages || 1);
        
      } catch (err: unknown) {
        setError((err as any)?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  // Fetch videos when page changes
  useEffect(() => {
    const fetchVideos = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setIsLoadingVideos(true);
        
        const videosResponse = await dashboardAPI.getChannelVideos(undefined, {
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortType: 'desc'
        });
        
        const responseData = videosResponse.data;
        setVideos(responseData.videos || []);
        setTotalVideos(responseData.analytics?.totalVideos || 0);
        setCurrentPage(responseData.pagination?.currentPage || 1);
        setTotalPages(responseData.pagination?.totalPages || 1);
      } catch (err: unknown) {
        console.error('Failed to fetch videos:', err);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [currentPage, isAuthenticated, user]);

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await videoAPI.deleteVideo(videoId);
      setVideos(prev => prev.filter(video => video._id !== videoId));
    } catch (err: unknown) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleTogglePublish = async (videoId: string, currentStatus: boolean) => {
    try {
      await videoAPI.togglePublishStatus(videoId);
      setVideos(prev => prev.map(video => 
        video._id === videoId 
          ? { ...video, isPublished: !currentStatus }
          : video
      ));
    } catch (err: unknown) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
            <span className="text-sm text-gray-400">Welcome back, {user?.fullName || user?.FullName || 'User'}</span>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your videos and channel</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-800 mb-8">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'videos', label: 'Videos', icon: VideoIcon },
                { id: 'analytics', label: 'Analytics', icon: Eye },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'videos' | 'analytics' | 'settings')}
                  className={`flex items-center space-x-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Videos</p>
                      <p className="text-2xl font-bold">{stats?.totalVideos || totalVideos}</p>
                    </div>
                    <VideoIcon size={24} className="text-red-500" />
                  </div>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Views</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(stats?.totalViews || 0)}
                      </p>
                    </div>
                    <Eye size={24} className="text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Subscribers</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(stats?.totalSubscribers || 0)}
                      </p>
                    </div>
                    <Users size={24} className="text-green-500" />
                  </div>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Likes</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(stats?.totalLikes || 0)}
                      </p>
                    </div>
                    <Heart size={24} className="text-red-500" />
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity (30 days)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">New Videos</span>
                        <span className="font-medium">{stats.recentVideos || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recent Views</span>
                        <span className="font-medium">{formatNumber(stats.recentViews || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Channel Info</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username</span>
                        <span className="font-medium">@{stats.channelInfo?.username || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Full Name</span>
                        <span className="font-medium">{stats.channelInfo?.fullName || stats.channelInfo?.FullName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Videos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Recent Videos</h2>
                  <Button variant="primary" size="sm">
                    <Upload size={16} className="mr-2" />
                    Upload Video
                  </Button>
                </div>
                
                {videos.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <VideoIcon size={48} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                    <p className="text-gray-400 mb-4">Start creating content by uploading your first video!</p>
                    <Button variant="primary">
                      <Upload size={16} className="mr-2" />
                      Upload Video
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.slice(0, 6).map((video) => (
                      <div key={video._id} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9 bg-black">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 truncate" title={video.title}>
                            {video.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>{formatNumber(video.views)} views</span>
                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant={video.isPublished ? "outline" : "primary"}
                              size="sm"
                              onClick={() => handleTogglePublish(video._id, video.isPublished)}
                            >
                              {video.isPublished ? 'Published' : 'Draft'}
                            </Button>
                            <Link href={`/video/${video._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye size={14} />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">All Videos ({videos.length})</h2>
                <Button variant="primary">
                  <Upload size={16} className="mr-2" />
                  Upload Video
                </Button>
              </div>
              
              {videos.length === 0 && !isLoadingVideos ? (
                <div className="text-center py-12 bg-gray-900 rounded-lg">
                  <VideoIcon size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                  <p className="text-gray-400 mb-4">Start creating content by uploading your first video!</p>
                  <Button variant="primary">
                    <Upload size={16} className="mr-2" />
                    Upload Video
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="text-left p-4">Video</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Views</th>
                            <th className="text-left p-4">Likes</th>
                            <th className="text-left p-4">Comments</th>
                            <th className="text-left p-4">Created</th>
                            <th className="text-left p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {videos.map((video) => (
                            <tr key={video._id} className="border-t border-gray-800">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-16 h-9 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={video.thumbnail}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium truncate" title={video.title}>
                                      {video.title}
                                    </h4>
                                    <p className="text-sm text-gray-400 truncate">
                                      {video.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  video.isPublished 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {video.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="p-4 text-sm">{formatNumber(video.views)}</td>
                              <td className="p-4 text-sm">{formatNumber(video.likeCount || 0)}</td>
                              <td className="p-4 text-sm">{formatNumber(video.commentCount || 0)}</td>
                              <td className="p-4 text-sm">{formatDate(video.createdAt)}</td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTogglePublish(video._id, video.isPublished)}
                                  >
                                    {video.isPublished ? <Pause size={14} /> : <Play size={14} />}
                                  </Button>
                                  <Link href={`/video/${video._id}`}>
                                    <Button variant="ghost" size="sm">
                                      <Eye size={14} />
                                    </Button>
                                  </Link>
                                  <Button variant="ghost" size="sm">
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteVideo(video._id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Analytics</h2>
              
              {stats ? (
                <div className="space-y-6">
                  {/* Top Performing Videos */}
                  {stats.topVideos && stats.topVideos.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Top Performing Videos</h3>
                      <div className="space-y-4">
                        {stats.topVideos.map((video, index) => (
                          <div key={video._id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-red-500 w-8">#{index + 1}</div>
                            <div className="w-16 h-9 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium truncate" title={video.title}>
                                {video.title}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <span>{formatNumber(video.views)} views</span>
                                <span>{formatNumber(video.likeCount || 0)} likes</span>
                                <span>{formatDate(video.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Views</span>
                          <span className="font-medium">{formatNumber(stats.totalViews)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Likes</span>
                          <span className="font-medium">{formatNumber(stats.totalLikes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Subscribers</span>
                          <span className="font-medium">{formatNumber(stats.totalSubscribers)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Videos</span>
                          <span className="font-medium">{stats.totalVideos}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Activity (30 days)</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">New Videos</span>
                          <span className="font-medium">{stats.recentVideos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Recent Views</span>
                          <span className="font-medium">{formatNumber(stats.recentViews)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Views/Video</span>
                          <span className="font-medium">
                            {stats.totalVideos > 0 ? formatNumber(Math.round(stats.totalViews / stats.totalVideos)) : '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg">
                  <TrendingUp size={48} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-gray-400">Start uploading videos to see your analytics.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              <div className="text-center py-12 bg-gray-900 rounded-lg">
                <Settings size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Settings Coming Soon</h3>
                <p className="text-gray-400">Account settings and preferences will be available soon.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 