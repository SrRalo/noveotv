import { useEffect, useRef, useCallback, useState } from 'react';
import shaka from 'shaka-player';

interface UseShakaPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  url: string;
  autoPlay?: boolean;
}

interface UseShakaPlayerReturn {
  error: boolean;
  loading: boolean;
  retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

export function useShakaPlayer({
  videoRef,
  url,
  autoPlay = true,
}: UseShakaPlayerOptions): UseShakaPlayerReturn {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const playerRef = useRef<shaka.Player | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSource = useCallback(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError(false);
    setLoading(true);

    if (playerRef.current) {
      playerRef.current.detach();
      playerRef.current.destroy();
      playerRef.current = null;
    }

    if (!shaka.Player.isBrowserSupported()) {
      console.error('shaka-player: Browser not supported');
      setError(true);
      setLoading(false);
      return;
    }

    console.log('shaka-player: Creating player for URL:', url);

    const player = new shaka.Player(video);
    playerRef.current = player;

    player.configure({
      streaming: {
        lowLatencyEnabled: true,
        rebufferingGoal: 2,
        bufferingGoal: 5,
        bufferBehind: 10,
        infiniteResume: false,
        forceTransmuxTS: true,
      },
      manifest: {
        autoCorrectDrift: true,
      },
      abr: {
        enabled: true,
        defaultBandwidthEstimate: 1000000,
      },
    });

    player.addEventListener('error', (event: Event) => {
      const shakaError = (event as unknown as { detail: shaka.util.Error }).detail;
      console.error('shaka-player error:', shakaError.code, shakaError.message);
      setError(true);
      setLoading(false);

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCountRef.current];
        retryCountRef.current++;
        console.log(`shaka-player: Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        retryTimeoutRef.current = setTimeout(() => {
          loadSource();
        }, delay);
      }
    });

    player.addEventListener('loading', () => {
      console.log('shaka-player: Loading...');
    });

    player.addEventListener('loaded', () => {
      console.log('shaka-player: Loaded');
      setLoading(false);
      retryCountRef.current = 0;
    });

    player.addEventListener('playing', () => {
      console.log('shaka-player: Playing');
      setLoading(false);
    });

    video.addEventListener('error', () => {
      const mediaError = video.error;
      if (mediaError) {
        console.error('Video element error:', mediaError.code, mediaError.message);
        if (mediaError.code === MediaError.MEDIA_ERR_DECODE) {
          console.log('shaka-player: Recovering from decode error...');
          player.unload().then(() => {
            player.load(url).catch((err: Error) => {
              console.error('shaka-player: Failed to reload:', err);
            });
          });
        }
      }
    });

    console.log('shaka-player: Loading source...');
    player.load(url).then(() => {
      console.log('shaka-player: Source loaded successfully');
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }).catch((err: Error) => {
      console.error('shaka-player: Failed to load source:', err);
      setError(true);
      setLoading(false);
    });
  }, [videoRef, url, autoPlay]);

  useEffect(() => {
    if (!url) return;
    loadSource();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      const hadPlayer = !!playerRef.current;
      if (playerRef.current) {
        try { playerRef.current.detach(); } catch {}
        playerRef.current.destroy();
        playerRef.current = null;
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
