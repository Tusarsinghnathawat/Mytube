'use client';

import { Search, Menu, Upload, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { UploadVideoModal } from '@/components/video/UploadVideoModal';
import SearchBar from '@/components/video/SearchBar';
import React, { useEffect, useState } from 'react';
import { Video } from '@/types';
import { videoAPI } from '@/lib/api';
import Link from 'next/link';
import { tweetAPI, likeAPI, tweetReplyAPI } from "@/lib/api";
import { Tweet } from "@/types";
import { Heart, Edit, Trash2, User as UserIcon, Send } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setLoginModalOpen, setRegisterModalOpen } = useUIStore();
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  // Tweet feed state
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [tweetError, setTweetError] = useState<string | null>(null);
  const [editingTweetId, setEditingTweetId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [liking, setLiking] = useState<{ [tweetId: string]: boolean }>({});
  const [likeStatus, setLikeStatus] = useState<{ [tweetId: string]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<{ [tweetId: string]: any[] }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [tweetId: string]: boolean }>({});
  const [postingReply, setPostingReply] = useState<{ [tweetId: string]: boolean }>({});
  const router = useRouter();

  const handleLogin = () => {
    setLoginModalOpen(true);
  };

  const handleRegister = () => {
    setRegisterModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await videoAPI.getAllVideos({
          page: currentPage,
          limit: 10
        });
        
        // Handle pagination response
        const responseData = response.data as unknown as {
          videos: Video[];
          currentPage: number;
          totalPages: number;
          totalVideos: number;
        };
        const videoList = responseData?.videos || [];
        
        setVideos(videoList);
        setCurrentPage(responseData?.currentPage || 1);
        setTotalPages(responseData?.totalPages || 1);
        setTotalVideos(responseData?.totalVideos || 0);
      } catch (err: unknown) {
        setError((err as any)?.response?.data?.message || 'Failed to load videos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [currentPage]);

  // Fetch all tweets (global feed)
  useEffect(() => {
    const fetchAllTweets = async () => {
      setTweetError(null);
      try {
        const response = await tweetAPI.getAllTweets();
        let data: any = {};
        try {
          data = (response && (response as any).data) ? (response as any).data : {};
        } catch {
          data = {};
        }
        setTweets(data.tweets ?? []);
      } catch (err: unknown) {
        setTweetError((err as any)?.response?.data?.message || "Failed to load tweets");
      }
    };
    if (isAuthenticated) fetchAllTweets();
  }, [isAuthenticated]);

  // Post a new tweet
  const handlePostTweet = async () => {
    if (!isAuthenticated || !newTweet.trim()) return;
    if (newTweet.length > 280) return;
    setIsPosting(true);
    try {
      const response = await tweetAPI.createTweet(newTweet.trim());
      setTweets((prev) => [response.data, ...prev]);
      setNewTweet("");
    } catch (err: unknown) {
      setTweetError((err as any)?.response?.data?.message || "Failed to post tweet");
    } finally {
      setIsPosting(false);
    }
  };

  // Like/unlike a tweet
  const handleLike = async (tweetId: string) => {
    if (!isAuthenticated) return;
    setLiking((prev) => ({ ...prev, [tweetId]: true }));
    try {
      const response = await likeAPI.toggleTweetLike(tweetId);
    } catch (err: unknown) {
      // ignore
    } finally {
      setLiking((prev) => ({ ...prev, [tweetId]: false }));
    }
  };

  // Start editing a tweet
  const startEdit = (tweet: Tweet) => {
    setEditingTweetId(tweet._id);
    setEditingContent(tweet.content);
  };

  // Save edited tweet
  const handleEditTweet = async (tweetId: string) => {
    if (!editingContent.trim() || editingContent.length > 280) return;
    try {
      const response = await tweetAPI.updateTweet(tweetId, editingContent.trim());
      setTweets((prev) =>
        prev.map((t) => (t._id === tweetId ? { ...t, content: response.data.content } : t))
      );
      setEditingTweetId(null);
      setEditingContent("");
    } catch (err: unknown) {
      setTweetError((err as any)?.response?.data?.message || "Failed to update tweet");
    }
  };

  // Delete a tweet
  const handleDeleteTweet = async (tweetId: string) => {
    if (!window.confirm("Are you sure you want to delete this tweet?")) return;
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err: unknown) {
      setTweetError((err as any)?.response?.data?.message || "Failed to delete tweet");
    }
  };

  // Fetch replies for a tweet
  const fetchReplies = async (tweetId: string) => {
    setLoadingReplies((prev) => ({ ...prev, [tweetId]: true }));
    try {
      const response = await tweetReplyAPI.getReplies(tweetId);
      setReplies((prev) => ({ ...prev, [tweetId]: response.data.comments || [] }));
    } catch (err: unknown) {
      // ignore
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [tweetId]: false }));
    }
  };

  // Post a reply to a tweet
  const handlePostReply = async (tweetId: string) => {
    if (!replyContent.trim()) return;
    setPostingReply((prev) => ({ ...prev, [tweetId]: true }));
    try {
      const response = await tweetReplyAPI.addReply(tweetId, replyContent.trim());
      setReplies((prev) => ({ ...prev, [tweetId]: [response.data, ...(prev[tweetId] || [])] }));
      setReplyContent("");
      setReplyingTo(null);
    } catch (err: unknown) {
      // ignore
    } finally {
      setPostingReply((prev) => ({ ...prev, [tweetId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold">MyTube</span>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar placeholder="Search videos..." />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <button
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  onClick={() => setUploadModalOpen(true)}
                  aria-label="Upload Video"
                >
                  <Upload size={20} />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <Bell size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                      <User size={16} />
                    </button>
                  )}
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="text-xs text-gray-400">@{user?.username}</p>
                  </div>
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Profile
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/tweeter">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Tweeter
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegister}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <section className="py-12 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to <span className="text-red-500">MyTube</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Share your world with videos. Upload, watch, and discover amazing content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-8 py-3"
                  >
                    Start Watching
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-3"
                  >
                    Upload Video
                  </Button>
                  <Link href="/tweeter">
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-8 py-3"
                    >
                      Go to Tweeter
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleRegister}
                    className="px-8 py-3"
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogin}
                    className="px-8 py-3"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose MyTube?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
                <p className="text-gray-400">
                  Upload your videos with just a few clicks. Support for multiple formats and sizes.
                </p>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Search size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Discovery</h3>
                <p className="text-gray-400">
                  Find amazing content with our intelligent search and recommendation system.
                </p>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-400">
                  Connect with creators, share comments, and build your own community.
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-red-500 mb-2">1M+</div>
                <div className="text-gray-400">Videos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500 mb-2">500K+</div>
                <div className="text-gray-400">Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500 mb-2">10M+</div>
                <div className="text-gray-400">Views</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500 mb-2">24/7</div>
                <div className="text-gray-400">Available</div>
              </div>
            </div>
          </section>

          {/* Tweet Feed Section */}
          {isAuthenticated && (
            <section className="py-8">
              <h2 className="text-2xl font-bold mb-6">Tweeter Feed</h2>
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <UserIcon size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={newTweet}
                      onChange={(e) => setNewTweet(e.target.value)}
                      placeholder="What's happening?"
                      maxLength={280}
                      className="mb-2"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{newTweet.length}/280</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePostTweet}
                        disabled={isPosting || !newTweet.trim() || newTweet.length > 280}
                      >
                        {isPosting ? "Posting..." : <><Send size={14} className="mr-1" /> Tweet</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {tweetError && <div className="text-red-500 text-center mb-4">{tweetError}</div>}
              <div className="space-y-6">
                {tweets.map((tweet) => (
                  <div
                    key={tweet._id}
                    className="bg-gray-900 rounded-lg p-4 flex space-x-3 cursor-pointer hover:bg-gray-800 transition"
                    onClick={() => router.push(`/tweeter/${tweet._id}`)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {tweet.owner?.avatar ? (
                        <img src={tweet.owner.avatar} alt={tweet.owner.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <UserIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">
                          {tweet.owner?.fullName || tweet.owner?.FullName || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">@{tweet.owner?.username}</span>
                        <span className="text-xs text-gray-500">· {formatDate(tweet.createdAt)}</span>
                      </div>
                      {editingTweetId === tweet._id ? (
                        <div className="flex flex-col space-y-2">
                          <Input
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            maxLength={280}
                            className="mb-1"
                          />
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditTweet(tweet._id)}
                              disabled={!editingContent.trim() || editingContent.length > 280}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTweetId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-200 mb-2 whitespace-pre-line break-words">{tweet.content}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Button
                          variant={likeStatus[tweet._id] ? "primary" : "ghost"}
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleLike(tweet._id);
                          }}
                          disabled={liking[tweet._id]}
                          className="flex items-center space-x-1"
                        >
                          <Heart size={14} className={likeStatus[tweet._id] ? "fill-current" : ""} />
                          <span>Like</span>
                          <span className="ml-1 text-xs text-gray-400">{tweet.likeCount ?? 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setReplyingTo(replyingTo === tweet._id ? null : tweet._id);
                            if (!replies[tweet._id]) fetchReplies(tweet._id);
                          }}
                        >
                          Reply
                        </Button>
                        {tweet.owner?._id === user?._id && editingTweetId !== tweet._id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                startEdit(tweet);
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteTweet(tweet._id);
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                      {/* Reply input and list */}
                      {replyingTo === tweet._id && (
                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                          <Input
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            maxLength={280}
                            className="mb-2"
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex items-center space-x-2 mb-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handlePostReply(tweet._id);
                              }}
                              disabled={postingReply[tweet._id] || !replyContent.trim()}
                            >
                              {postingReply[tweet._id] ? "Replying..." : "Reply"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                setReplyingTo(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          {loadingReplies[tweet._id] ? (
                            <div className="text-xs text-gray-400">Loading replies...</div>
                          ) : (
                            <div className="space-y-2">
                              {(replies[tweet._id] || []).length === 0 ? (
                                <div className="text-xs text-gray-400">No replies yet.</div>
                              ) : (
                                replies[tweet._id].map((reply) => (
                                  <div key={reply._id} className="flex items-start space-x-2 bg-gray-800 rounded p-2">
                                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                      {reply.owner?.avatar ? (
                                        <img src={reply.owner.avatar} alt={reply.owner.fullName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                          <UserIcon size={14} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-1 mb-0.5">
                                        <span className="font-semibold text-xs">{reply.owner?.fullName || reply.owner?.FullName || "Unknown"}</span>
                                        <span className="text-xs text-gray-400">@{reply.owner?.username}</span>
                                        <span className="text-xs text-gray-500">· {formatDate(reply.createdAt)}</span>
                                      </div>
                                      <div className="text-xs text-gray-200 whitespace-pre-line break-words">{reply.content}</div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Video Feed */}
          <section className="py-8">
            <h2 className="text-2xl font-bold mb-6">Latest Videos</h2>
            {isLoading ? (
              <div className="text-center text-gray-400 py-12">Loading videos...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-12">{error}</div>
            ) : videos.length === 0 ? (
              <div className="text-center text-gray-400 py-12">No videos found.</div>
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
                      <h3 className="text-lg font-semibold mb-1 truncate" title={video.title}>{video.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                          <span>by </span>
                          <span className="hover:text-red-500 transition-colors cursor-pointer" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (video.owner?.username) {
                                    window.location.href = `/channel/${video.owner.username}`;
                                  } else {
                                    console.error('No username found for video owner');
                                  }
                                }}>
                            {video.owner?.fullName || video.owner?.FullName || video.owner?.username || 'Unknown'}
                          </span>
                        <span>•</span>
                        <span>{video.views ?? 0} views</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate" title={video.description}>{video.description}</p>
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
                        disabled={currentPage === 1 || isLoading}
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
                              disabled={isLoading}
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
                        disabled={currentPage === totalPages || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 MyTube. Built with Next.js and ❤️</p>
          </div>
        </div>
      </footer>

      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
