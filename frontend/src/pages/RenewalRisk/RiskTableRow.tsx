import { useState } from "react";
import { Resident } from "./types";
import SignalBreakdown from "./SignalBreakdown";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Props {
  resident: Resident;
  propertyId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const tierStyles = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

type TriggerStatus = "idle" | "sending" | "success" | "error";

function RiskTableRow({ resident, propertyId, isExpanded, onToggle }: Props) {
  const [triggerStatus, setTriggerStatus] = useState<TriggerStatus>("idle");

  const handleTrigger = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTriggerStatus("sending");

    try {
      const res = await fetch(
        `${API_URL}/api/v1/properties/${propertyId}/residents/${resident.residentId}/trigger-renewal`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      setTriggerStatus("success");
    } catch {
      setTriggerStatus("error");
    }
  };

  return (
    <>
      <tr
        onClick={onToggle}
        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
      >
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{resident.name}</td>
        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{resident.unitNumber}</td>
        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{resident.daysToExpiry}</td>
        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{resident.riskScore}</td>
        <td className="px-6 py-4">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${tierStyles[resident.riskTier]}`}>
            {resident.riskTier}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">
          {triggerStatus === "idle" && (
            <button
              onClick={handleTrigger}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Trigger Renewal
            </button>
          )}
          {triggerStatus === "sending" && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Sending...</span>
          )}
          {triggerStatus === "success" && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Sent</span>
          )}
          {triggerStatus === "error" && (
            <button
              onClick={handleTrigger}
              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              Failed — Retry
            </button>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">
          {isExpanded ? "▲" : "▼"}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7}>
            <SignalBreakdown signals={resident.signals} />
          </td>
        </tr>
      )}
    </>
  );
}

export default RiskTableRow;
