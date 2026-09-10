
import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  ShieldAlert,
} from "lucide-react";

import AlertsPanel from "../../features/reports/components/AlertsPanel";
import jsPDF from "jspdf";

import {
  getAlerts,
  updateAlertStatus,
  getFirs,
  getFirById,
  getFirEvidence,
  getFirNetwork,
} from "../../features/reports/api";

import "../../styles/reports.css";

const Reports = () => {
  // -----------------------------
  // Alerts
  // -----------------------------
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingAlertId, setUpdatingAlertId] = useState(null);

  // -----------------------------
  // Error
  // -----------------------------
  const [error, setError] = useState("");

  // -----------------------------
  // FIR / Investigation
  // -----------------------------
  const [firs, setFirs] = useState([]);
  const [selectedFirId, setSelectedFirId] = useState("");
  const [selectedFir, setSelectedFir] = useState(null);

  const [loadingFirs, setLoadingFirs] = useState(true);
  const [loadingFir, setLoadingFir] = useState(false);

  // -----------------------------
  // FIR Evidence + Network
  // -----------------------------
  const [firEvidence, setFirEvidence] = useState(null);
  const [firNetwork, setFirNetwork] = useState(null);

  // -----------------------------
  // Load Alerts
  // -----------------------------
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAlerts();

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load alerts:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load alerts."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Load FIRs
  // -----------------------------
  const loadFirs = async () => {
    try {
      setLoadingFirs(true);

      const response = await getFirs();

      const data =
        response?.data?.items ||
        response?.data?.data?.items ||
        [];

      setFirs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load FIRs:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load investigations."
      );
    } finally {
      setLoadingFirs(false);
    }
  };

  // -----------------------------
  // Load Selected FIR
  // -----------------------------
  const loadSelectedFir = async (firId) => {
    if (!firId) {
      setSelectedFir(null);
      setFirEvidence(null);
      setFirNetwork(null);
      return;
    }

    try {
      setLoadingFir(true);
      setError("");

      const [
        firResponse,
        evidenceResponse,
        networkResponse,
      ] = await Promise.all([
        getFirById(firId),
        getFirEvidence(firId),
        getFirNetwork(firId),
      ]);

      // FIR
      const fir =
        firResponse?.data?.fir ||
        firResponse?.data?.data?.fir ||
        null;

      // Evidence
      const evidence =
        evidenceResponse?.data ||
        evidenceResponse?.data?.data ||
        null;

      // Network
      const network =
        networkResponse?.data ||
        networkResponse?.data?.data ||
        null;

      setSelectedFir(fir);
      setFirEvidence(evidence);
      setFirNetwork(network);
    } catch (err) {
      console.error(
        "Failed to load FIR report data:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load investigation report."
      );
    } finally {
      setLoadingFir(false);
    }
  };

  // -----------------------------
  // Initial Load
  // -----------------------------
  useEffect(() => {
    loadAlerts();
    loadFirs();
  }, []);

  // -----------------------------
  // Update Alert Status
  // -----------------------------
  const handleUpdateStatus = async (
    alertId,
    status
  ) => {
    try {
      setUpdatingAlertId(alertId);

      await updateAlertStatus(
        alertId,
        status
      );

      await loadAlerts();
    } catch (err) {
      console.error(
        "Failed to update alert:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update alert."
      );
    } finally {
      setUpdatingAlertId(null);
    }
  };
