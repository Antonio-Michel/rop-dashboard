import { Signals } from "./types";

interface Props {
  signals: Signals;
}

function SignalBreakdown({ signals }: Props) {
  const items = [
    {
      label: "Days to Lease Expiry",
      value: `${signals.daysToExpiryDays} days`,
      flagged: signals.daysToExpiryDays <= 90,
    },
    {
      label: "Payment Delinquency",
      value: signals.paymentHistoryDelinquent ? "Late payments found" : "No late payments",
      flagged: signals.paymentHistoryDelinquent,
    },
    {
      label: "Renewal Offer",
      value: signals.noRenewalOfferYet ? "No offer sent" : "Offer on file",
      flagged: signals.noRenewalOfferYet,
    },
    {
      label: "Rent vs. Market Rate",
      value: signals.rentGrowthAboveMarket ? "Above 5% gap" : "Within market range",
      flagged: signals.rentGrowthAboveMarket,
    },
  ];

  return (
    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Signal Breakdown</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className={`font-medium ${item.flagged ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SignalBreakdown;
