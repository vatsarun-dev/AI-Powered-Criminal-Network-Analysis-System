import { ChevronLeft, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

import GraphCanvas from "../../features/graph/components/GraphCanvas";

export default function GraphPage() {
  return (
    <main className="graph-page">
      <header className="graph-page-header">
        <div>
          <Link to="/dashboard" className="graph-back-link"><ChevronLeft size={15} /> Dashboard</Link>
          <span className="graph-page-eyebrow"><GitBranch size={14} /> Criminal knowledge graph</span>
          <h1>Investigation network</h1>
          <p>Explore only the entities and links persisted from processed FIR evidence. Select a node or relationship to inspect its provenance.</p>
        </div>
        <div className="graph-page-notice">Connections are evidence-backed records, not risk scores or inferred allegations.</div>
      </header>
      <GraphCanvas />
    </main>
  );
}
