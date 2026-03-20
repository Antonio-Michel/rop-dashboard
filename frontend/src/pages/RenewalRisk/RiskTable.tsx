import { Resident, SortOption } from "./types";
import RiskTableRow from "./RiskTableRow";

interface Props {
  residents: Resident[];
  propertyId: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function SortIndicator({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>;
  return <span className="text-blue-600 dark:text-blue-400 ml-1">{direction === "asc" ? "↑" : "↓"}</span>;
}

function RiskTable({ residents, propertyId, expandedIds, onToggleExpand, sort, onSortChange }: Props) {
  const toggleSort = (field: "score" | "name") => {
    if (field === "score") {
      onSortChange(sort === "score-desc" ? "score-asc" : "score-desc");
    } else {
      onSortChange(sort === "name-asc" ? "name-desc" : "name-asc");
    }
  };

  if (residents.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-8">
        No residents match the selected filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th
              onClick={() => toggleSort("name")}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
            >
              Resident
              <SortIndicator active={sort.startsWith("name")} direction={sort === "name-asc" ? "asc" : "desc"} />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days to Expiry</th>
            <th
              onClick={() => toggleSort("score")}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
            >
              Risk Score
              <SortIndicator active={sort.startsWith("score")} direction={sort === "score-asc" ? "asc" : "desc"} />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk Tier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {residents.map((resident) => (
            <RiskTableRow
              key={resident.residentId}
              resident={resident}
              propertyId={propertyId}
              isExpanded={expandedIds.has(resident.residentId)}
              onToggle={() => onToggleExpand(resident.residentId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RiskTable;
