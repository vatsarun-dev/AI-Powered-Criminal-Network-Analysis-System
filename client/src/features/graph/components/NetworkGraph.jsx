import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";

import { searchGraph } from "../api";

const stylesheet = [
  {
    selector: "node",
    style: {
      "background-color": "#c8ff00",
      label: "data(label)",
      color: "#f5f5f0",
      "font-size": "10px",
      "text-valign": "bottom",
      "text-margin-y": "8px",
      "border-width": 1,
      "border-color": "#c8ff00",
      width: 32,
      height: 32,
    },
  },

  {
    selector: 'node[type="PERSON"]',
    style: {
      "background-color": "#c8ff00",
      shape: "ellipse",
    },
  },

  {
    selector: 'node[type="PHONE"]',
    style: {
      "background-color": "#ffffff",
      shape: "round-rectangle",
    },
  },

  {
    selector: 'node[type="LOCATION"]',
    style: {
      "background-color": "#777777",
      shape: "diamond",
    },
  },

  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#ffffff",
      "overlay-opacity": 0,
    },
  },

  {
    selector: "edge",
    style: {
      width: 1,
      "line-color": "#555555",
      "target-arrow-color": "#777777",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      color: "#777777",
      "font-size": "7px",
    },
  },
];

function NetworkGraph({
  searchTerm = "Rakesh",
  activeFilter = "ALL",
  onNodeSelect,
}) {
  const cyRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 

  useEffect(() => {
    let ignoreResponse = false;

    const loadGraph = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await searchGraph(searchTerm);

        const nodes = response?.data ?? [];

        const filteredNodes =
          activeFilter === "ALL"
            ? nodes
            : nodes.filter((node) => node.labels?.includes(activeFilter));

        const graphNodes = filteredNodes.map((node) => ({
          data: {
            id: node.id,
            label: node.name || node.properties?.name || node.id,
            type: node.labels?.[0] || "UNKNOWN",
          },
        }));

        if (!ignoreResponse) {
          setElements(graphNodes);
        }
      } catch (err) {
        console.error("Graph search failed:", err);

        if (!ignoreResponse) {
          setError(
            err?.response?.data?.message ||
              "Unable to load graph data"
          );
        }
      } finally {
        if (!ignoreResponse) {
          setLoading(false);
        }
      }
    };

    if (searchTerm?.trim()) {
      loadGraph();
    }

    return () => {
      ignoreResponse = true;
    };
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    const cy = cyRef.current;

    // A request can cause a React render while Cytoscape is unmounting.  Do
    // not ask a destroyed instance to lay itself out: it no longer has a
    // renderer, which causes Cytoscape's internal `notify` error.
    if (!cy || cy.destroyed() || elements.length === 0) {
      return;
    }

    const layout = cy.layout({
      name: "cose",
      animate: true,
      animationDuration: 700,
      fit: true,
      padding: 50,
      nodeRepulsion: 8000,
      idealEdgeLength: 130,
      gravity: 0.5,
    });

    const handleNodeTap = (event) => {
      const node = event.target;

      const selected = {
        id: node.id(),
        label: node.data("label"),
        type: node.data("type"),
      };

      setSelectedNode(selected);
      onNodeSelect?.(selected);
    };

    cy.on("tap", "node", handleNodeTap);
    layout.run();

    return () => {
      if (!cy.destroyed()) {
        cy.removeListener("tap", "node", handleNodeTap);
        layout.stop();
      }
    };
  }, [elements, onNodeSelect]);

  if (loading && elements.length === 0) {
    return (
      <div className="graph-state">
        <span className="mono">
          LOADING NETWORK...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-state graph-error">
        <span className="mono">
          {error}
        </span>
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="graph-state">
        <span className="mono">
          NO ENTITIES FOUND
        </span>
      </div>
    );
  }

  return (
    <div className="network-graph-container">
      <div className="network-graph">
        <CytoscapeComponent
          elements={elements}
          stylesheet={stylesheet}
          cy={(cy) => {
            cyRef.current = cy;
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
        {loading && <div className="graph-state">UPDATING NETWORK...</div>}
      </div>

      {selectedNode && (
        <div className="node-details">
          <div className="node-details-label mono">
            SELECTED ENTITY
          </div>

          <h3>{selectedNode.label}</h3>

          <span className="node-type mono">
            {selectedNode.type}
          </span>

          <div className="node-detail-row">
            <span>ID</span>
            <strong>{selectedNode.id}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkGraph;
