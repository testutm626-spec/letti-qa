import { Conflict, ConflictType, Scenario, ScenarioGroup } from "./types";

const POSITIVE_KEYWORDS = ["성공", "완료", "정상", "표시된다", "생성된다", "저장된다"];
const NEGATIVE_KEYWORDS = ["실패", "오류", "경고", "표시되지", "차단", "거부", "중단"];

export function detectConflicts(
  newScenarios: Scenario[],
  existingGroups: ScenarioGroup[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const existingGroup of existingGroups) {
    for (const existingScenario of existingGroup.scenarios) {
      for (const scenario of newScenarios) {
        const score = similarityScore(scenario, existingScenario);
        if (score < 0.6) continue;
        const type = classifyConflict(scenario, existingScenario, score);
        conflicts.push({
          type,
          scenarioA: scenario,
          groupA: dummyGroupForScenario(scenario),
          scenarioB: existingScenario,
          groupB: existingGroup,
          score,
          reason: buildReason(type, score),
          suggestion: buildSuggestion(type),
        });
      }
    }
  }
  return conflicts;
}

export function detectAllConflicts(groups: ScenarioGroup[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i; j < groups.length; j += 1) {
      const groupA = groups[i];
      const groupB = groups[j];
      for (const scenarioA of groupA.scenarios) {
        for (const scenarioB of groupB.scenarios) {
          if (groupA.id === groupB.id && scenarioA.id === scenarioB.id) continue;
          const score = similarityScore(scenarioA, scenarioB);
          if (score < 0.6) continue;
          const type = classifyConflict(scenarioA, scenarioB, score);
          conflicts.push({
            type,
            scenarioA,
            groupA,
            scenarioB,
            groupB,
            score,
            reason: buildReason(type, score),
            suggestion: buildSuggestion(type),
          });
        }
      }
    }
  }
  return conflicts;
}

function similarityScore(a: Scenario, b: Scenario): number {
  const tokensA = tokenize(`${a.title} ${a.steps.join(" ")} ${a.expected.join(" ")}`);
  const tokensB = tokenize(`${b.title} ${b.steps.join(" ")} ${b.expected.join(" ")}`);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\s\n\r]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function classifyConflict(a: Scenario, b: Scenario, score: number): ConflictType {
  if (score >= 0.85) return "redundant";
  if (hasContradiction(a, b)) return "contradiction";
  return "overlap";
}

function hasContradiction(a: Scenario, b: Scenario): boolean {
  const aText = a.expected.join(" ");
  const bText = b.expected.join(" ");
  const aPositive = POSITIVE_KEYWORDS.some((word) => aText.includes(word));
  const aNegative = NEGATIVE_KEYWORDS.some((word) => aText.includes(word));
  const bPositive = POSITIVE_KEYWORDS.some((word) => bText.includes(word));
  const bNegative = NEGATIVE_KEYWORDS.some((word) => bText.includes(word));
  return (aPositive && bNegative) || (aNegative && bPositive);
}

function buildReason(type: ConflictType, score: number): string {
  switch (type) {
    case "redundant":
      return `유사도 ${Math.round(score * 100)}%로 거의 동일한 커버리지입니다.`;
    case "contradiction":
      return "기대 결과가 서로 상충될 가능성이 있습니다.";
    default:
      return `유사도 ${Math.round(score * 100)}%로 중복 커버리지가 있습니다.`;
  }
}

function buildSuggestion(type: ConflictType): string {
  switch (type) {
    case "redundant":
      return "기존 시나리오와 병합하거나 삭제를 검토하세요.";
    case "contradiction":
      return "기대 결과를 하나로 정리하거나 조건을 분리하세요.";
    default:
      return "시나리오 범위를 구체화하거나 중복을 줄이세요.";
  }
}

function dummyGroupForScenario(scenario: Scenario): ScenarioGroup {
  return {
    id: "(신규)",
    input: "",
    createdAt: "",
    scenarios: [scenario],
    source: "manual",
    generationHistory: [],
  };
}
