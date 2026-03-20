import express from "express";
import cors from "cors";
import { pool } from "./db";

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

// Get the seeded property (convenience endpoint for the frontend)
app.get("/api/v1/properties", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, address, city, state, zip_code FROM properties WHERE status = 'active'"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Calculate renewal risk scores for all active residents in a property
app.post("/api/v1/properties/:propertyId/renewal-risk/calculate", async (req, res) => {
  const { propertyId } = req.params;

  try {
    // Validate property exists
    const propertyResult = await pool.query(
      "SELECT id FROM properties WHERE id = $1 AND status = 'active'",
      [propertyId]
    );
    if (propertyResult.rows.length === 0) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    // Query 1: Active residents with lease and unit data
    const residentsResult = await pool.query(
      `SELECT r.id as resident_id, r.first_name, r.last_name,
              u.id as unit_id, u.unit_number,
              l.id as lease_id, l.monthly_rent, l.lease_end_date,
              (l.lease_end_date - CURRENT_DATE) as days_to_expiry
       FROM residents r
       JOIN leases l ON l.resident_id = r.id AND l.status = 'active'
       JOIN units u ON u.id = r.unit_id
       WHERE r.property_id = $1 AND r.status = 'active'`,
      [propertyId]
    );

    if (residentsResult.rows.length === 0) {
      res.status(404).json({ error: "No active residents found for this property" });
      return;
    }

    // Query 2: Delinquent residents (any late_fee in last 6 months)
    const delinquentResult = await pool.query(
      `SELECT DISTINCT resident_id
       FROM resident_ledger
       WHERE property_id = $1
         AND charge_code = 'late_fee'
         AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'`,
      [propertyId]
    );
    const delinquentSet = new Set(delinquentResult.rows.map((r: any) => r.resident_id));

    // Query 3: Leases that have renewal offers
    const offersResult = await pool.query(
      `SELECT DISTINCT lease_id FROM renewal_offers WHERE property_id = $1`,
      [propertyId]
    );
    const offersSet = new Set(offersResult.rows.map((r: any) => r.lease_id));

    // Query 4: Latest market rent per unit
    const pricingResult = await pool.query(
      `SELECT DISTINCT ON (unit_id) unit_id, market_rent
       FROM unit_pricing
       ORDER BY unit_id, effective_date DESC`
    );
    const marketRentMap = new Map(
      pricingResult.rows.map((r: any) => [r.unit_id, parseFloat(r.market_rent)])
    );

    const calculatedAt = new Date().toISOString();
    const riskTiers = { high: 0, medium: 0, low: 0 };
    const residents: any[] = [];

    for (const row of residentsResult.rows) {
      const daysToExpiry = parseInt(row.days_to_expiry);
      const monthlyRent = parseFloat(row.monthly_rent);
      const isDelinquent = delinquentSet.has(row.resident_id);
      const hasRenewalOffer = offersSet.has(row.lease_id);
      const marketRent = marketRentMap.get(row.unit_id) || monthlyRent;
      const rentGapPct = ((marketRent - monthlyRent) / monthlyRent) * 100;

      // Signal scores
      const daysScore = daysToExpiry <= 90 ? 100 : daysToExpiry <= 180 ? 50 : 10;
      const delinquencyScore = isDelinquent ? 100 : 0;
      const noOfferScore = hasRenewalOffer ? 0 : 100;
      const rentGapScore = rentGapPct >= 10 ? 100 : rentGapPct >= 5 ? 50 : 0;

      // Base score
      let score = Math.round(
        daysScore * 0.40 +
        delinquencyScore * 0.25 +
        noOfferScore * 0.20 +
        rentGapScore * 0.15
      );

      // Interaction bonuses
      if (isDelinquent && !hasRenewalOffer) score += 10;
      if (daysToExpiry <= 30 && rentGapPct > 10) score += 15;
      if (isDelinquent && daysToExpiry <= 60) score += 10;

      // Cap at 100
      score = Math.min(score, 100);

      const riskTier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
      riskTiers[riskTier]++;

      // Store in database
      await pool.query(
        `INSERT INTO renewal_risk_scores
          (property_id, resident_id, lease_id, risk_score, risk_tier, days_to_expiry, is_delinquent, has_renewal_offer, rent_gap_pct, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [propertyId, row.resident_id, row.lease_id, score, riskTier, daysToExpiry, isDelinquent, hasRenewalOffer, Math.round(rentGapPct * 100) / 100, calculatedAt]
      );

      residents.push({
        residentId: row.resident_id,
        name: `${row.first_name} ${row.last_name}`,
        unitNumber: row.unit_number,
        riskScore: score,
        riskTier,
        daysToExpiry,
        signals: {
          daysToExpiryDays: daysToExpiry,
          paymentHistoryDelinquent: isDelinquent,
          noRenewalOfferYet: !hasRenewalOffer,
          rentGrowthAboveMarket: rentGapPct >= 5,
        },
      });
    }

    // Sort by risk score descending
    residents.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      propertyId,
      calculatedAt,
      totalResidents: residents.length,
      riskTiers,
      residents,
    });
  } catch (err: any) {
    console.error("Risk calculation error:", err);
    res.status(500).json({ error: "Failed to calculate renewal risk scores" });
  }
});

// Trigger renewal event — forwards risk data to mock RMS webhook
app.post("/api/v1/properties/:propertyId/residents/:residentId/trigger-renewal", async (req, res) => {
  const { propertyId, residentId } = req.params;
  const mockRmsUrl = process.env.MOCK_RMS_URL;

  if (!mockRmsUrl) {
    res.status(500).json({ error: "MOCK_RMS_URL not configured" });
    return;
  }

  try {
    // Get the latest risk score for this resident
    const scoreResult = await pool.query(
      `SELECT risk_score, risk_tier, days_to_expiry
       FROM renewal_risk_scores
       WHERE property_id = $1 AND resident_id = $2
       ORDER BY calculated_at DESC
       LIMIT 1`,
      [propertyId, residentId]
    );

    if (scoreResult.rows.length === 0) {
      res.status(404).json({ error: "No risk score found for this resident. Run a calculation first." });
      return;
    }

    const { risk_score, risk_tier, days_to_expiry } = scoreResult.rows[0];

    const payload = {
      event: "renewal.risk_flagged",
      eventId: `evt-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      propertyId,
      residentId,
      data: {
        riskScore: risk_score,
        riskTier: risk_tier,
        daysToExpiry: days_to_expiry,
      },
    };

    const rmsResponse = await fetch(mockRmsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!rmsResponse.ok) {
      throw new Error(`RMS responded with ${rmsResponse.status}`);
    }

    res.json({ success: true, eventId: payload.eventId });
  } catch (err: any) {
    console.error("Trigger renewal error:", err);
    res.status(500).json({ error: "Failed to trigger renewal event" });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ Mock RMS URL: ${process.env.MOCK_RMS_URL || "not configured"}`);
});
