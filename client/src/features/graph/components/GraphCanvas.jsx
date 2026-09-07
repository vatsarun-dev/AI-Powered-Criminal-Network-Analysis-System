import { useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { mockGraphElements } from "../../../lib/mockGraphData";
import { cytoscapeStylesheet, cytoscapeLayout } from "../../../lib/cytoscape.config";
import NodeDetailsPanel from "./NodeDetailsPanel";

export default function GraphCanvas() {
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleCyInit = (cy) => {
    cyRef.current = cy;

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.data("id"),
        label: node.data("label"),
        type: node.data("type"),
      });
    });

    // Clicking empty canvas clears selection
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });
  };

  return (
    <div className="graph-canvas-wrapper">
      <CytoscapeComponent
        elements={mockGraphElements}
        stylesheet={cytoscapeStylesheet}
        layout={cytoscapeLayout}
        cy={handleCyInit}
        style={{ width: "100%", height: "600px", background: "#fff", borderRadius: 8 }}
      />

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}