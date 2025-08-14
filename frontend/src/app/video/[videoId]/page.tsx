'use client';

import React, { useEffect, useState, useRef } from 'react';
import { videoAPI, commentAPI, likeAPI, subscriptionAPI } from '@/lib/api';
import { Video, Comment, User } from '@/types';
import ReactPlayer from 'react-player';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Share2, 
  MoreVertical,
  Heart,
  User as UserIcon,
  Clock,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface VideoPageProps {
  params: Promise<{ videoId: string }>;
}

export default function VideoPage({ params }: VideoPageProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: { isLiked: boolean; likeCount: number } }>({});
  const [likingComments, setLikingComments] = useState<{ [commentId: string]: boolean }>({});
  const [videoId, setVideoId] = useState<string>('');
  
  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);
  const playerRef = useRef<ReactPlayer | null>(null);

  // Handle params asynchronously
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        console.log('Resolved video params:', resolvedParams);
        console.log('Video ID:', resolvedParams.videoId);
        setVideoId(resolvedParams.videoId);
      } catch (error) {
        console.error('Error resolving video params:', error);
        setError('Failed to load video parameters');
      }
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        // Check if videoId is available
        if (!videoId) {
          return;
        }

        setIsLoading(true);
        setError(null);
        
        // Fetch video details
        const videoResponse = await videoAPI.getVideoById(videoId);
        const videoData = videoResponse.data as Video;
        setVideo(videoData);
        
        // Fetch comments
        try {
          const commentsResponse = await commentAPI.getVideoComments(videoId);
          const commentsData = (commentsResponse.data as { comments?: Comment[] })?.comments || [];
          setComments(commentsData);
          // Initialize comment likes
          const initialCommentLikes: { [commentId: string]: { isLiked: boolean; likeCount: number } } = {};
          commentsData.forEach((comment: Comment) => {
            initialCommentLikes[comment._id] = {
              isLiked: comment.isLiked || false,
              likeCount: comment.likeCount || 0
            };
          });
          setCommentLikes(initialCommentLikes);
        } catch (commentErr: unknown) {
          console.error('Failed to fetch comments:', commentErr);
          // Don't fail the entire page if comments fail
          setComments([]);
        }
        
        // Fetch like status and count
        try {
          setIsLoadingLikes(true);
          const likeResponse = await likeAPI.getVideoLikeStatus(videoId);
          setIsLiked((likeResponse.data as { isLiked: boolean })?.isLiked ?? false);
          setLikeCount((likeResponse.data as { totalLikes: number })?.totalLikes ?? 0);
        } catch (likeErr: unknown) {
          console.error('Failed to fetch like status:', likeErr);
          // Don't fail the entire page if like status fails
          setIsLiked(false);
          setLikeCount(0);
        } finally {
          setIsLoadingLikes(false);
        }

        // Fetch subscription status
        if (isAuthenticated && videoData.owner?._id) {
          try {
            const subscriptionResponse = await subscriptionAPI.checkSubscriptionStatus(videoData.owner._id);
            setIsSubscribed((subscriptionResponse.data as { isSubscribed: boolean })?.isSubscribed ?? false);
          } catch (subscriptionErr: unknown) {
            console.error('Failed to fetch subscription status:', subscriptionErr);
            // Don't fail the entire page if subscription status fails
            setIsSubscribed(false);
          }
        }
        
      } catch (err: unknown) {
        setError((err as any)?.response?.data?.message || 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    try {
      setIsLiking(true);
      const response = await likeAPI.toggleVideoLike(videoId);
      
      // Update state based on backend response
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err: unknown) {
      console.error('Failed to like video:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated || !newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const response = await commentAPI.addComment(videoId, newComment);
      setComments(prev => [(response.data as Comment), ...prev]);
      setNewComment('');
    } catch (err: unknown) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoProgress = (state: { played: number; playedSeconds: number; loaded?: number; loadedSeconds?: number }) => {
    setPlayed(state.played);
    if (typeof state.loaded === 'number') {
      setLoaded(state.loaded);
    }
  };

  const handleVideoDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleVideoReady = () => {
    setIsVideoLoading(false);
    setVideoError(null);
  };

  const handleVideoError = (error: any) => {
    setIsVideoLoading(false);
    setVideoError('Failed to load video. Please try again.');
    console.error('Video error:', error);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (fraction: number) => {
    if (fraction < 0) fraction = 0;
    if (fraction > 1) fraction = 1;
    setPlayed(fraction);
    playerRef.current?.seekTo(fraction, 'fraction');
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    if (!video?.owner?._id) {
      console.error('No channel ID available');
      return;
    }

    try {
      setIsSubscribing(true);
      const response = await subscriptionAPI.toggleSubscription(video.owner._id);
      
      // Update state based on backend response
      const responseData = response.data as any;
      if (responseData && typeof responseData === 'object' && 'isSubscribed' in responseData) {
        setIsSubscribed(responseData.isSubscribed);
      } else {
        // Fallback to toggle if response doesn't have isSubscribed
        setIsSubscribed(!isSubscribed);
      }
    } catch (err: any) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    try {
      setLikingComments(prev => ({ ...prev, [commentId]: true }));
      const response = await likeAPI.toggleCommentLike(commentId);
      
      // Update state based on backend response
      const responseData = response.data as any;
      if (responseData && typeof responseData === 'object' && 'isLiked' in responseData) {
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            isLiked: responseData.isLiked,
            likeCount: prev[commentId]?.likeCount || 0 + (responseData.isLiked ? 1 : -1)
          }
        }));
      } else {
        // Fallback to toggle if response doesn't have isLiked
        const currentLike = commentLikes[commentId];
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            isLiked: !(currentLike?.isLiked || false),
            likeCount: (currentLike?.likeCount || 0) + (!(currentLike?.isLiked || false) ? 1 : -1)
          }
        }));
      }
  } catch (err: any) {
      console.error('Failed to like comment:', err);
    } finally {
      setLikingComments(prev => ({ ...prev, [commentId]: false }));
    }
  };

  if (isLoading || !videoId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'The video you are looking for does not exist.'}</p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player and Info */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div className="relative aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-6 group">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                      <p>Loading video...</p>
                    </div>
                  </div>
                )}
                
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center">
                      <div className="text-red-500 mb-4">
                        <Eye size={48} />
                      </div>
                      <p className="text-red-400 mb-4">{videoError}</p>
                      <Button variant="primary" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

        <ReactPlayer
          url={video.videoFile}
                  playing={isPlaying}
                  muted={isMuted}
                  volume={volume}
          width="100%"
          height="100%"
          style={{ background: 'black' }}
                  ref={playerRef}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onProgress={handleVideoProgress}
                  onDuration={handleVideoDuration}
                  onReady={handleVideoReady}
                  onError={handleVideoError}
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload',
                        disablePictureInPicture: true
                      }
                    }
                  }}
                />

                {/* Custom Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {/* Progress/Seek Bar */}
                  <div className="w-full mb-1.5">
                    <div className="relative h-1.5 flex items-center">
                      <div className="absolute inset-0 bg-white/15 rounded-full" />
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full"
                        style={{ width: `${Math.min(loaded * 100, 100)}%`, backgroundColor: 'rgba(255,255,255,0.25)' }}
                      />
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-red-500 rounded-full"
                        style={{ width: `${Math.min(played * 100, 100)}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={played * 100}
                        onChange={(e) => handleSeek(parseFloat(e.target.value) / 100)}
                        className="relative z-10 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-red-500"
                        aria-label="Seek"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="text-white/85 hover:text-white bg-white/8 hover:bg-white/15 p-1.5"
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white/85 hover:text-white bg-white/8 hover:bg-white/15 p-1.5"
                        >
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-white/80">
                      <span>{formatDuration(played * duration)}</span>
                      <span>/</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="mb-6">
      <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                
                {/* Video Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>{formatDate(video.createdAt)}</span>
                    {duration > 0 && (
                      <>
        <span>•</span>
                        <span>{formatDuration(duration)}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={isLiked ? "primary" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      disabled={isLiking || isLoadingLikes}
                      className="flex items-center space-x-2"
                    >
                      {isLoadingLikes ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <Heart size={16} className={isLiked ? "fill-current" : ""} />
                      )}
                      <span>{likeCount}</span>
                    </Button>
                    
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <MessageCircle size={16} />
                      <span>{comments.length}</span>
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Share2 size={16} />
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {video.owner?.avatar ? (
                        <img 
                          src={video.owner.avatar} 
                          alt={video.owner.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <UserIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/channel/${video.owner?.username}`}>
                        <h3 className="font-semibold hover:text-red-500 transition-colors">
                          {video.owner?.fullName || video.owner?.FullName || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-400">@{video.owner?.username}</p>
                      </Link>
                    </div>
                  </div>
                  <Button 
                    variant={isSubscribed ? "outline" : "primary"} 
                    size="sm"
                    onClick={handleSubscribe}
                    disabled={isSubscribing || !isAuthenticated}
                    className="flex items-center space-x-2"
                  >
                    {isSubscribing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                    )}
                  </Button>
                </div>

                {/* Description */}
                <div className="bg-gray-900 p-4 rounded-lg mb-6">
                  <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
                
                {/* Add Comment */}
                {isAuthenticated && (
                  <div className="mb-6">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <UserIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="mb-2"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewComment('')}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleComment}
                            disabled={!newComment.trim() || isSubmittingComment}
                          >
                            {isSubmittingComment ? 'Posting...' : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => {
                      const commentLike = commentLikes[comment._id] || { isLiked: false, likeCount: 0 };
                      const isLiking = likingComments[comment._id] || false;
                      
                      return (
                        <div key={comment._id} className="flex space-x-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {comment.owner?.avatar ? (
                              <img 
                                src={comment.owner.avatar} 
                                alt={comment.owner.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <UserIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">
                                {comment.owner?.fullName || comment.owner?.FullName || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{comment.content}</p>
                            
                            {/* Comment Actions */}
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCommentLike(comment._id)}
                                disabled={isLiking}
                                className="flex items-center space-x-1 text-gray-400 hover:text-red-500"
                              >
                                {isLiking ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  <Heart size={12} className={commentLike.isLiked ? "fill-current text-red-500" : ""} />
                                )}
                                <span className="text-xs">
                                  {commentLike.likeCount > 0 ? commentLike.likeCount : ''}
                                </span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-300 text-xs"
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
      </main>
    </div>
  );
} 