// Colors per node type — keep in sync with any legend UI
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
      color: "#222",
      "font-size": 10,
      "text-valign": "bottom",
      "text-margin-y": 6,
      width: 36,
      height: 36,
      "border-width": 2,
      "border-color": "#fff",
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#ccc",
      "target-arrow-color": "#ccc",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": 8,
      color: "#777",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-color": "#000",
      "border-width": 3,
    },
  },
];

export const cytoscapeLayout = {
  name: "cose", // force-directed layout, good default for graph exploration
  animate: true,
  fit: true,
  padding: 30,
};