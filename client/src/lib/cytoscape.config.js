export const typeColors = {
  PERSON: "#6c63ff",
  PHONE: "#ff6b6b",
  DEVICE: "#feca57",
  LOCATION: "#1dd1a1",
  ACCOUNT: "#54a0ff",
};

export const cytoscapeStylesheet = [
  {
    selector: "node",
    style: {
      "background-color": (ele) => typeColors[ele.data("type")] || "#999",
      label: "data(label)",

      // Light text so it's readable on the dark canvas background
      color: "#e6edf3",
      "font-size": 12,
      "font-weight": 600,

      // A subtle outline behind the text acts like a mini "label background",
      // which is what actually prevents labels from blending into each other
      // when nodes are close together.
      "text-outline-color": "#0d1117",
      "text-outline-width": 2,

      "text-valign": "bottom",
      "text-margin-y": 8,
      "text-wrap": "wrap",
      "text-max-width": "90px",

      width: 42,
      height: 42,
      "border-width": 2,
      "border-color": "#161b22",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "#30363d",
      "target-arrow-color": "#30363d",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",

      label: "data(label)",
      "font-size": 9,
      color: "#8b949e",
      "text-outline-color": "#0d1117",
      "text-outline-width": 2,
      "text-rotation": "autorotate",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-color": "#2f81f7",
      "border-width": 4,
    },
  },
  {
    // Dim everything except the selected node's direct neighborhood
    // (optional but makes exploration feel much more "impressive")
    selector: "node.faded, edge.faded",
    style: {
      opacity: 0.15,
    },
  },
];

export const cytoscapeLayout = {
  name: "circle",
  animate: true,
  fit: true,
  padding: 120,

  nodeRepulsion: 6000,
  idealEdgeLength: 100,
  nodeOverlap: 20,
  avoidOverlap: true,
  gravity: 0.5,
  numIter: 2000,
  randomize: true,
};