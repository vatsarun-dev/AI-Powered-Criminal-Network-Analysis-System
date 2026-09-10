import { useEffect, useState } from "react";
import { Download, FileText, ShieldAlert } from "lucide-react";

import { getAlerts } from "../../features/reports/api";
import AlertsPanel from "../../features/reports/components/AlertsPanel";
import { useInvestigationStore } from "../../store/investigationStore";
import "../../styles/reports.css";

export default function Reports() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedEntity = useInvestigationStore((state) => state.selectedEntity);

  useEffect(() => {
    let current = true;
    void getAlerts()
      .then((data) => { if (current) setAlerts(data); })
      .catch((requestError) => { if (current) setError(requestError.response?.data?.message || "Unable to load alerts."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">INTELLIGENCE CENTER</span>
          <h1>Reports / Alerts</h1>
          <p>Monitor investigation alerts and generate intelligence reports.</p>
        </div>
        <button type="button" className="generate-report-btn" disabled><Download size={16} /> Generate Report</button>
      </header>

      {error ? <p className="reports-error" role="alert">{error}</p> : null}
      {loading ? <p className="reports-loading">Loading alerts...</p> : null}
      <div className="reports-grid">
        <AlertsPanel alerts={alerts} />
        <section className="reports-panel report-panel">
          <div className="reports-panel-header"><div><span className="reports-eyebrow">DOSSIER</span><h2>Investigation Report</h2></div><FileText size={20} /></div>
          <div className="report-placeholder">
            <ShieldAlert size={32} />
            <h3>Report generation</h3>
            <p>{selectedEntity ? `Generate an intelligence dossier for ${selectedEntity.label}.` : "Select an entity from the investigation graph to generate a structured intelligence dossier."}</p>
            <button type="button" className="report-action-btn" disabled>Create Report</button>
          </div>
        </section>
      </div>
    </div>
  );
}
