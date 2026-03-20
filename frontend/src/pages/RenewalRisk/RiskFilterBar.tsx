import { TierFilter } from "./types";

interface Props {
  activeFilter: TierFilter;
  onFilterChange: (filter: TierFilter) => void;
}

const filters: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function RiskFilterBar({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === f.value
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export default RiskFilterBar;
