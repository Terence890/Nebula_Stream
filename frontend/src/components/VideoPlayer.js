import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { X } from 'lucide-react';

const VideoPlayer = ({ videoUrl, onClose, title }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play();
      });
      return () => hls.destroy();
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = videoUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play();
      });
    }
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="video-player">
      <div className="relative w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-3 transition-colors"
          data-testid="close-player-btn"
        >
          <X className="w-6 h-6" />
        </button>
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          data-testid="video-element"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;
