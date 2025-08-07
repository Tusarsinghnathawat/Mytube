"use client";

import React, { useEffect, useState } from "react";
import { tweetAPI, likeAPI, tweetReplyAPI } from "@/lib/api";
import { Tweet, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heart, Edit, Trash2, User as UserIcon, Send } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function TweeterPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch all tweets (global feed)
  useEffect(() => {
    const fetchAllTweets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await tweetAPI.getAllTweets();
        let data: unknown = {};
        try {
          data = (response && (response as { data?: unknown }).data) ? (response as { data?: unknown }).data : {};
        } catch {
          data = {};
        }
        setTweets((data as { tweets?: Tweet[] }).tweets ?? []);
      } catch (err: any) {
        setError((err as any)?.response?.data?.message || "Failed to load tweets");
      } finally {
        setIsLoading(false);
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
    } catch (err: any) {
      setError((err as any)?.response?.data?.message || "Failed to post tweet");
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
    } catch (err) {
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
    } catch (err: any) {
      setError((err as any)?.response?.data?.message || "Failed to update tweet");
    }
  };

  // Delete a tweet
  const handleDeleteTweet = async (tweetId: string) => {
    if (!window.confirm("Are you sure you want to delete this tweet?")) return;
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err: any) {
      setError((err as any)?.response?.data?.message || "Failed to delete tweet");
    }
  };

  // Fetch replies for a tweet
  const fetchReplies = async (tweetId: string) => {
    setLoadingReplies((prev) => ({ ...prev, [tweetId]: true }));
    try {
      const response = await tweetReplyAPI.getReplies(tweetId);
      setReplies((prev) => ({ ...prev, [tweetId]: response.data.comments || [] }));
    } catch (err) {
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
    } catch (err) {
      // ignore
    } finally {
      setPostingReply((prev) => ({ ...prev, [tweetId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mb-4 flex items-center">
          Home
        </Button>
        <h1 className="text-3xl font-bold mb-6 text-center">Tweeter</h1>
        {isAuthenticated && (
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
        )}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p>Loading tweets...</p>
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No tweets yet. Be the first to tweet!</div>
        ) : (
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
                      onClick={() => handleLike(tweet._id)}
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
                          onClick={() => startEdit(tweet)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTweet(tweet._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 