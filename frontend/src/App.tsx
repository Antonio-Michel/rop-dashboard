import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/properties`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch properties");
        return res.json();
      })
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          ROP — Residential Operating Platform
        </h1>
        <ThemeToggle />
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Select a property to view its renewal risk dashboard.</p>

      {loading && <p className="text-gray-400">Loading properties...</p>}
      {error && <p className="text-red-600 dark:text-red-400">Error: {error}</p>}

      <div className="space-y-3">
        {properties.map((p) => (
          <Link
            key={p.id}
            to={`/properties/${p.id}/renewal-risk`}
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition"
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {p.address}, {p.city}, {p.state} {p.zip_code}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default App;
