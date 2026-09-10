import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronLeft, Filter, Map, RotateCcw } from "lucide-react";

import {
  getCrimeMapLocationDetails,
  getCrimeMapOverview,
} from "../../features/map/api";
import CrimeMap from "../../features/map/components/CrimeMap";
import "../../styles/map.css";

const initialFilters = {
  groupBy: "DISTRICT",
  densityInterval: "MONTH",
  dateField: "INCIDENT_DATE",
  crimeCategory: "",
  status: "",
  year: "",
  registrationDateFrom: "",
  registrationDateTo: "",
};

function DensityChart({ density }) {
  if (!density.length) {
    return <p className="map-empty-copy">No historical periods match the selected filters.</p>;
  }
  const maximum = Math.max(...density.map((item) => item.caseCount), 1);

  return (
    <div className="density-chart" aria-label="Historical case density">
      {density.map((bucket) => (
        <div className="density-column" key={bucket.period} title={`${bucket.period}: ${bucket.caseCount} cases`}>
          <span className="density-value">{bucket.caseCount}</span>
          <span
            className="density-bar"
            style={{ height: `${Math.max((bucket.caseCount / maximum) * 100, 6)}%` }}
          />
          <span className="density-period">{bucket.period}</span>
        </div>
      ))}
    </div>
  );
}

function DistributionList({ title, items }) {
  return (
    <section className="map-detail-section">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="map-distribution-list">
          {items.map((item) => (
            <li key={item.value}><span>{item.value}</span><strong>{item.count}</strong></li>
          ))}
        </ul>
      ) : <p className="map-empty-copy">No matching records.</p>}
    </section>
  );
}

export default function CrimeMapPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [overview, setOverview] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;

    void getCrimeMapOverview(filters)
      .then((data) => {
        if (current) setOverview(data);
      })
      .catch((requestError) => {
        if (!current) return;
        setError(requestError.response?.data?.message || "Unable to load live crime map data.");
        setOverview(null);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [filters]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setSelectedLocation(null);
    setDetails(null);
    setError("");
    setLoading(true);
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const selectLocation = async (location) => {
    setSelectedLocation(location);
    setDetails(null);
    try {
      setDetailLoading(true);
      const data = await getCrimeMapLocationDetails(filters.groupBy, location.id, filters);
      setDetails(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load location details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const options = overview?.filterOptions || {
    crimeCategories: [], statuses: [], years: [],
  };
  const visibleLocations = overview?.locations || [];
  const geocodedLocations = visibleLocations.filter((location) => location.coordinates).length;

  return (
    <main className="crime-map-page">
      <header className="crime-map-header">
        <div>
          <Link className="map-back-link" to="/dashboard"><ChevronLeft size={15} /> Dashboard</Link>
          <span className="map-eyebrow">PHASE 7 / HISTORICAL CASE DENSITY</span>
          <h1>Interactive Crime Map</h1>
          <p>FIR-backed district and police-station concentration. Points appear only where verified coordinates are stored.</p>
        </div>
        <div className="map-safeguard"><AlertCircle size={18} /><span>Descriptive planning support — not individual predictive policing.</span></div>
      </header>

      <section className="map-filter-panel" aria-label="Crime map filters">
        <div className="map-filter-title"><Filter size={17} /><span>LIVE FIR FILTERS</span></div>
        <label><span>View</span><select name="groupBy" value={filters.groupBy} onChange={updateFilter}><option value="DISTRICT">Districts</option><option value="POLICE_STATION">Police stations</option></select></label>
        <label><span>Crime category</span><select name="crimeCategory" value={filters.crimeCategory} onChange={updateFilter}><option value="">All categories</option>{options.crimeCategories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Status</span><select name="status" value={filters.status} onChange={updateFilter}><option value="">All statuses</option>{options.statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
        <label><span>Year</span><select name="year" value={filters.year} onChange={updateFilter}><option value="">All years</option>{options.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Date from</span><input name="registrationDateFrom" type="date" value={filters.registrationDateFrom} onChange={updateFilter} /></label>
        <label><span>Date to</span><input name="registrationDateTo" type="date" value={filters.registrationDateTo} onChange={updateFilter} /></label>
        <label><span>Density</span><select name="densityInterval" value={filters.densityInterval} onChange={updateFilter}><option value="MONTH">Monthly</option><option value="YEAR">Yearly</option></select></label>
        <label><span>Density date</span><select name="dateField" value={filters.dateField} onChange={updateFilter}><option value="INCIDENT_DATE">Incident date</option><option value="REGISTRATION_DATE">Registration date</option></select></label>
        <button className="map-reset-button" type="button" onClick={() => { setFilters({ ...initialFilters }); setDetails(null); setSelectedLocation(null); setError(""); setLoading(true); }}><RotateCcw size={15} /> Reset</button>
      </section>

      {error && <div className="map-error" role="alert">{error}</div>}

      <section className="map-summary-grid" aria-live="polite">
        <article><span>Matching FIRs</span><strong>{overview?.totalCases ?? "—"}</strong></article>
        <article><span>Mapped FIRs</span><strong>{overview?.geocodedCases ?? "—"}</strong></article>
        <article><span>Visible {filters.groupBy === "DISTRICT" ? "districts" : "stations"}</span><strong>{geocodedLocations}</strong></article>
        <article><span>Unlocated FIRs</span><strong>{overview?.unlocatedCases ?? "—"}</strong></article>
      </section>

      <section className="map-workspace">
        <div className="map-card map-canvas-card">
          <div className="map-card-header"><div><span>CASE CONCENTRATION</span><h2>{filters.groupBy === "DISTRICT" ? "District visualization" : "Police station visualization"}</h2></div><Map size={20} /></div>
          {loading ? <div className="crime-map-empty">Loading live FIR map data…</div> : <CrimeMap locations={visibleLocations} groupBy={filters.groupBy} onLocationSelect={selectLocation} />}
          <footer className="map-legend"><span><i className="legend-low" />Lower historical volume</span><span><i className="legend-mid" />Medium historical volume</span><span><i className="legend-high" />Higher historical volume</span></footer>
        </div>

        <aside className="map-card map-detail-card">
          {!selectedLocation && <div className="map-detail-placeholder"><Map size={24} /><h2>Select a point</h2><p>Choose a district or police station to inspect historical density, categories, status, and recent FIRs.</p></div>}
          {detailLoading && <div className="map-detail-placeholder">Loading location details…</div>}
          {details && !detailLoading && <>
            <div className="map-card-header"><div><span>{details.groupBy.replaceAll("_", " ")}</span><h2>{details.name}</h2></div><button type="button" className="map-close-detail" onClick={() => { setSelectedLocation(null); setDetails(null); }}>Close</button></div>
            <div className="map-location-stats"><span><strong>{details.caseCount}</strong> matching FIRs</span><span><strong>{details.geocodedCaseCount}</strong> with verified coordinates</span></div>
            <section className="map-detail-section"><h3>Historical density</h3><DensityChart density={details.historicalDensity} /></section>
            <DistributionList title="Crime categories" items={details.crimeCategories} />
            <DistributionList title="Case status" items={details.statuses} />
            <section className="map-detail-section"><h3>Recent matching FIRs</h3><ul className="map-recent-cases">{details.recentCases.map((item) => <li key={item.id}><strong>{item.firNumber}/{item.year}</strong><span>{item.crimeCategory} · {item.status.replaceAll("_", " ")}</span></li>)}</ul></section>
          </>}
        </aside>
      </section>

      <p className="map-usage-notice">{overview?.usageNotice || "Historical density is descriptive only; gender and religion are not used for map scoring."}</p>
    </main>
  );
}
