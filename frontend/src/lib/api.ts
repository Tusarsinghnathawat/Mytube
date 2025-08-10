import axios from 'axios';
import { ApiResponse, User, Video, Comment, Like, Subscription, Playlist, Tweet, ChannelStats, CommentResponse } from '@/types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://mytube-43oy.onrender.com/api/v1',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors (401, 403, etc.)
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Test if we can reach the backend
  testBackendConnection: async (): Promise<void> => {
    try {
      console.log('Testing backend connection...');
      const response = await api.get('/healthcheck');
      console.log('Backend connection successful:', response.data);
    } catch (error: unknown) {
      const err = error as any;
      console.log('Backend connection failed:', err.message);
      console.log('Error status:', err.response?.status);
    }
  },

  // Test registration endpoint
  testRegistrationEndpoint: async (): Promise<void> => {
    try {
      console.log('Testing registration endpoint...');
      const response = await api.get('/user/register');
      console.log('Endpoint test successful:', response.data);
    } catch (error: unknown) {
      const err = error as any;
      console.log('Endpoint test failed:', err?.response?.status, err?.response?.data);
    }
  },

  // Register user
  register: async (formData: FormData): Promise<ApiResponse<User>> => {
    console.log('Attempting to register user...');
    console.log('Base URL:', api.defaults.baseURL);
    console.log('Full URL:', `${api.defaults.baseURL}/user/register`);
    
    try {
      const response = await api.post('/user/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as any;
      console.log('=== REGISTRATION ERROR DEBUG ===');
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error code:', err.code);
      console.log('Error status:', err.response?.status);
      console.log('Error status text:', err.response?.statusText);
      console.log('Error data:', err.response?.data);
      console.log('Request URL:', err.config?.url);
      console.log('Request method:', err.config?.method);
      console.log('=== END DEBUG ===');
      throw err;
    }
  },

  // Login user
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<User>> => {
    const response = await api.post('/user/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/user/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/user/current-user');
    return response.data;
  },

  // Refresh access token
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await api.post('/user/refresh-token');
    return response.data;
  },

  // Change password
  changePassword: async (passwords: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
    const response = await api.post('/user/change-password', passwords);
    return response.data;
  },

  // Update account details
  updateAccount: async (details: { fullName?: string; FullName?: string; email?: string }): Promise<ApiResponse<User>> => {
    const response = await api.patch('/user/update-account', details);
    return response.data;
  },

  // Update avatar
  updateAvatar: async (avatar: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', avatar);
    const response = await api.patch('/user/update-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update cover image
  updateCoverImage: async (coverImage: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('coverImage', coverImage);
    const response = await api.patch('/user/update-cover-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user channel profile
  getChannelProfile: async (username: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/user/c/${username}`);
    return response.data;
  },

  // Get watch history
  getWatchHistory: async (): Promise<ApiResponse<Video[]>> => {
    const response = await api.get('/user/history');
    return response.data;
  },
};

// Video API
export const videoAPI = {
  // Get all videos
  getAllVideos: async (params?: { page?: number; limit?: number; query?: string; sortBy?: string; sortType?: string; userId?: string }): Promise<ApiResponse<Video[]>> => {
    const response = await api.get('/video', { params });
    return response.data;
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<ApiResponse<Video>> => {
    const response = await api.get(`/video/${videoId}`);
    return response.data;
  },

  // Publish video
  publishVideo: async (formData: FormData): Promise<ApiResponse<Video>> => {
    const response = await api.post('/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update video
  updateVideo: async (videoId: string, updates: { title?: string; description?: string; isPublished?: boolean }): Promise<ApiResponse<Video>> => {
    const response = await api.patch(`/video/${videoId}`, updates);
    return response.data;
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/video/${videoId}`);
    return response.data;
  },

  // Toggle publish status
  togglePublishStatus: async (videoId: string): Promise<ApiResponse<Video>> => {
    const response = await api.patch(`/video/${videoId}/toggle-publish`);
    return response.data;
  },
};

// Comment API
export const commentAPI = {
  // Get video comments
  getVideoComments: async (videoId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<CommentResponse>> => {
    const response = await api.get(`/comment/video/${videoId}`, { params });
    return response.data;
  },

  // Add comment
  addComment: async (videoId: string, content: string): Promise<ApiResponse<Comment>> => {
    const response = await api.post(`/comment/video/${videoId}`, { content });
    return response.data;
  },

  // Update comment
  updateComment: async (commentId: string, content: string): Promise<ApiResponse<Comment>> => {
    const response = await api.patch(`/comment/${commentId}`, { content });
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/comment/${commentId}`);
    return response.data;
  },
};

// Like API
export const likeAPI = {
  // Get video like status and count
  getVideoLikeStatus: async (videoId: string): Promise<ApiResponse<{ isLiked: boolean; totalLikes: number }>> => {
    const response = await api.get(`/like/video/${videoId}`);
    return response.data;
  },

  // Toggle video like
  toggleVideoLike: async (videoId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/like/toggle/video/${videoId}`);
    return response.data;
  },

  // Toggle comment like
  toggleCommentLike: async (commentId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/like/toggle/comment/${commentId}`);
    return response.data;
  },

  // Toggle tweet like
  toggleTweetLike: async (tweetId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/like/toggle/tweet/${tweetId}`);
    return response.data;
  },

  // Get liked videos
  getLikedVideos: async (): Promise<ApiResponse<Video[]>> => {
    const response = await api.get('/like/videos');
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  // Check subscription status
  checkSubscriptionStatus: async (channelId: string): Promise<ApiResponse<{ isSubscribed: boolean }>> => {
    const response = await api.get(`/subscription/channel/${channelId}/status`);
    return response.data;
  },

  // Toggle subscription
  toggleSubscription: async (channelId: string): Promise<ApiResponse<{ isSubscribed: boolean }>> => {
    const response = await api.post(`/subscription/channel/${channelId}`);
    return response.data;
  },

  // Get subscribed channels
  getSubscribedChannels: async (subscriberId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/subscription/user/${subscriberId}`);
    return response.data;
  },

  // Get channel subscribers
  getChannelSubscribers: async (channelId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/subscription/channel/${channelId}/subscribers`);
    return response.data;
  },
};

// Playlist API
export const playlistAPI = {
  // Create playlist
  createPlaylist: async (data: { name: string; description?: string }): Promise<ApiResponse<Playlist>> => {
    const response = await api.post('/playlist', data);
    return response.data;
  },

  // Get user playlists
  getUserPlaylists: async (userId: string): Promise<ApiResponse<Playlist[]>> => {
    const response = await api.get(`/playlist/user/${userId}`);
    return response.data;
  },

  // Get playlist by ID
  getPlaylistById: async (playlistId: string): Promise<ApiResponse<Playlist>> => {
    const response = await api.get(`/playlist/${playlistId}`);
    return response.data;
  },

  // Update playlist
  updatePlaylist: async (playlistId: string, updates: { name?: string; description?: string }): Promise<ApiResponse<Playlist>> => {
    const response = await api.patch(`/playlist/${playlistId}`, updates);
    return response.data;
  },

  // Delete playlist
  deletePlaylist: async (playlistId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/playlist/${playlistId}`);
    return response.data;
  },

  // Add video to playlist
  addVideoToPlaylist: async (playlistId: string, videoId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/playlist/${playlistId}/videos/${videoId}`);
    return response.data;
  },

  // Remove video from playlist
  removeVideoFromPlaylist: async (playlistId: string, videoId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/playlist/${playlistId}/videos/${videoId}`);
    return response.data;
  },
};

// Tweet API
export const tweetAPI = {
  // Create tweet
  createTweet: async (content: string): Promise<ApiResponse<Tweet>> => {
    const response = await api.post('/tweet', { content });
    return response.data;
  },

  // Get user tweets
  getUserTweets: async (userId: string): Promise<ApiResponse<Tweet[]>> => {
    const response = await api.get(`/tweet/user/${userId}`);
    return response.data;
  },

  // Update tweet
  updateTweet: async (tweetId: string, content: string): Promise<ApiResponse<Tweet>> => {
    const response = await api.patch(`/tweet/${tweetId}`, { content });
    return response.data;
  },

  // Delete tweet
  deleteTweet: async (tweetId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/tweet/${tweetId}`);
    return response.data;
  },

  // Get all tweets (global feed)
  getAllTweets: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> => {
    const response = await api.get('/tweet', { params });
    return response.data;
  },
  // Get tweet by ID
  getTweetById: async (tweetId: string): Promise<ApiResponse<Tweet>> => {
    const response = await api.get(`/tweet/${tweetId}`);
    return response.data;
  },
};

// Tweet Reply API
export const tweetReplyAPI = {
  // Add a reply to a tweet
  addReply: async (tweetId: string, content: string) => {
    const response = await api.post(`/comment/tweet/${tweetId}/reply`, { content });
    return response.data;
  },
  // Get replies for a tweet
  getReplies: async (tweetId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/comment/tweet/${tweetId}/replies`, { params });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get channel stats
  getChannelStats: async (channelId?: string): Promise<ApiResponse<ChannelStats>> => {
    const url = channelId ? `/dashboard/stats/${channelId}` : '/dashboard/stats';
    const response = await api.get(url);
    return response.data;
  },

  // Get channel videos with pagination and analytics
  getChannelVideos: async (channelId?: string, params?: { page?: number; limit?: number; sortBy?: string; sortType?: string }): Promise<ApiResponse<any>> => {
    const url = channelId ? `/dashboard/videos/${channelId}` : '/dashboard/videos';
    const response = await api.get(url, { params });
    return response.data;
  },
};

export default api; 