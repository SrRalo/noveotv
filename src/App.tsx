import { useState, useCallback } from 'react';
import { useChannels } from './hooks/useChannels';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelList } from './components/ChannelList';
import { CategoryFilter } from './components/CategoryFilter';
import { ThemeToggle } from './components/ThemeToggle';
import type { Channel } from './types';

const MAX_SLOTS = 4;
const SLOT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

export default function App() {
  const { channels, groups, selectedGroup, setSelectedGroup, loading } = useChannels();
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isMultiView, setIsMultiView] = useState(false);
  const [slots, setSlots] = useState<(Channel | null)[]>(Array(MAX_SLOTS).fill(null));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleChannelSelect = useCallback((ch: Channel) => {
    if (!isMultiView) {
      setCurrentChannel(ch);
      return;
    }
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s?.url === ch.url);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = null;
        return next;
      }
      const empty = prev.findIndex((s) => s === null);
      if (empty === -1) return prev;
      const next = [...prev];
      next[empty] = ch;
      return next;
    });
  }, [isMultiView]);

  const toggleMultiView = useCallback(() => {
    if (!isMultiView) {
      setIsMultiView(true);
    } else {
      setSlots(Array(MAX_SLOTS).fill(null));
      setIsMultiView(false);
    }
  }, [isMultiView]);

  const occupiedSlots = slots.filter(Boolean).length;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-indigo-600">Noveo</span>TV
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMultiView}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isMultiView
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            {isMultiView ? `${occupiedSlots}/${MAX_SLOTS}` : 'Multi'}
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            title={sidebarOpen ? 'Ocultar lista' : 'Mostrar lista'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
        <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <CategoryFilter
              groups={groups}
              selected={selectedGroup}
              onSelect={setSelectedGroup}
            />
          </div>
          {isMultiView && (
            <div className="grid grid-cols-2 gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
              {slots.map((s, i) => (
                <div
                  key={i}
                  className={`text-[11px] font-medium px-2 py-1 rounded text-center truncate ${
                    s
                      ? `${SLOT_COLORS[i]} text-white`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                  title={s?.name}
                >
                  {s ? s.name : `Slot ${i + 1}`}
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            <ChannelList
              channels={channels}
              selected={isMultiView ? null : currentChannel}
              onSelect={handleChannelSelect}
              loading={loading}
              slots={isMultiView ? slots : undefined}
            />
          </div>
        </aside>
        )}

        <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {isMultiView ? (
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {slots.map((s, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <VideoPlayer channel={s} />
                  {s && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium truncate px-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${SLOT_COLORS[i]} mr-1`} />
                      {s.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <VideoPlayer channel={currentChannel} />
              {currentChannel && (
                <div className="text-center">
                  <h2 className="text-lg font-semibold">{currentChannel.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentChannel.group}</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
