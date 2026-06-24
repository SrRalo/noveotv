import { useState, useEffect } from 'react';
import type { Channel } from '../types';
import { fetchChannels } from '../api/channels';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchChannels(selectedGroup ?? undefined)
      .then((data) => {
        setChannels(data.channels);
        setGroups(data.groups);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedGroup]);

  return { channels, groups, selectedGroup, setSelectedGroup, loading, error };
}
