"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Settings,
} from "lucide-react";

interface RecordingPlayerProps {
  url: string;
  duration: number;
  title: string;
}

const RecordingPlayer = ({ url, duration, title }: RecordingPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleDownload = () => {
    // 다운로드 로직
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}_recording.mp4`;
    link.click();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateTime = () => setCurrentTime(video.currentTime);
      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", () => {
        setCurrentTime(0);
      });

      return () => {
        video.removeEventListener("timeupdate", updateTime);
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-black rounded-lg overflow-hidden">
      {/* 비디오 플레이어 */}
      <div className="relative aspect-video bg-gray-900">
        <video
          ref={videoRef}
          className="w-full h-full"
          src={url}
          onClick={handlePlayPause}
        />

        {/* 플레이 오버레이 */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <Play className="h-8 w-8 text-white ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-gray-800 text-white p-4">
        {/* 진행 바 */}
        <div className="mb-4">
          <div
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 재생/일시정지 */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-gray-700 rounded"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            {/* 스킵 버튼들 */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 hover:bg-gray-700 rounded"
              title="10초 뒤로"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2 hover:bg-gray-700 rounded"
              title="10초 앞으로"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMuteToggle}
                className="p-2 hover:bg-gray-700 rounded"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 재생 속도 */}
            <div className="relative group">
              <button className="p-2 hover:bg-gray-700 rounded text-sm">
                {playbackRate}x
              </button>
              <div className="absolute bottom-full mb-2 right-0 bg-gray-900 rounded-lg shadow-lg py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`block w-full px-4 py-1 text-left hover:bg-gray-700 ${
                      playbackRate === rate ? "text-blue-400" : ""
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* 다운로드 */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded"
              title="다운로드"
            >
              <Download className="h-5 w-5" />
            </button>

            {/* 전체화면 */}
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-gray-700 rounded"
              title="전체화면"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingPlayer;
