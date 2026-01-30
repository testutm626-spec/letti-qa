import { detectAllConflicts } from "../conflict";
import { listScenarioGroups } from "../storage";

export async function handleCheck(): Promise<void> {
  const groups = await listScenarioGroups();
  if (groups.length === 0) {
    console.log("검사할 시나리오 그룹이 없습니다.");
    return;
  }

  const conflicts = detectAllConflicts(groups);
  if (conflicts.length === 0) {
    console.log("충돌이 감지되지 않았습니다.");
    return;
  }

  console.log(`총 ${conflicts.length}건의 충돌 후보가 있습니다.`);
  for (const conflict of conflicts) {
    console.log(`- [${conflict.type}] ${conflict.groupA.id}:${conflict.scenarioA.title}`);
    console.log(`  대상: ${conflict.groupB.id}:${conflict.scenarioB.title}`);
    console.log(`  이유: ${conflict.reason}`);
    console.log(`  제안: ${conflict.suggestion}`);
  }
}
