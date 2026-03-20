export interface Signals {
  daysToExpiryDays: number;
  paymentHistoryDelinquent: boolean;
  noRenewalOfferYet: boolean;
  rentGrowthAboveMarket: boolean;
}

export interface Resident {
  residentId: string;
  name: string;
  unitNumber: string;
  riskScore: number;
  riskTier: "high" | "medium" | "low";
  daysToExpiry: number;
  signals: Signals;
}

export interface RiskTiers {
  high: number;
  medium: number;
  low: number;
}

export interface RiskData {
  propertyId: string;
  calculatedAt: string;
  totalResidents: number;
  riskTiers: RiskTiers;
  residents: Resident[];
}

export type TierFilter = "all" | "high" | "medium" | "low";

export type SortOption = "score-desc" | "score-asc" | "name-asc" | "name-desc";
