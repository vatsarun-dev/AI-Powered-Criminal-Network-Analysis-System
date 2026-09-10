import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import {
  LoaderCircle,
  Maximize2,
  Network,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  getFilteredGraph,
  getGraphNeighbors,
  getGraphNode,
  searchGraph,
} from "../api";
import { cytoscapeLayout, cytoscapeStylesheet, typeColors } from "../../../lib/cytoscape.config";
import NodeDetailsPanel from "./NodeDetailsPanel";

const NODE_LABELS = [
  "PERSON", "PHONE", "DEVICE", "ACCOUNT", "LOCATION", "CASE", "EVENT",
  "COURT", "POLICE_STATION", "CRIME_CATEGORY", "VEHICLE", "ORGANIZATION",
];

const RELATIONSHIP_TYPES = [
  "ACCUSED_IN", "VICTIM_IN", "CLASSIFIED_AS", "REGISTERED_AT", "HEARD_IN",
  "OCCURRED_AT", "USES", "OWNS", "ASSOCIATED_WITH", "SEEN_WITH", "TRANSFERRED_TO",
  "LOCATED_AT", "INVOLVED_IN", "PARTICIPATED_IN", "RELATED_TO",
];

const emptyFilters = { labels: "", relationshipTypes: "", sourceDocumentId: "" };

const nodeType = (node) =>
  node.labels?.find((label) => Object.hasOwn(typeColors, label)) || node.labels?.[0] || "UNKNOWN";

const nodeLabel = (node) => {
  const properties = node.properties || {};
  return node.name || properties.name || properties.firNumber || properties.value || properties.normalized_name || node.id;
};

