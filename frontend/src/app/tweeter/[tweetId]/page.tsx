"use client";

import React, { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { tweetAPI, tweetReplyAPI } from "@/lib/api";
import { Tweet, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Heart,
  Repeat2,
  Bookmark,
  Share2,
  Eye,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";

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

export default function TweetDetailPage({ params }: { params: Promise<{ tweetId: string }> }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const { tweetId } = use(params);
  useEffect(() => {
    const fetchTweetAndReplies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch tweet by ID
        const tweetRes = await tweetAPI.getTweetById(tweetId);
        setTweet(tweetRes.data);
        // Fetch replies
        const repliesRes = await tweetReplyAPI.getReplies(tweetId);
        setReplies((repliesRes.data as { comments?: unknown[] })?.comments || []);
      } catch (err: any) {
        setError((err as any)?.response?.data?.message || "Failed to load tweet");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTweetAndReplies();
  }, [tweetId]);

  // Add this function for posting a reply
  const handlePostReply = async () => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
    try {
      const response = await tweetReplyAPI.addReply(tweetId, replyContent.trim());
      setReplies((prev) => [response.data, ...prev]);
      setReplyContent("");
    } catch (err) {
      // ignore
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading tweet...</p>
        </div>
      </div>
    );
  }

  if (error || !tweet) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tweet Not Found</h1>
          <p className="text-gray-400 mb-4">{error || "The tweet you are looking for does not exist."}</p>
          <Button variant="primary" onClick={() => router.push("/tweeter")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.push("/tweeter")} className="mb-4 flex items-center">
          <ArrowLeft size={18} className="mr-1" /> Back to Tweeter
        </Button>
        {/* Tweet Content */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              {tweet.owner?.avatar ? (
                <img src={tweet.owner.avatar} alt={tweet.owner.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <UserIcon size={24} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-base">
                  {tweet.owner?.fullName || tweet.owner?.FullName || "Unknown"}
                </span>
                <span className="text-xs text-gray-400">@{tweet.owner?.username}</span>
                <span className="text-xs text-gray-500">· {formatDate(tweet.createdAt)}</span>
              </div>
              <p className="text-gray-200 mb-2 whitespace-pre-line break-words text-lg">{tweet.content}</p>
              {/* Action symbols */}
              <div className="flex items-center space-x-6 mt-2">
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Heart size={18} />
                  <span className="text-xs text-gray-400">{tweet.likeCount ?? 0}</span>
                </div>
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Repeat2 size={18} />
                  <span className="text-xs text-gray-400">Repost</span>
                </div>
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Bookmark size={18} />
                  <span className="text-xs text-gray-400">Bookmark</span>
                </div>
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Share2 size={18} />
                  <span className="text-xs text-gray-400">Share</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye size={18} />
                  <span className="text-xs text-gray-400">Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isAuthenticated && (
          <div className="mb-4">
            <Input
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              maxLength={280}
              className="mb-2"
            />
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePostReply}
                disabled={isReplying || !replyContent.trim()}
              >
                {isReplying ? "Replying..." : "Reply"}
              </Button>
            </div>
          </div>
        )}
        {/* Replies */}
        <div>
          <h2 className="text-lg font-bold mb-3">Replies</h2>
          {replies.length === 0 ? (
            <div className="text-xs text-gray-400">No replies yet.</div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply._id} className="flex items-start space-x-3 bg-gray-800 rounded p-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    {reply.owner?.avatar ? (
                      <img src={reply.owner.avatar} alt={reply.owner.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <UserIcon size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="font-semibold text-sm">{reply.owner?.fullName || reply.owner?.FullName || "Unknown"}</span>
                      <span className="text-xs text-gray-400">@{reply.owner?.username}</span>
                      <span className="text-xs text-gray-500">· {formatDate(reply.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-200 whitespace-pre-line break-words">{reply.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 