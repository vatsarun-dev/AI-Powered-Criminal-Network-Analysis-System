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

  // Force cytoscape to recalculate its real container size
  // AFTER the browser has finished laying out the page,
  // then re-fit the graph properly.
  const resizeAndFit = () => {
    cy.resize();
    cy.fit(undefined, 60);
  };

  // Run once shortly after mount (fixes the initial-render bug)
  setTimeout(resizeAndFit, 150);

  // Also re-run whenever the layout settles or the window resizes
  cy.on("layoutstop", resizeAndFit);
  window.addEventListener("resize", resizeAndFit);

  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    setSelectedNode({
      id: node.data("id"),
      label: node.data("label"),
      type: node.data("type"),
    });
  });

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
        style={{ width: "100%", height: "700px", background: "var(--bg-secondary)", borderRadius: 8 }}
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