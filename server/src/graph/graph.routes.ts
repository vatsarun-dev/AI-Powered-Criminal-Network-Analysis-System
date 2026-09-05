import { Router } from "express";

import {
  createGraphNode,
  createGraphRelationship,
} from "./graph.controller.js";

const router = Router();

router.post("/nodes", createGraphNode);
router.post("/relationships", createGraphRelationship);

export default router;