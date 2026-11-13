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
          <div 
            key={i} 
            className="h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse bg-[length:200%_100%] animate-shimmer"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {search ? 'Sin resultados' : 'No hay canales disponibles'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {search ? `No se encontraron canales para "${search}"` : 'Intenta recargar la página'}
        </p>
      </div>
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
            aria-label={`Seleccionar canal ${ch.name}`}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              isSelected
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.01] hover:shadow-md'
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
                {ch.sources && ch.sources.length > 1 && (
                  <span
                    title={`${ch.sources.length} opciones de reproducción`}
                    className={`text-[10px] font-semibold px-1 py-0.5 rounded shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {ch.sources.length} opc.
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
