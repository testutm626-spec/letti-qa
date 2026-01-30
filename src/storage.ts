import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { ScenarioGroup } from "./types";

const SCENARIO_DIR = path.resolve(process.cwd(), "scenarios");

export async function ensureScenarioDir(): Promise<void> {
  await fs.mkdir(SCENARIO_DIR, { recursive: true });
}

export function scenarioFilePath(id: string): string {
  return path.join(SCENARIO_DIR, `${id}.yml`);
}

export async function saveScenarioGroup(group: ScenarioGroup): Promise<void> {
  await ensureScenarioDir();
  const data = yaml.dump(group, { lineWidth: 120 });
  await fs.writeFile(scenarioFilePath(group.id), data, "utf8");
}

export async function loadScenarioGroup(id: string): Promise<ScenarioGroup | null> {
  await ensureScenarioDir();
  try {
    const data = await fs.readFile(scenarioFilePath(id), "utf8");
    return yaml.load(data) as ScenarioGroup;
  } catch {
    return null;
  }
}

export async function listScenarioGroups(): Promise<ScenarioGroup[]> {
  await ensureScenarioDir();
  const files = await fs.readdir(SCENARIO_DIR);
  const groups: ScenarioGroup[] = [];
  for (const file of files) {
    if (!file.endsWith(".yml")) continue;
    const data = await fs.readFile(path.join(SCENARIO_DIR, file), "utf8");
    const parsed = yaml.load(data) as ScenarioGroup;
    if (parsed) groups.push(parsed);
  }
  return groups.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
