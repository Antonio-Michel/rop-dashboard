import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { RiskData, TierFilter, SortOption } from "./types";
import RiskSummaryBar from "./RiskSummaryBar";
import RiskFilterBar from "./RiskFilterBar";
import RiskTable from "./RiskTable";

const API_URL = import.meta.env.VITE_API_URL || "";

function RenewalRiskPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortOption>("score-desc");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const calculateRisk = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/properties/${propertyId}/renewal-risk/calculate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const result: RiskData = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    calculateRisk();
  }, [calculateRisk]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredResidents = data
    ? data.residents
        .filter((r) => filter === "all" || r.riskTier === filter)
        .sort((a, b) => {
          switch (sort) {
            case "score-desc": return b.riskScore - a.riskScore;
            case "score-asc": return a.riskScore - b.riskScore;
            case "name-asc": return a.name.localeCompare(b.name);
            case "name-desc": return b.name.localeCompare(a.name);
          }
        })
    : [];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="sticky top-0 z-10 bg-gray-50 py-3 -mx-8 px-8 border-b border-gray-100">
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Back to properties
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Renewal Risk Dashboard
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={calculateRisk}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !data && (
        <p className="text-gray-400 py-8 text-center">Calculating risk scores...</p>
      )}

      {data && (
        <>
          <RiskSummaryBar
            totalResidents={data.totalResidents}
            riskTiers={data.riskTiers}
            onRecalculate={calculateRisk}
            loading={loading}
          />

          <div className="mb-4">
            <RiskFilterBar activeFilter={filter} onFilterChange={setFilter} />
          </div>

          <RiskTable
            residents={filteredResidents}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            sort={sort}
            onSortChange={setSort}
          />

          <p className="mt-4 text-xs text-gray-400">
            Last calculated: {new Date(data.calculatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}

export default RenewalRiskPage;
