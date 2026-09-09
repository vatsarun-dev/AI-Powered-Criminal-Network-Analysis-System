export default function NodeDetailsPanel({ node, onClose }) {
  if (!node) return null;

  return (
    <div className="node-details-panel">
      <div className="node-details-header">
        <h3>Node Details</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <p><strong>ID:</strong> {node.id}</p>
      <p><strong>Label:</strong> {node.label}</p>
      <p><strong>Type:</strong> {node.type}</p>

      {/* TODO: once backend graph API is ready, fetch full entity
          details (linked events, timeline, case notes) here using node.id */}
    </div>
  );
}