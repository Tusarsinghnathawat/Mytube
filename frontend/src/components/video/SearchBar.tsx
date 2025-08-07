'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Video } from '@/types';
import { videoAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ 
  className = '', 
  placeholder = 'Search videos...',
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchVideos = async () => {
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await videoAPI.getAllVideos({ 
          query: query.trim(),
          limit: 10 
        });
        const videos = Array.isArray(response.data) ? response.data : [];
        setResults(videos);
        setShowResults(true);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchVideos, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setHasSearched(false);
  };

  const handleResultClick = (video: Video) => {
    router.push(`/video/${video._id}`);
    setShowResults(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-2 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            onFocus={() => setShowResults(true)}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>Searching...</span>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No videos found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((video) => (
                <div
                  key={video._id}
                  onClick={() => handleResultClick(video)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="w-16 h-9 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate" title={video.title}>
                      {video.title}
                    </h4>
                                         <p className="text-xs text-gray-400 truncate">
                       by {video.owner?.fullName || video.owner?.FullName || video.owner?.username || 'Unknown'}
                     </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>{formatNumber(video.views)} views</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {results.length > 0 && (
                <div className="border-t border-gray-700 p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-center"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setShowResults(false);
                    }}
                  >
                    View all results for "{query}"
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 