import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';

interface UseHlsPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  url: string;
  autoPlay?: boolean;
}

interface UseHlsPlayerReturn {
  error: boolean;
  loading: boolean;
  retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

export function useHlsPlayer({
  videoRef,
  url,
  autoPlay = true,
}: UseHlsPlayerOptions): UseHlsPlayerReturn {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSource = useCallback(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError(false);
    setLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data.type, data.details);
          setError(true);
          setLoading(false);

          if (retryCountRef.current < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCountRef.current];
            retryCountRef.current++;
            console.log(`HLS: Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            retryTimeoutRef.current = setTimeout(() => {
              loadSource();
            }, delay);
          }
        } else {
          console.warn('HLS non-fatal error:', data.type, data.details);
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        retryCountRef.current = 0;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setLoading(false);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [videoRef, url, autoPlay]);

  useEffect(() => {
    if (!url) return;
    loadSource();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      const hadPlayer = !!hlsRef.current;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (hadPlayer && videoRef.current) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [loadSource, videoRef, url]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    loadSource();
  }, [loadSource]);

  return { error, loading, retry };
}
