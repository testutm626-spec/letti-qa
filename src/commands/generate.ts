import fs from "fs/promises";
import path from "path";
import { scenarioGroupToPlaywright } from "../converter";
import { listScenarioGroups, loadScenarioGroup, saveScenarioGroup } from "../storage";
import { ScenarioGroup } from "../types";

const TEST_DIR = path.resolve(process.cwd(), "tests");

export async function handleGenerate(id?: string): Promise<void> {
  const groups = id ? await loadSelectedGroup(id) : await listScenarioGroups();
  if (groups.length === 0) {
    console.log("생성할 시나리오 그룹이 없습니다.");
    return;
  }

  await fs.mkdir(TEST_DIR, { recursive: true });

  for (const group of groups) {
    const { fileName, content } = scenarioGroupToPlaywright(group);
    const filePath = path.join(TEST_DIR, fileName);
    await fs.writeFile(filePath, content, "utf8");

    const record = {
      generatedAt: new Date().toISOString(),
      testFile: path.relative(process.cwd(), filePath),
    };

    group.generationHistory = [...(group.generationHistory || []), record];
    await saveScenarioGroup(group);

    console.log(`테스트 파일이 생성되었습니다: ${record.testFile}`);
  }
}

async function loadSelectedGroup(id: string): Promise<ScenarioGroup[]> {
  const group = await loadScenarioGroup(id);
  if (!group) {
    console.log("해당 ID의 시나리오 그룹을 찾을 수 없습니다.");
    return [];
  }
  return [group];
}
