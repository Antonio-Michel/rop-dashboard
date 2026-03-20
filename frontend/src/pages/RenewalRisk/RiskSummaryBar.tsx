import { RiskTiers } from "./types";

interface Props {
  totalResidents: number;
  riskTiers: RiskTiers;
  onRecalculate: () => void;
  loading: boolean;
}

function RiskSummaryBar({ totalResidents, riskTiers, onRecalculate, loading }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-6">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{totalResidents}</span> residents scored
        </p>
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="font-medium">{riskTiers.high}</span>
            <span className="text-gray-500">high</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="font-medium">{riskTiers.medium}</span>
            <span className="text-gray-500">medium</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="font-medium">{riskTiers.low}</span>
            <span className="text-gray-500">low</span>
          </span>
        </div>
      </div>
      <button
        onClick={onRecalculate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Calculating..." : "Recalculate Scores"}
      </button>
    </div>
  );
}

export default RiskSummaryBar;
