import { Resident } from "./types";
import SignalBreakdown from "./SignalBreakdown";

interface Props {
  resident: Resident;
  isExpanded: boolean;
  onToggle: () => void;
}

const tierStyles = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

function RiskTableRow({ resident, isExpanded, onToggle }: Props) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <td className="px-6 py-4 text-sm text-gray-900">{resident.name}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{resident.unitNumber}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{resident.daysToExpiry}</td>
        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{resident.riskScore}</td>
        <td className="px-6 py-4">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${tierStyles[resident.riskTier]}`}>
            {resident.riskTier}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-400">
          {isExpanded ? "▲" : "▼"}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6}>
            <SignalBreakdown signals={resident.signals} />
          </td>
        </tr>
      )}
    </>
  );
}

export default RiskTableRow;
