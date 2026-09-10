import { useState } from "react";
import { ChevronRight, FileSearch, Plus, X } from "lucide-react";

const excludedNodeProperties = new Set([
  "id",
  "source_entity_ids",
  "source_document_ids",
  "source_values",
]);

const propertyLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not recorded";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function PropertyRows({ properties, excluded = new Set() }) {
  const entries = Object.entries(properties || {}).filter(
    ([key, value]) => !excluded.has(key) && value !== undefined && value !== null && value !== "",
  );

  if (!entries.length) return <p className="graph-empty-detail">No additional attributes are available.</p>;

  return (
    <dl className="graph-property-list">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{propertyLabel(key)}</dt>
          <dd title={displayValue(value)}>{displayValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function NodeEvidence({ properties }) {
  const documentIds = properties?.source_document_ids || properties?.sourceDocumentIds || [];
  const entityIds = properties?.source_entity_ids || properties?.sourceEntityIds || [];
  const sourceValues = properties?.source_values || properties?.sourceValues || [];

  if (!documentIds.length && !entityIds.length && !sourceValues.length) {
    return <p className="graph-empty-detail">This node has no persisted source evidence yet.</p>;
  }

  return (
    <div className="graph-evidence-stack">
      {documentIds.length ? <div><span>Source document</span><strong>{displayValue(documentIds)}</strong></div> : null}
      {entityIds.length ? <div><span>Source entity IDs</span><strong>{displayValue(entityIds)}</strong></div> : null}
      {sourceValues.length ? <div><span>Extracted values</span><strong>{displayValue(sourceValues)}</strong></div> : null}
    </div>
  );
}

export default function NodeDetailsPanel({ selection, onClose, onExpand }) {
  const [reasonSelectionId, setReasonSelectionId] = useState(null);

  if (!selection) return null;

  const isRelationship = selection.kind === "relationship";
  const data = selection.data;
  const properties = data.properties || {};
  const title = isRelationship ? data.type : data.name || properties.name || data.id;
  const showReason = reasonSelectionId === data.id;

  return (
    <aside className="node-details-panel" aria-live="polite">
      <div className="node-details-header">
        <div>
          <span className="graph-panel-eyebrow">{isRelationship ? "Relationship evidence" : "Entity evidence"}</span>
          <h2>{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details"><X size={17} /></button>
      </div>

      {isRelationship ? (
        <>
          <p className="graph-relationship-route"><span>{data.fromId}</span><ChevronRight size={14} /><span>{data.toId}</span></p>
          <section className="graph-detail-section">
            <h3>Provenance</h3>
            <dl className="graph-property-list">
              <div><dt>Source document</dt><dd>{displayValue(properties.sourceDocumentId)}</dd></div>
              <div><dt>Page</dt><dd>{displayValue(properties.pageNumber)}</dd></div>
              <div><dt>Confidence</dt><dd>{typeof properties.confidence === "number" ? `${Math.round(properties.confidence * 100)}%` : displayValue(properties.confidence)}</dd></div>
              <div><dt>Timestamp</dt><dd>{displayValue(properties.timestamp)}</dd></div>
              <div><dt>Model version</dt><dd>{displayValue(properties.modelVersion)}</dd></div>
            </dl>
          </section>
          <section className="graph-detail-section">
            <h3>Extracted evidence</h3>
            <blockquote className="graph-evidence-quote">{displayValue(properties.extractedEvidence)}</blockquote>
          </section>
          <section className="graph-detail-section">
            <button type="button" className="graph-why-button" onClick={() => setReasonSelectionId((current) => current === data.id ? null : data.id)}>
              <FileSearch size={15} /> Why does this connection exist?
            </button>
            {showReason ? (
              <p className="graph-reason">
                {properties.extractedEvidence
                  ? `The FIR pipeline extracted ${data.type} from the quoted evidence above and stored it with this document provenance.`
                  : "This relationship exists in Neo4j, but its extracted-evidence text was not persisted for this record."}
              </p>
            ) : null}
          </section>
          <section className="graph-detail-section">
            <h3>Stored relationship fields</h3>
            <PropertyRows properties={properties} excluded={new Set(["sourceDocumentId", "pageNumber", "confidence", "timestamp", "modelVersion", "extractedEvidence"])} />
          </section>
        </>
      ) : (
        <>
          <div className="graph-node-type">{(data.labels || []).join(" · ") || data.type || "UNKNOWN"}</div>
          <section className="graph-detail-section">
            <h3>Identity</h3>
            <dl className="graph-property-list"><div><dt>Graph ID</dt><dd>{data.id}</dd></div></dl>
          </section>
          <section className="graph-detail-section">
            <h3>Available evidence</h3>
            <NodeEvidence properties={properties} />
          </section>
          <section className="graph-detail-section">
            <h3>Stored node fields</h3>
            <PropertyRows properties={properties} excluded={excludedNodeProperties} />
          </section>
          <button type="button" className="graph-expand-button" onClick={() => onExpand(data.id)}>
            <Plus size={16} /> Expand verified neighbors
          </button>
        </>
      )}
    </aside>
  );
}
