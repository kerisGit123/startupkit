"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Settings, Download, Share2 } from "lucide-react";
import { StoryboardItem } from "../../types/storyboard";

interface VideoPlayerProps {
  items: StoryboardItem[];
  autoPlay?: boolean;
  showControls?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onItemChange?: (itemIndex: number) => void;
}

export function VideoPlayer({ 
  items, 
  autoPlay = false, 
  showControls = true,
  onTimeUpdate,
  onItemChange 
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentItemIndex];
  const totalDuration = items.length * 5; // 5 seconds per item by default

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleVideoEnded);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleVideoEnded);
      };
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      setCurrentTime(current);
      setDuration(total);
      
      // Calculate which item should be displayed based on time
      const itemIndex = Math.floor((current / total) * items.length);
      if (itemIndex !== currentItemIndex && itemIndex < items.length) {
        setCurrentItemIndex(itemIndex);
        onItemChange?.(itemIndex);
      }
      
      onTimeUpdate?.(current, total);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    if (currentItemIndex < items.length - 1) {
      // Move to next item
      setCurrentItemIndex(prev => prev + 1);
    } else {
      // End of storyboard
      setIsPlaying(false);
      setCurrentItemIndex(0);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipToItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentItemIndex(index);
      const time = (index / items.length) * duration;
      handleSeek(time);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Display */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {currentItem?.visual.imageUrl ? (
          <img
            src={currentItem.visual.imageUrl}
            alt={`Shot ${currentItem.id}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                🎬
              </div>
              <p className="text-white mb-2">Shot {currentItem?.id}</p>
              <p className="text-gray-400 text-sm">{currentItem?.script.action}</p>
            </div>
          </div>
        )}

        {/* Overlay Script */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="text-white">
            <h3 className="font-semibold mb-1">Shot {currentItem?.id}</h3>
            <p className="text-sm text-gray-300 mb-2">{currentItem?.script.action}</p>
            {currentItem?.script.dialogue && (
              <p className="text-blue-300 italic">"{currentItem.script.dialogue}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-3 text-xs text-white">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Previous Item */}
              <button
                onClick={() => skipToItem(currentItemIndex - 1)}
                disabled={currentItemIndex === 0}
                className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Next Item */}
              <button
                onClick={() => skipToItem(currentItemIndex + 1)}
                disabled={currentItemIndex === items.length - 1}
                className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speed */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Item Counter */}
              <span className="text-white text-sm">
                {currentItemIndex + 1} / {items.length}
              </span>

              {/* Action Buttons */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                <Download className="w-4 h-4" />
              </button>

              <button className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                <Share2 className="w-4 h-4" />
              </button>

              <button className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Navigation Dots */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => skipToItem(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentItemIndex
                ? 'bg-purple-500 w-3'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
