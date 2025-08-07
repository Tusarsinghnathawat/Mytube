// User related types
export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string; // Frontend field name
  FullName?: string; // Backend field name
  avatar: string;
  coverImage?: string;
  watchHistory: string[];
  createdAt: string;
  updatedAt: string;
}

// Video related types
export interface Video {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: User;
  createdAt: string;
  updatedAt: string;
  // Dashboard analytics fields
  likeCount?: number;
  commentCount?: number;
}

// Comment related types
export interface Comment {
  _id: string;
  content: string;
  video: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  likeCount?: number;
}

// Like related types
export interface Like {
  _id: string;
  video?: string;
  comment?: string;
  tweet?: string;
  likedBy: string;
  createdAt: string;
}

// Subscription related types
export interface Subscription {
  _id: string;
  channel: string;
  subscriber: string;
  createdAt: string;
}

// Playlist related types
export interface Playlist {
  _id: string;
  name: string;
  description: string;
  videos: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// Tweet related types
export interface Tweet {
  _id: string;
  content: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
}

// API Response types
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// Comment response types
export interface CommentResponse {
  comments: Comment[];
  currentPage: number;
  totalPages: number;
  totalComments: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar: File;
  coverImage?: File;
}

export interface VideoUploadFormData {
  title: string;
  description: string;
  videoFile: File;
  thumbnail: File;
}

// Channel stats types
export interface ChannelStats {
  totalVideos: number;
  totalSubscribers: number;
  totalViews: number;
  totalLikes: number;
  recentVideos: number;
  recentViews: number;
  topVideos?: Video[];
  channelInfo: {
    username: string;
    fullName?: string; // Frontend field name
    FullName?: string; // Backend field name
    avatar: string;
    coverImage?: string;
  };
} 