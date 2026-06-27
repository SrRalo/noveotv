import { useMemo } from 'react';
import type { Channel } from '../types';

const SLOT_LABELS = ['1', '2', '3', '4'];
const SLOT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

interface Props {
  channels: Channel[];
  selected: Channel | null;
  onSelect: (channel: Channel) => void;
  loading: boolean;
  slots?: (Channel | null)[];
  search?: string;
}

function formatEventTime(ch: Channel): string {
  if (!ch.startsAt) return '';
  const now = Math.floor(Date.now() / 1000);
  if (ch.startsAt > now) {
    const min = Math.round((ch.startsAt - now) / 60);
    if (min < 60) return `En ${min} min`;
    const hrs = Math.floor(min / 60);
    return `En ${hrs}h ${min % 60}min`;
  }
  if (ch.endsAt && ch.endsAt > now) return 'EN VIVO';
  if (ch.endsAt && ch.endsAt <= now) return 'Finalizado';
  return '';
}

export function ChannelList({ channels, selected, onSelect, loading, slots, search }: Props) {
  const filtered = useMemo(() => {
    if (!search) return channels;
    const q = search.toLowerCase();
    return channels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, search]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        {search ? 'Sin resultados' : 'No hay canales disponibles'}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((ch, i) => {
        const slotIndexes = slots
          ? slots.reduce<number[]>((acc, s, idx) => (s?.url === ch.url ? [...acc, idx] : acc), [])
          : [];
        const isSelected = !slots && selected?.url === ch.url;
        const eventTime = formatEventTime(ch);

        return (
          <button
            key={`${ch.name}-${i}`}
            onClick={() => onSelect(ch)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${
              slots && slotIndexes.length > 0
                ? 'ring-2 ring-indigo-500/50 bg-gray-100 dark:bg-gray-800'
                : ''
            }`}
          >
            {slots && slotIndexes.map((si) => (
              <span
                key={si}
                className={`text-[10px] font-bold ${SLOT_COLORS[si]} text-white px-1.5 py-0.5 rounded`}
              >
                {SLOT_LABELS[si]}
              </span>
            ))}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium block truncate ${isSelected ? 'text-white' : ''}`}>
                  {ch.name}
                </span>
                {ch.type === 'embed' ? (
                  <span className={`text-[10px] font-semibold px-1 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Embed
                  </span>
                ) : (
                  <span className={`text-[10px] font-semibold px-1 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    HLS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isSelected ? 'text-white/70' : 'opacity-60'}`}>
                  {ch.group}
                </span>
                {eventTime && (
                  <span className={`text-[11px] font-semibold ${
                    eventTime === 'EN VIVO'
                      ? 'text-red-500 animate-pulse'
                      : eventTime === 'Finalizado'
                        ? 'opacity-40'
                        : isSelected ? 'text-white/70' : 'text-indigo-500 dark:text-indigo-400'
                  }`}>
                    {eventTime}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
