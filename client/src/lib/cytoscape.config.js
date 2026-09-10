// Colors per node type — keep in sync with any legend UI
export const typeColors = {
  PERSON: "#c8ff00",
  PHONE: "#65d6ff",
  DEVICE: "#fbbf24",
  ACCOUNT: "#a78bfa",
  LOCATION: "#34d399",
  CASE: "#fb7185",
  EVENT: "#fb923c",
  COURT: "#e879f9",
  POLICE_STATION: "#60a5fa",
  CRIME_CATEGORY: "#facc15",
  VEHICLE: "#94a3b8",
  ORGANIZATION: "#2dd4bf",
  UNKNOWN: "#94a3b8",
};

export const cytoscapeStylesheet = [
  {
    selector: "node",
    style: {
      "background-color": (element) => typeColors[element.data("type")] || typeColors.UNKNOWN,
      label: "data(label)",
      color: "#f5f5f0",
      "font-size": 9,
      "font-family": "DM Mono, monospace",
      "text-valign": "bottom",
      "text-margin-y": 6,
      "text-wrap": "wrap",
      "text-max-width": 100,
      width: 38,
      height: 38,
      "border-width": 2,
      "border-color": "#080808",
      "overlay-opacity": 0,
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.4,
      "line-color": "#64748b",
      "target-arrow-color": "#64748b",
      "target-arrow-shape": "triangle",
      "curve-style": "unbundled-bezier",
      "control-point-distances": [24, -24],
      "control-point-weights": [0.5, 0.5],
      label: "data(label)",
      "font-size": 7,
      "font-family": "DM Mono, monospace",
      color: "#cbd5e1",
      "text-rotation": "autorotate",
      "text-background-color": "#111827",
      "text-background-opacity": 0.85,
      "text-background-padding": 2,
    },
  },
  {
    selector: 'node[type = "CASE"]',
    style: {
      width: 58,
      height: 58,
      shape: "hexagon",
      "border-width": 3,
      "border-color": "#fecdd3",
    },
  },
  {
    selector: 'node[type = "LOCATION"], node[type = "POLICE_STATION"], node[type = "COURT"]',
    style: { shape: "diamond" },
  },
  {
    selector: 'node[type = "DEVICE"], node[type = "ACCOUNT"]',
    style: { shape: "round-rectangle" },
  },
  {
    selector: "node:selected",
    style: {
      "border-color": "#ffffff",
      "border-width": 4,
      "underlay-color": "#c8ff00",
      "underlay-opacity": 0.18,
      "underlay-padding": 8,
    },
  },
  {
    selector: "edge:selected",
    style: {
      width: 3,
      "line-color": "#c8ff00",
      "target-arrow-color": "#c8ff00",
      color: "#ffffff",
    },
  },
];

export const cytoscapeLayout = {
  name: "cose",
  animate: true,
  fit: true,
  padding: 48,
  nodeRepulsion: 9000,
  idealEdgeLength: 150,
  gravity: 0.45,
};
