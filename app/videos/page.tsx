"use client"

import { useEffect, useState } from "react";
import { VideoIcon, Play, Download, Calendar, Clock, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthButton } from "@/components/auth/auth-button";
import { UserInfoBadge } from "@/components/auth/user-info";
import Link from "next/link";

interface VideoRecord {
  taskId: string;
  status: 'completed' | 'generating' | 'processing' | 'pending' | 'failed' | 'unknown';
  videoUrl?: string;
  originalVideoUrl?: string;
  resolution: string;
  createTime: string;
  completeTime?: string;
  fallbackFlag: boolean;
  errorCode?: string;
  errorMessage?: string;
  prompt?: string;
  tokensUsed?: number;
}

const VideosPage = () => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  // Auto-refresh generating videos every 30 seconds
  useEffect(() => {
    const hasGeneratingVideos = videos.some(video => 
      video.status === 'generating' || video.status === 'processing' || video.status === 'pending' || video.status === 'unknown'
    );
    
    if (hasGeneratingVideos) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing generating videos...');
        fetchVideos();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [videos]);

  const fetchVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/api/videos/list');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      const videos = data.videos || [];
      
      console.log('Received videos from API:', {
        count: videos.length,
        videos: videos.map((v: any) => ({
          taskId: v.taskId,
          prompt: v.prompt,
          status: v.status,
          hasVideoUrl: !!v.videoUrl
        }))
      });
      
      // Videos are already refreshed by the API
      setVideos(videos);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleVideoClick = async (video: VideoRecord) => {
    if (video.status !== 'completed') {
      return; // Only allow clicking on completed videos
    }

    setSelectedVideo(video);
    setModalOpen(true);
    setVideoLoading(true);
    setVideoError(null);

    try {
      // Fetch the latest video details from Kie API
      const response = await fetch(`/api/video/details?taskId=${encodeURIComponent(video.taskId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }

      const details = await response.json();
      if (details?.data?.videoUrl) {
        setSelectedVideo({
          ...video,
          videoUrl: details.data.videoUrl,
          status: details.data.status
        });
      } else {
        setVideoError('Video URL not available');
      }
    } catch (err) {
      console.error('Error fetching video details:', err);
      setVideoError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setVideoLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVideo(null);
    setVideoError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'generating':
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Play className="w-4 h-4" />;
      case 'generating':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <VideoIcon className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Fixed Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 border-b bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-left">
            <VideoIcon className="h-5 w-5" />
            <span className="text-lg font-semibold">Vimeo AI</span>
          </Link>
          {/* Right: user info + auth */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              Generate Video
            </Link>
            <UserInfoBadge />
            <AuthButton />
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
              <span className="text-sm text-gray-600 dark:text-neutral-400">Loading videos...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
              <Button 
                onClick={() => fetchVideos()} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && !error && (
            <>
              {/* Header with refresh button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Videos
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    {videos.length} video{videos.length !== 1 ? 's' : ''} total
                  </p>
                </div>
                <Button
                  onClick={() => fetchVideos(true)}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <VideoIcon className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No videos yet
                  </h3>
                  <p className="text-gray-600 dark:text-neutral-400 mb-4">
                    Start creating amazing videos with AI
                  </p>
                  <Link href="/">
                    <Button>
                      Generate Your First Video
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <Card 
                      key={video.taskId} 
                      className={`transition-all duration-200 ${
                        video.status === 'completed' 
                          ? 'cursor-pointer hover:shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-800' 
                          : 'cursor-default'
                      }`}
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="flex items-center space-x-4 p-4">
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0 w-24 h-16 bg-gray-100 dark:bg-neutral-800 rounded-lg relative group overflow-hidden">
                          {video.status === 'completed' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                              <div className="text-center">
                                <div className="w-8 h-8 mx-auto bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                  <Play className="w-4 h-4 text-white ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getStatusIcon(video.status)}
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          {/* <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(video.status)}`}>
                            {getStatusIcon(video.status)}
                            <span className="hidden sm:inline">{video.status}</span>
                          </div> */}

                          {/* Resolution Badge */}
                          {/* {video.resolution && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                              {video.resolution}
                            </div>
                          )} */}
                        </div>

                        {/* Video Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                                {video.prompt}
                              </h3>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(video.createTime)}
                                </span>
                                
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                  {video.tokensUsed || 10} tokens
                                </span>
                                
                                {/* <span className="font-mono text-xs">
                                  {video.taskId.substring(0, 8)}...
                                </span> */}
                              </div>

                              {/* {video.completeTime && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
                                  <Clock className="w-3 h-3" />
                                  <span>Completed: {formatDate(video.completeTime)}</span>
                                </div>
                              )} */}

                              {video.fallbackFlag && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                  Generated using fallback model
                                </div>
                              )}

                              {video.errorMessage && (
                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Error: {video.errorMessage}
                                </div>
                              )}
                            </div>

                            {/* Status and Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(video.status)}`}>
                                {getStatusIcon(video.status)}
                                <span className="hidden md:inline">{video.status}</span>
                              </div>
                              
                              {video.status === 'completed' && (
                                <div className="text-xs text-gray-500 dark:text-neutral-400">
                                  Click to view
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {modalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedVideo.prompt}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Task ID: {selectedVideo.taskId}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {videoLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
                  <span className="text-gray-600 dark:text-neutral-400">Loading video...</span>
                </div>
              ) : videoError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Failed to load video
                  </h4>
                  <p className="text-gray-600 dark:text-neutral-400 mb-4">
                    {videoError}
                  </p>
                  <Button onClick={closeModal} variant="outline">
                    Close
                  </Button>
                </div>
              ) : selectedVideo.videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={selectedVideo.videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                  </div>
                  
                  {/* Video Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-neutral-300">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVideo.status)}`}>
                        {selectedVideo.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-neutral-300">Resolution:</span>
                      <span className="ml-2 text-gray-600 dark:text-neutral-400">{selectedVideo.resolution}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-neutral-300">Created:</span>
                      <span className="ml-2 text-gray-600 dark:text-neutral-400">
                        {formatDate(selectedVideo.createTime)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-neutral-300">Tokens Used:</span>
                      <span className="ml-2 text-gray-600 dark:text-neutral-400">
                        {selectedVideo.tokensUsed || 10}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <Button
                      onClick={() => {
                        if (selectedVideo.videoUrl) {
                          window.open(selectedVideo.videoUrl, '_blank');
                        }
                      }}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Video
                    </Button>
                    <Button variant="outline" onClick={closeModal}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <VideoIcon className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Video not available
                  </h4>
                  <p className="text-gray-600 dark:text-neutral-400 mb-4">
                    The video URL could not be retrieved.
                  </p>
                  <Button onClick={closeModal} variant="outline">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              Terms of Use
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-600 text-center">
            © 2025 Next Video Gen. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default VideosPage;
