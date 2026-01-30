import { listScenarioGroups } from "../storage";

export async function handleList(): Promise<void> {
  const groups = await listScenarioGroups();
  if (groups.length === 0) {
    console.log("저장된 시나리오 그룹이 없습니다.");
    return;
  }

  console.log("시나리오 그룹 목록:");
  for (const group of groups) {
    console.log(`- ${group.id} | ${group.input} | ${group.scenarios.length}개`);
  }
}