const mergeNetwork = (current, incoming) => {
  const nodes = new Map(current.nodes.map((node) => [node.id, node]));
  const relationships = new Map(current.relationships.map((relationship) => [relationship.id, relationship]));

  incoming.nodes.forEach((node) => nodes.set(node.id, node));
  incoming.relationships.forEach((relationship) => relationships.set(relationship.id, relationship));

  return { nodes: [...nodes.values()], relationships: [...relationships.values()] };
};

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function GraphCanvas() {
  const cyRef = useRef(null);
  const networkRef = useRef({ nodes: [], relationships: [] });
  const [network, setNetwork] = useState({ nodes: [], relationships: [] });
  const [filterInputs, setFilterInputs] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    networkRef.current = network;
  }, [network]);

  useEffect(() => {
    let current = true;

    void Promise.resolve()
      .then(() => {
        if (!current) return null;
        setLoading(true);
        setError("");
        return getFilteredGraph({ ...activeFilters, limit: 500 });
      })
      .then((data) => {
        if (!current || data === null) return;
        setNetwork(data || { nodes: [], relationships: [] });
        setSelection(null);
      })
      .catch((requestError) => {
        if (!current) return;
        setNetwork({ nodes: [], relationships: [] });
        setError(errorMessage(requestError, "Unable to load the Neo4j network."));
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [activeFilters]);

  const expandNeighbors = useCallback(async (nodeId) => {
    setExpanding(true);
    setError("");
    try {
      const result = await getGraphNeighbors(nodeId);
      setNetwork((current) => mergeNetwork(current, result.network));
      setSelection({ kind: "node", data: result.node });
      setSearchResults([]);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to expand this node's verified neighbors."));
    } finally {
      setExpanding(false);
    }
  }, []);

  const selectNode = useCallback(async (nodeId) => {
    setError("");
    try {
      const node = await getGraphNode(nodeId);
      setSelection({ kind: "node", data: node });
    } catch (requestError) {
      const cachedNode = networkRef.current.nodes.find((node) => node.id === nodeId);
      if (cachedNode) {
        setSelection({ kind: "node", data: cachedNode });
      } else {
        setError(errorMessage(requestError, "Unable to load this node's evidence."));
      }
    }
  }, []);

  const elements = useMemo(() => [
    ...network.nodes.map((node) => ({
      data: {
        id: node.id,
        label: nodeLabel(node),
        type: nodeType(node),
        node,
      },
    })),
    ...network.relationships.map((relationship) => ({
      data: {
        id: relationship.id,
        source: relationship.fromId,
        target: relationship.toId,
        label: relationship.type,
        type: relationship.type,
        relationship,
      },
    })),
  ], [network]);

  const runLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed() || cy.elements().empty()) return;

    const hasCase = cy.nodes().some((node) => node.data("type") === "CASE");
    const layout = hasCase
      ? {
        name: "concentric",
        animate: true,
        animationDuration: 380,
        fit: true,
        padding: 60,
        minNodeSpacing: 70,
        concentric: (node) => (node.data("type") === "CASE" ? 100 : node.data("type") === "PERSON" ? 70 : 30),
        levelWidth: () => 1,
      }
      : cytoscapeLayout;

    cy.layout(layout).run();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(runLayout);
    return () => window.cancelAnimationFrame(frame);
  }, [elements, runLayout]);

  const handleCyInit = useCallback((cy) => {
    if (cyRef.current === cy) return;
    cyRef.current = cy;

    cy.on("tap", "node", (event) => {
      cy.elements().unselect();
      event.target.select();
      void selectNode(event.target.id());
    });
    cy.on("tap", "edge", (event) => {
      cy.elements().unselect();
      event.target.select();
      setSelection({ kind: "relationship", data: event.target.data("relationship") });
    });
    cy.on("tap", (event) => {
      if (event.target === cy) {
        cy.elements().unselect();
        setSelection(null);
      }
    });
  }, [selectNode]);

  const applyFilters = (event) => {
    event.preventDefault();
    setActiveFilters({ ...filterInputs });
  };

  const resetGraph = () => {
    setFilterInputs(emptyFilters);
    setSearchTerm("");
    setSearchResults([]);
    setSelection(null);
    setActiveFilters({ ...emptyFilters });
  };

  const search = async (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    if (!value) return;

    setError("");
    try {
      setSearchResults(await searchGraph(value));
    } catch (requestError) {
      setSearchResults([]);
      setError(errorMessage(requestError, "Unable to search the Neo4j graph."));
    }
  };

  const zoom = (factor) => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.zoom({ level: Math.max(0.2, Math.min(3, cy.zoom() * factor)), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const fitGraph = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed() || cy.elements().empty()) return;
    cy.fit(cy.elements(), 60);
  };

  return (
    <div className="graph-explorer">
      <form className="graph-toolbar" onSubmit={search}>
        <div className="graph-search-wrap">
          <Search size={17} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search graph node name or stable ID" aria-label="Search graph" />
          <button type="submit">Search</button>
          {searchResults.length ? (
            <div className="graph-search-results">
              {searchResults.map((result) => (
                <button type="button" key={result.id} onClick={() => void expandNeighbors(result.id)}>
                  <span>{nodeLabel(result)}</span><small>{nodeType(result)}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="graph-toolbar-actions">
          <button type="button" onClick={() => zoom(1.2)} aria-label="Zoom in"><ZoomIn size={16} /></button>
          <button type="button" onClick={() => zoom(0.8)} aria-label="Zoom out"><ZoomOut size={16} /></button>
          <button type="button" onClick={fitGraph} aria-label="Fit graph"><Maximize2 size={16} /></button>
          <button type="button" onClick={resetGraph} aria-label="Reset graph"><RotateCcw size={16} /></button>
        </div>
      </form>

      <form className="graph-filter-bar" onSubmit={applyFilters}>
        <div className="graph-filter-title"><SlidersHorizontal size={15} /> Live Neo4j filters</div>
        <label><span>Node type</span><select value={filterInputs.labels} onChange={(event) => setFilterInputs((current) => ({ ...current, labels: event.target.value }))}><option value="">All node types</option>{NODE_LABELS.map((label) => <option key={label} value={label}>{label}</option>)}</select></label>
        <label><span>Relationship</span><select value={filterInputs.relationshipTypes} onChange={(event) => setFilterInputs((current) => ({ ...current, relationshipTypes: event.target.value }))}><option value="">All relationships</option>{RELATIONSHIP_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label><span>Source document ID</span><input value={filterInputs.sourceDocumentId} onChange={(event) => setFilterInputs((current) => ({ ...current, sourceDocumentId: event.target.value }))} placeholder="Mongo document ID" /></label>
        <button type="submit">Apply filters</button>
      </form>

      {error ? <div className="graph-error" role="alert">{error}</div> : null}

      <div className="graph-workspace">
        <section className="graph-stage" aria-label="Interactive criminal network graph">
          <div className="graph-stage-heading">
            <div><span>Evidence-backed network</span><strong>{network.nodes.length} nodes · {network.relationships.length} relationships</strong></div>
            {loading || expanding ? <span className="graph-loading"><LoaderCircle size={14} /> {expanding ? "Expanding neighbors" : "Loading graph"}</span> : <span className="graph-live"><i /> Neo4j live</span>}
          </div>
          {loading ? <div className="graph-canvas-state"><LoaderCircle size={24} /> Loading evidence-backed graph…</div> : elements.length ? (
            <CytoscapeComponent elements={elements} stylesheet={cytoscapeStylesheet} layout={{ name: "preset" }} cy={handleCyInit} style={{ width: "100%", height: "100%" }} />
          ) : (
            <div className="graph-canvas-state"><Network size={30} /><strong>No persisted graph relationships match these filters.</strong><span>Process an FIR through the pipeline or broaden the filters to view Neo4j-backed evidence.</span></div>
          )}
          <div className="graph-legend">{Object.entries(typeColors).filter(([type]) => type !== "UNKNOWN").map(([type, color]) => <span key={type}><i style={{ background: color }} />{type}</span>)}</div>
        </section>
        <NodeDetailsPanel selection={selection} onClose={() => setSelection(null)} onExpand={(nodeId) => void expandNeighbors(nodeId)} />
      </div>
    </div>
  );
}
