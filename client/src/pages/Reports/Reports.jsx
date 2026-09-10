import {
  FileText,
  Download,
  ShieldAlert,
} from "lucide-react";

import AlertsPanel from "../../features/reports/components/AlertsPanel";

import "../../styles/reports.css";
import { useInvestigationStore } from "../../store/investigationStore";

const Reports = () => {
    const selectedEntity = useInvestigationStore(
  (state) => state.selectedEntity
);
  const alerts = [];

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">
            INTELLIGENCE CENTER
          </span>

          <h1>Reports / Alerts</h1>

          <p>
            Monitor investigation alerts and generate
            intelligence reports.
          </p>
        </div>

        <button className="generate-report-btn">
          <Download size={16} />
          Generate Report
        </button>
      </header>

      <div className="reports-grid">
        <AlertsPanel alerts={alerts} />

        <section className="reports-panel report-panel">
          <div className="reports-panel-header">
            <div>
              <span className="reports-eyebrow">
                DOSSIER
              </span>

              <h2>Investigation Report</h2>
            </div>

            <FileText size={20} />
          </div>

          <div className="report-placeholder">
            <ShieldAlert size={32} />

            <h3>Report generation</h3>

            <p>
  {selectedEntity
    ? `Generate an intelligence dossier for ${selectedEntity.label}.`
    : "Select an entity from the investigation graph to generate a structured intelligence dossier."}
</p>

           <button
  className="report-action-btn"
  disabled={!selectedEntity}
>
  Create Report
</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;