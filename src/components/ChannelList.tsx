import type { Channel } from '../types';

const SLOT_LABELS = ['1', '2', '3', '4'];
const SLOT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

interface Props {
  channels: Channel[];
  selected: Channel | null;
  onSelect: (channel: Channel) => void;
  loading: boolean;
  slots?: (Channel | null)[];
}

export function ChannelList({ channels, selected, onSelect, loading, slots }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return <p className="text-gray-500 text-center py-8">No hay canales disponibles</p>;
  }

  return (
    <div className="space-y-1">
      {channels.map((ch, i) => {
        const slotIndexes = slots
          ? slots.reduce<number[]>((acc, s, idx) => (s?.url === ch.url ? [...acc, idx] : acc), [])
          : [];

        return (
          <button
            key={`${ch.name}-${i}`}
            onClick={() => onSelect(ch)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              slots ? '' : selected?.url === ch.url
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${
              slots && slotIndexes.length > 0
                ? 'ring-2 ring-indigo-500/50 bg-gray-100 dark:bg-gray-800'
                : slots
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              <span className="text-sm font-medium block truncate">{ch.name}</span>
              <span className="text-xs opacity-60">{ch.group}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
