import { randomUUID } from "crypto";
import { expandScenarios } from "../ai";
import { detectConflicts } from "../conflict";
import { saveScenarioGroup, listScenarioGroups } from "../storage";
import { ScenarioGroup, Scenario } from "../types";

export async function handleAdd(input: string | undefined): Promise<void> {
  if (!input) {
    console.log("추가할 시나리오 한 줄 설명을 입력해 주세요.");
    return;
  }

  // Uses Codex OAuth token automatically if logged in, or OPENAI_API_KEY env var
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

  console.log(`시나리오 그룹이 저장되었습니다: ${group.id}`);
  console.log(`총 ${group.scenarios.length}개의 시나리오가 생성되었습니다.`);

  if (conflicts.length === 0) {
    console.log("충돌이 감지되지 않았습니다.");
    return;
  }

  console.log("충돌 후보가 감지되었습니다:");
  for (const conflict of conflicts) {
    console.log(`- [${conflict.type}] ${conflict.scenarioB.title}`);
    console.log(`  이유: ${conflict.reason}`);
    console.log(`  제안: ${conflict.suggestion}`);
  }
}
