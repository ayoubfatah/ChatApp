"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface AudioMessagePlayerProps {
  audioData: string; // base64 audio data
  duration?: number;
  className?: string;
}

export default function AudioMessagePlayer({
  audioData,
  duration,
  className = "",
}: AudioMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAudio = () => {
    const link = document.createElement("a");
    link.href = audioData;
    link.download = `audio-message-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div
      className={`flex items-center space-x-3 p-3 bg-muted rounded-lg ${className}`}
    >
      <audio ref={audioRef} src={audioData} preload="metadata" />

      <Button
        onClick={togglePlayback}
        variant="ghost"
        size="sm"
        className="flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="w-full bg-background rounded-full h-2 relative overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-100 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      <Button
        onClick={downloadAudio}
        variant="ghost"
        size="sm"
        className="flex-shrink-0"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
