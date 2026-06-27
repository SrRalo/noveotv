import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebar(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleChannelSelect = useCallback((ch: Channel) => {
    if (!isMultiView) {
      setCurrentChannel(ch);
      if (isMobile) setMobileSidebar(false);
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
  }, [isMultiView, isMobile]);

  const toggleMultiView = useCallback(() => {
    if (!isMultiView) {
      setIsMultiView(true);
    } else {
      setSlots(Array(MAX_SLOTS).fill(null));
      setIsMultiView(false);
    }
  }, [isMultiView]);

  const occupiedSlots = slots.filter(Boolean).length;

  const channelsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of channels) {
      counts[ch.group] = (counts[ch.group] || 0) + 1;
    }
    return counts;
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return selectedGroup
      ? channels.filter((c) => c.group === selectedGroup)
      : channels;
  }, [channels, selectedGroup]);

  const visibleChannels = useMemo(() => {
    if (!search) return filteredChannels;
    const q = search.toLowerCase();
    return filteredChannels.filter((c) => c.name.toLowerCase().includes(q));
  }, [filteredChannels, search]);

  const selectedIndex = useMemo(() => {
    return visibleChannels.findIndex((c) => c.url === currentChannel?.url);
  }, [visibleChannels, currentChannel?.url]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'IFRAME') return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case 'ArrowDown':
        case 'ArrowUp': {
          e.preventDefault();
          if (visibleChannels.length === 0) break;
          const dir = e.key === 'ArrowDown' ? 1 : -1;
          const next = ((selectedIndex + dir) % visibleChannels.length + visibleChannels.length) % visibleChannels.length;
          handleChannelSelect(visibleChannels[next]);
          break;
        }
        case 'Enter':
          e.preventDefault();
          if (visibleChannels[selectedIndex]) {
            handleChannelSelect(visibleChannels[selectedIndex]);
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMultiView();
          break;
        case 'Escape':
          if (mobileSidebar) setMobileSidebar(false);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visibleChannels, selectedIndex, handleChannelSelect, toggleMultiView, mobileSidebar]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:block p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
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
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-indigo-600">Noveo</span>TV
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => { if (isMobile) setMobileSidebar(true); else setSidebarOpen(true); }}
              className="md:hidden p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              title="Mostrar lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <button
            onClick={toggleMultiView}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isMultiView
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title="Multivista (M)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            {isMultiView ? `${occupiedSlots}/${MAX_SLOTS}` : 'Multi'}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar para desktop */}
        {sidebarOpen && !isMobile && (
        <aside className="w-72 lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700">
            <CategoryFilter
              groups={groups}
              selected={selectedGroup}
              onSelect={setSelectedGroup}
              counts={channelsWithCounts}
            />
          </div>
          <div className="px-3 lg:px-4 pt-3 pb-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar canales... (/)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              />
            </div>
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
          <div className="flex-1 overflow-y-auto p-3 lg:p-4">
            <ChannelList
              channels={visibleChannels}
              selected={isMultiView ? null : currentChannel}
              onSelect={handleChannelSelect}
              loading={loading}
              slots={isMultiView ? slots : undefined}
              search={search}
            />
          </div>
        </aside>
        )}

        {/* Sidebar móvil (overlay) */}
        {isMobile && mobileSidebar && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSidebar(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-80 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-sm">Canales</h2>
                <button
                  onClick={() => setMobileSidebar(false)}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <CategoryFilter
                  groups={groups}
                  selected={selectedGroup}
                  onSelect={(g) => { setSelectedGroup(g); }}
                  counts={channelsWithCounts}
                />
              </div>
              <div className="px-3 pt-3 pb-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar canales..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                  />
                </div>
              </div>
              {isMultiView && (
                <div className="grid grid-cols-2 gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
                  {slots.map((s, i) => (
                    <div key={i} className={`text-[11px] font-medium px-2 py-1 rounded text-center truncate ${s ? `${SLOT_COLORS[i]} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`} title={s?.name}>
                      {s ? s.name : `Slot ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-3">
                <ChannelList
                  channels={visibleChannels}
                  selected={isMultiView ? null : currentChannel}
                  onSelect={handleChannelSelect}
                  loading={loading}
                  slots={isMultiView ? slots : undefined}
                  search={search}
                />
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto">
          {isMultiView ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 content-start">
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
              <VideoPlayer channel={currentChannel} videoRef={videoRef} />
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

      {!isMobile && (
        <div className="hidden md:block fixed bottom-3 left-3 text-[11px] text-gray-400 opacity-60">
          ↑ ↓ Navegar · Enter Seleccionar · M Multivista · F Pantalla completa · / Buscar
        </div>
      )}
    </div>
  );
}
