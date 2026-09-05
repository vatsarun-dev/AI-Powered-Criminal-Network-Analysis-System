import { Router } from "express";


import {
  createGraphNode,
  createGraphRelationship,
} from "./graph.controller.js";
import { resolvePerson } from "./entityResolution.controller.js";
import {
  degreeCentrality,
  betweennessCentrality,
  louvainCommunities,
} from "./graphAnalytics.controller.js";
const router = Router();

router.post("/nodes", createGraphNode);
router.post("/relationships", createGraphRelationship);
router.post("/resolve", resolvePerson);
router.get("/analytics/centrality", degreeCentrality);
router.get("/analytics/betweenness",betweennessCentrality);
router.get("/analytics/communities",louvainCommunities);
export default router;