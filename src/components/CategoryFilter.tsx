interface Props {
  groups: string[];
  selected: string | null;
  onSelect: (group: string | null) => void;
  counts?: Record<string, number>;
}

export function CategoryFilter({ groups, selected, onSelect, counts }: Props) {
  const total = groups.reduce((s, g) => s + (counts?.[g] ?? 0), 0);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onSelect(null)}
        aria-label="Mostrar todos los canales"
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:scale-105 active:scale-95 ${
          selected === null
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Todos
        {total > 0 && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            selected === null ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600'
          }`}>
            {total}
          </span>
        )}
      </button>
      {groups.map((g) => {
        const cnt = counts?.[g] ?? 0;
        const isLive = g.startsWith('En Vivo');
        return (
          <button
            key={g}
            onClick={() => onSelect(g)}
            aria-label={`Filtrar por ${g}`}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:scale-105 active:scale-95 ${
              selected === g
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : isLive
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {g}
            {cnt > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                selected === g ? 'bg-white/20' : isLive ? 'bg-red-200 dark:bg-red-800/50' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                {cnt}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