const handleGenerateReport = () => {
  if (!selectedFir) {
    setError("Please select an investigation first.");
    return;
  }

  const doc = new jsPDF();

  const evidenceCount =
    firEvidence?.entities?.length || 0;

  const relationshipCount =
    firEvidence?.relationships?.length || 0;

  const networkNodes =
    firNetwork?.network?.nodes?.length || 0;

  const networkRelationships =
    firNetwork?.network?.relationships?.length || 0;

  // Header
  doc.setFontSize(20);
  doc.text("CRIMEGRAPH AI", 20, 20);

  doc.setFontSize(12);
  doc.text("INTELLIGENCE INVESTIGATION REPORT", 20, 30);

  doc.line(20, 35, 190, 35);

  // FIR details
  doc.setFontSize(14);
  doc.text("FIR DETAILS", 20, 48);

  doc.setFontSize(10);

  let y = 58;

  doc.text(`FIR Number: ${selectedFir.firNumber || "N/A"}`, 20, y);
  y += 7;

  doc.text(`Year: ${selectedFir.year || "N/A"}`, 20, y);
  y += 7;

  doc.text(
    `Crime Category: ${selectedFir.crimeCategory || "N/A"}`,
    20,
    y
  );
  y += 7;

  doc.text(
    `District: ${selectedFir.district || "N/A"}`,
    20,
    y
  );
  y += 7;

  doc.text(
    `Police Station: ${selectedFir.policeStation || "N/A"}`,
    20,
    y
  );
  y += 7;

  doc.text(
    `Status: ${selectedFir.status || "N/A"}`,
    20,
    y
  );

  // Description
  y += 15;

  doc.setFontSize(14);
  doc.text("CASE DESCRIPTION", 20, y);

  y += 8;

  doc.setFontSize(10);

  const description =
    selectedFir.description || "No description available.";

  const descriptionLines =
    doc.splitTextToSize(description, 170);

  doc.text(descriptionLines, 20, y);

  y += descriptionLines.length * 5 + 12;

  // Intelligence summary
  doc.setFontSize(14);
  doc.text("INTELLIGENCE SUMMARY", 20, y);

  y += 10;

  doc.setFontSize(10);

  doc.text(
    `Evidence Entities: ${evidenceCount}`,
    20,
    y
  );

  y += 7;

  doc.text(
    `Evidence Relationships: ${relationshipCount}`,
    20,
    y
  );

  y += 7;

  doc.text(
    `Network Nodes: ${networkNodes}`,
    20,
    y
  );

  y += 7;

  doc.text(
    `Network Relationships: ${networkRelationships}`,
    20,
    y
  );

  // Footer
  y += 20;

  doc.line(20, y, 190, y);

  y += 8;

  doc.setFontSize(8);

  doc.text(
    `Generated by CrimeGraph AI | ${new Date().toLocaleString()}`,
    20,
    y
  );

  // Download
  doc.save(
    `CrimeGraph-AI-FIR-${selectedFir.firNumber || "Report"}.pdf`
  );
};
  // -----------------------------
  // Report Page
  // -----------------------------
  return (
    <div className="reports-page">

      {/* =========================
          HEADER
      ========================= */}
      <header className="reports-header">

        <div>
          <span className="reports-eyebrow">
            INTELLIGENCE CENTER
          </span>

          <h1>Reports / Alerts</h1>

          <p>
            Monitor investigation alerts and
            generate intelligence reports.
          </p>
        </div>

       <button
  type="button"
  className="generate-report-btn"
  onClick={handleGenerateReport}
>
          <Download size={16} />
          Generate Report
        </button>

      </header>

      {/* =========================
          ERROR
      ========================= */}
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      {/* =========================
          MAIN GRID
      ========================= */}
      <div className="reports-grid">

        {/* =======================
            ALERTS
        ======================= */}
        <AlertsPanel
          alerts={alerts}
          onAcknowledge={(alertId) =>
            handleUpdateStatus(
              alertId,
              "ACKNOWLEDGED"
            )
          }
          onDismiss={(alertId) =>
            handleUpdateStatus(
              alertId,
              "DISMISSED"
            )
          }
          updatingAlertId={updatingAlertId}
        />

        {/* =======================
            INVESTIGATION REPORT
        ======================= */}
        <section className="reports-panel report-panel">

          {/* Panel Header */}
          <div className="reports-panel-header">

            <div>
              <span className="reports-eyebrow">
                DOSSIER
              </span>

              <h2>
                Investigation Report
              </h2>
            </div>

            <FileText size={20} />

          </div>

          {/* Report Content */}
          <div className="report-placeholder">

            {/* =====================
                FIR SELECTOR
            ===================== */}
            <div className="fir-selector">

              <label htmlFor="fir-select">
                INVESTIGATION
              </label>

              <select
                id="fir-select"
                value={selectedFirId}
                onChange={(e) => {
                  const firId =
                    e.target.value;

                  setSelectedFirId(firId);

                  loadSelectedFir(firId);
                }}
                disabled={loadingFirs}
              >

                <option value="">
                  {loadingFirs
                    ? "Loading investigations..."
                    : "Select an investigation"}
                </option>

                {firs.map((fir) => (
                  <option
                    key={fir.id}
                    value={fir.id}
                  >
                    FIR {fir.firNumber} /{" "}
                    {fir.year}
                  </option>
                ))}

              </select>

            </div>

            {/* =====================
                LOADING
            ===================== */}
            {loadingFir ? (
              <>
                <FileText size={32} />

                <h3>
                  Loading investigation...
                </h3>

                <p>
                  Fetching FIR, evidence and
                  network details.
                </p>
              </>
            ) : selectedFir ? (
              <>
                {/* =================
                    FIR HEADER
                ================= */}
                <FileText size={32} />

                <h3>
                  FIR {selectedFir.firNumber}
                </h3>

                {/* =================
                    FIR DETAILS
                ================= */}
                <div className="report-details">

                  <div>
                    <span>YEAR</span>
                    <strong>
                      {selectedFir.year}
                    </strong>
                  </div>

                  <div>
                    <span>CRIME</span>
                    <strong>
                      {selectedFir.crimeCategory}
                    </strong>
                  </div>

                  <div>
                    <span>DISTRICT</span>
                    <strong>
                      {selectedFir.district}
                    </strong>
                  </div>

                  <div>
                    <span>POLICE STATION</span>
                    <strong>
                      {selectedFir.policeStation}
                    </strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong>
                      {selectedFir.status}
                    </strong>
                  </div>

                  <div>
                    <span>YEAR</span>
                    <strong>
                      {selectedFir.year}
                    </strong>
                  </div>

                </div>

                {/* =================
                    DESCRIPTION
                ================= */}
                <p>
                  {selectedFir.description}
                </p>

                {/* =================
                    EVIDENCE + NETWORK
                ================= */}
                <div className="report-stats">

                  <div>
                    <span>EVIDENCE</span>

                    <strong>
                      {firEvidence?.entities
                        ?.length || 0}
                    </strong>
                  </div>

                  <div>
                    <span>RELATIONSHIPS</span>

                    <strong>
                      {firEvidence
                        ?.relationships
                        ?.length || 0}
                    </strong>
                  </div>

                  <div>
                    <span>NETWORK NODES</span>

                    <strong>
                      {firNetwork?.network
                        ?.nodes?.length || 0}
                    </strong>
                  </div>

                  <div>
                    <span>NETWORK LINKS</span>

                    <strong>
                      {firNetwork?.network
                        ?.relationships
                        ?.length || 0}
                    </strong>
                  </div>

                </div>

                {/* =================
                    CREATE REPORT
                ================= */}
                <button
  type="button"
  className="report-action-btn"
  onClick={handleGenerateReport}
>
                  <FileText size={15} />
                  Create Report
                </button>

              </>
            ) : (
              <>
                {/* =================
                    EMPTY STATE
                ================= */}
                <ShieldAlert size={32} />

                <h3>
                  Report generation
                </h3>

                <p>
                  Select an investigation to
                  generate a structured
                  intelligence dossier.
                </p>
              </>
            )}

          </div>

        </section>

      </div>

    </div>
  );
};

export default Reports;

