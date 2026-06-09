import { Router } from "express";
import { z } from "zod";
import { enforceOrgScope } from "../middleware/orgEnforce";
import {
  WORKFLOWS, getPolicies, upsertPolicy, listActions, recordAction,
  approveAction, rejectAction, setKillSwitch, getKillSwitch, getStats,
} from "../services/autopilotEngine";

const router = Router();
router.use(enforceOrgScope);

router.get("/workflows", (_req, res) => {
  res.json(WORKFLOWS);
});

router.get("/policies", async (req, res) => {
  try {
    const policies = await getPolicies(req.organizationId!);
    res.json(policies);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const policySchema = z.object({
  workflowKey: z.string().min(1),
  mode: z.enum(["manual", "suggest", "auto"]),
  enabled: z.boolean().optional().default(true),
  config: z.record(z.any()).optional().default({}),
});

router.put("/policies", async (req, res) => {
  try {
    const data = policySchema.parse(req.body);
    const policy = await upsertPolicy(req.organizationId!, data.workflowKey, data.mode, data.enabled, data.config);
    res.json(policy);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get("/actions", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "50")), 500);
    const actions = await listActions(req.organizationId!, limit);
    res.json(actions);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const actionSchema = z.object({
  workflowKey: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
});

router.post("/actions", async (req, res) => {
  try {
    const data = actionSchema.parse(req.body);
    const action = await recordAction({ organizationId: req.organizationId!, ...data });
    res.status(201).json(action);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post("/actions/:id/approve", async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const action = await approveAction(req.organizationId!, Number(req.params.id), userId);
    if (!action) return res.status(404).json({ error: "Action not found" });
    res.json(action);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/actions/:id/reject", async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const action = await rejectAction(req.organizationId!, Number(req.params.id), userId, req.body?.reason);
    if (!action) return res.status(404).json({ error: "Action not found" });
    res.json(action);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/kill-switch", async (req, res) => {
  try { res.json(await getKillSwitch(req.organizationId!)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/kill-switch", async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const paused = !!req.body?.paused;
    const result = await setKillSwitch(req.organizationId!, paused, userId, req.body?.reason);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/stats", async (req, res) => {
  try { res.json(await getStats(req.organizationId!)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
