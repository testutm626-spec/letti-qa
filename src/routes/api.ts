import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Router } from "express";
import { expandScenarios } from "../ai";
import { detectAllConflicts, detectConflicts } from "../conflict";
import { scenarioGroupToPlaywright } from "../converter";
import { listScenarioGroups, loadScenarioGroup, saveScenarioGroup } from "../storage";
import { Scenario, ScenarioGroup } from "../types";

const router = Router();
const TEST_DIR = path.resolve(process.cwd(), "tests");

router.get("/scenarios", async (_req, res, next) => {
  try {
    const groups = await listScenarioGroups();
    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

router.get("/scenarios/:id", async (req, res, next) => {
  try {
    const group = await loadScenarioGroup(req.params.id);
    if (!group) {
      res.status(404).json({ error: "시나리오 그룹을 찾을 수 없습니다." });
      return;
    }
    res.json({ group });
  } catch (error) {
    next(error);
  }
});

router.post("/scenarios/add", async (req, res, next) => {
  try {
    const input = String(req.body?.input ?? "").trim();
    if (!input) {
      res.status(400).json({ error: "입력 문장이 필요합니다." });
      return;
    }

    const scenarios = await expandScenarios(input, {});
    const groupId = randomUUID();
    const group: ScenarioGroup = {
      id: groupId,
      input,
      createdAt: new Date().toISOString(),
      scenarios: scenarios.map((scenario) => ({
        id: randomUUID(),
        title: scenario.title,
        steps: scenario.steps,
        expected: scenario.expected,
        tags: scenario.tags,
      })) as Scenario[],
      source: "claude",
      generationHistory: [],
    };

    const existingGroups = await listScenarioGroups();
    const conflicts = detectConflicts(group.scenarios, existingGroups);

    await saveScenarioGroup(group);

    res.status(201).json({ group, conflicts });
  } catch (error) {
    next(error);
  }
});

router.post("/scenarios/:id/generate", async (req, res, next) => {
  try {
    const group = await loadScenarioGroup(req.params.id);
    if (!group) {
      res.status(404).json({ error: "시나리오 그룹을 찾을 수 없습니다." });
      return;
    }

    await fs.mkdir(TEST_DIR, { recursive: true });
    const { fileName, content } = scenarioGroupToPlaywright(group);
    const filePath = path.join(TEST_DIR, fileName);
    await fs.writeFile(filePath, content, "utf8");

    const record = {
      generatedAt: new Date().toISOString(),
      testFile: path.relative(process.cwd(), filePath),
    };

    group.generationHistory = [...(group.generationHistory || []), record];
    await saveScenarioGroup(group);

    res.json({
      fileName,
      filePath: record.testFile,
      content,
      record,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/check", async (_req, res, next) => {
  try {
    const groups = await listScenarioGroups();
    const conflicts = detectAllConflicts(groups);
    res.json({ conflicts });
  } catch (error) {
    next(error);
  }
});

router.get("/tests/:id", async (req, res, next) => {
  try {
    const rawId = String(req.params.id ?? "");
    const fileName = rawId.endsWith(".test.ts") ? rawId : `${rawId}.test.ts`;
    const filePath = path.join(TEST_DIR, fileName);
    const content = await fs.readFile(filePath, "utf8");
    res.json({ fileName, content });
  } catch (error) {
    res.status(404).json({ error: "테스트 파일을 찾을 수 없습니다." });
  }
});

export default router;
