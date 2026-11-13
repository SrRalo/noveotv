import { useEffect, useRef, useState, useCallback } from 'react';
import type { Channel } from '../types';
import { useHlsPlayer } from '../hooks/useHlsPlayer';
import { useShakaPlayer } from '../hooks/useShakaPlayer';

interface Props {
  channel: Channel | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  compact?: boolean;
}

interface SourcePickerProps {
  sources?: { tag: string; url: string }[];
  active: number;
  onSelect: (index: number) => void;
  compact?: boolean;
}

function SourcePicker({ sources, active, onSelect, compact }: SourcePickerProps) {
  if (!sources || sources.length < 2) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mt-1' : 'mt-3'}`}>
      {!compact && (
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Opciones:
        </span>
      )}
      {sources.map((source, i) => (
        <button
          key={`${source.tag}-${source.url}`}
          onClick={() => onSelect(i)}
          aria-label={`Reproducir ${source.tag}`}
          aria-pressed={i === active}
          title={source.url}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            i === active
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {source.tag}
        </button>
      ))}
    </div>
  );
}

export function VideoPlayer({ channel, videoRef: externalVideoRef, compact }: Props) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  const videoEl = externalVideoRef || internalVideoRef;
  const effectiveUrl = channel?.sources?.[sourceIndex]?.url ?? channel?.url ?? '';

  const isTs = channel?.type === 'ts';

  const hlsResult = useHlsPlayer({
    videoRef: videoEl,
    url: !isTs && channel?.type !== 'embed' ? effectiveUrl : '',
    autoPlay: true,
  });

  const shakaResult = useShakaPlayer({
    videoRef: videoEl,
    url: isTs ? effectiveUrl : '',
    autoPlay: true,
  });

  const { error, loading, retry } = isTs ? shakaResult : hlsResult;

  useEffect(() => {
    setSourceIndex(0);
  }, [channel?.id, channel?.url]);

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
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 rounded-xl overflow-hidden shadow-lg aspect-video">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center px-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-indigo-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-500/30">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Selecciona un canal</h2>
            <p className="text-sm text-gray-300 mb-4">Navega la lista y reproduce tu contenido favorito</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd>
                Seleccionar
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (channel.type === 'embed') {
    return (
      <>
        <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
          <iframe
            ref={iframeRef}
            key={sourceIndex}
            src={effectiveUrl}
            className="w-full h-full"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ border: 0 }}
          />
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:opacity-100"
            title="Pantalla completa (F)"
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
        <SourcePicker
          sources={channel.sources}
          active={sourceIndex}
          onSelect={setSourceIndex}
          compact={compact}
        />
      </>
    );
  }

  return (
    <>
    <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
      <video
        ref={videoEl}
        key={sourceIndex}
        controls
        autoPlay
        playsInline
        className="w-full h-full"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-300 animate-pulse">Cargando stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Señal no disponible</p>
            <p className="text-gray-400 text-sm mt-1">El stream no está accesible en este momento</p>
          </div>
          <button
            onClick={retry}
            aria-label="Reintentar reproducción"
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
          >
            Reintentar
          </button>
        </div>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Pantalla completa (F)"
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
      <SourcePicker
        sources={channel.sources}
        active={sourceIndex}
        onSelect={setSourceIndex}
        compact={compact}
      />
    </>
  );
}
