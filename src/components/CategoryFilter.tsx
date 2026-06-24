interface Props {
  groups: string[];
  selected: string | null;
  onSelect: (group: string | null) => void;
}

export function CategoryFilter({ groups, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          selected === null
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Todos
      </button>
      {groups.map((g) => (
        <button
          key={g}
          onClick={() => onSelect(g)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selected === g
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
