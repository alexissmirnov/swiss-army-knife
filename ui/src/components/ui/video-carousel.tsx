"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
}

const videos: Video[] = [
  {
    id: "1",
    title: "Binary Analysis Demo",
    description: "Watch Pwno autonomously analyze and exploit vulnerabilities in real binaries",
    youtubeId: "FYpdtcC71gg"
  },
  {
    id: "2", 
    title: "AutoGDB Integration",
    description: "See how our AI uses GDB to debug and exploit memory corruption bugs",
    youtubeId: "StND98K3eGI"
  },
  {
    id: "3",
    title: "End-to-End Exploitation",
    description: "Complete walkthrough from binary upload to working exploit generation",
    youtubeId: "lM66SQTGuNk"
  }
];

export default function VideoCarousel() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextVideo = useCallback(() => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
    setIsPlaying(false);
  }, []);

  const prevVideo = useCallback(() => {
    setCurrentVideo((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(false);
  }, []);

  const goToVideo = useCallback((index: number) => {
    setCurrentVideo(index);
    setIsPlaying(false);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Video Display */}
      <div className="relative rounded-2xl overflow-hidden border border-ds-gray-alpha-400 bg-ds-gray-alpha-100 backdrop-blur-sm">
        <div className="relative aspect-video bg-ds-gray-900">
          {isPlaying ? (
            <iframe
              src={`https://www.youtube.com/embed/${videos[currentVideo].youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={videos[currentVideo].title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
              <img
                src={`https://img.youtube.com/vi/${videos[currentVideo].youtubeId}/maxresdefault.jpg`}
                alt={videos[currentVideo].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-ds-background-100/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-8 w-8 text-ds-gray-1000 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Video Navigation Arrows */}
        <Button
          variant="outline"
          size="sm"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-ds-background-100/90 backdrop-blur-sm border-ds-gray-alpha-400 hover:bg-ds-background-100"
          onClick={prevVideo}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-ds-background-100/90 backdrop-blur-sm border-ds-gray-alpha-400 hover:bg-ds-background-100"
          onClick={nextVideo}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Info */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-medium text-ds-gray-1000 mb-2">
          {videos[currentVideo].title}
        </h3>
        <p className="text-ds-gray-900 leading-relaxed">
          {videos[currentVideo].description}
        </p>
      </div>

      {/* Video Indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToVideo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentVideo
                ? "w-8 bg-ds-gray-1000"
                : "w-2 bg-ds-gray-alpha-400 hover:bg-ds-gray-alpha-600"
            }`}
          />
        ))}
      </div>

      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {videos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => goToVideo(index)}
            className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
              index === currentVideo
                ? "ring-2 ring-ds-gray-1000 ring-offset-2 ring-offset-ds-background-100"
                : "hover:scale-105"
            }`}
          >
            <div className="aspect-video">
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {index !== currentVideo && (
                <div className="absolute inset-0 bg-black/40" />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">
                {video.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 