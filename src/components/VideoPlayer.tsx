import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel } from '../types';

interface Props {
  channel: Channel | null;
}

export function VideoPlayer({ channel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!channel || channel.type === 'embed') return;
    const video = videoRef.current;
    if (!video) return;

    setError(false);
    setLoading(true);
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(true);
          setLoading(false);
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      setLoading(false);
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      if (hls) hls.destroy();
      video.src = '';
    };
  }, [channel]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!channel) {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video">
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-xl">Selecciona un canal para reproducir</p>
        </div>
      </div>
    );
  }

  if (channel.type === 'embed') {
    return (
      <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
        <iframe
          ref={iframeRef}
          src={channel.url}
          className="w-full h-full"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ border: 0 }}
        />
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Pantalla completa"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            )}
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="w-full h-full"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">Señal no disponible</p>
        </div>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Pantalla completa"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isFullscreen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          )}
        </svg>
      </button>
    </div>
  );
}
