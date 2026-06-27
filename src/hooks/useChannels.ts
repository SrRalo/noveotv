import { useState, useEffect, useRef } from 'react';
import type { Channel } from '../types';
import { fetchChannels } from '../api/channels';
import { fetchPpvStreams } from '../api/ppv';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ppvRef = useRef<Channel[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [m3uData, ppvStreams] = await Promise.all([
          fetchChannels(),
          fetchPpvStreams(),
        ]);
        ppvRef.current = ppvStreams;
        const all = [...m3uData.channels, ...ppvStreams];
        setChannels(selectedGroup
          ? all.filter((c) => c.group === selectedGroup)
          : all
        );
        setGroups([...new Set(all.map((c) => c.group))]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(async () => {
      const ppvStreams = await fetchPpvStreams();
      ppvRef.current = ppvStreams;
      const [m3uData] = await Promise.all([fetchChannels()]);
      const all = [...m3uData.channels, ...ppvStreams];
      setChannels((prev) => {
        const filtered = all.filter((c) =>
          selectedGroup ? c.group === selectedGroup : true
        );
        if (JSON.stringify(prev.map((c) => c.url)) === JSON.stringify(filtered.map((c) => c.url))) {
          return prev;
        }
        return filtered;
      });
      setGroups([...new Set(all.map((c) => c.group))]);
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedGroup]);

  return { channels, groups, selectedGroup, setSelectedGroup, loading, error };
}
