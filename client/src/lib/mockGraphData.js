// Dummy data until backend graph API is ready.
// Node "type" drives color/shape in GraphCanvas: PERSON, PHONE, DEVICE, LOCATION, ACCOUNT

export const mockGraphElements = [
  // Nodes
  { data: { id: "p1", label: "Rohan Mehta", type: "PERSON" } },
  { data: { id: "p2", label: "Aditi Sharma", type: "PERSON" } },
  { data: { id: "ph1", label: "+91 98765xxxxx", type: "PHONE" } },
  { data: { id: "ph2", label: "+91 91234xxxxx", type: "PHONE" } },
  { data: { id: "d1", label: "iPhone 13 (IMEI xxx)", type: "DEVICE" } },
  { data: { id: "loc1", label: "Andheri, Mumbai", type: "LOCATION" } },
  { data: { id: "acc1", label: "acc_upi_884521", type: "ACCOUNT" } },

  // Edges
  { data: { id: "e1", source: "p1", target: "ph1", label: "OWNS" } },
  { data: { id: "e2", source: "p2", target: "ph2", label: "OWNS" } },
  { data: { id: "e3", source: "ph1", target: "ph2", label: "CALLED" } },
  { data: { id: "e4", source: "p1", target: "d1", label: "USES" } },
  { data: { id: "e5", source: "p1", target: "loc1", label: "SEEN_AT" } },
  { data: { id: "e6", source: "p2", target: "acc1", label: "OWNS" } },
  { data: { id: "e7", source: "acc1", target: "p1", label: "TRANSFERRED_TO" } },
];