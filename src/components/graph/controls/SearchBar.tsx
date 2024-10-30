interface SearchBarProps {
    onSearch: (term: string) => void;
  }
  
  export function SearchBar({ onSearch }: SearchBarProps) {
    return (
      <input
        type="text"
        placeholder="Search account IDs..."
        onChange={(e) => onSearch(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent text-black bg-white/90"
      />
    );
  }