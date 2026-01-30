export type Scenario = {
  id: string;
  title: string;
  steps: string[];
  expected: string[];
  tags?: string[];
};

export type ScenarioGroup = {
  id: string;
  input: string;
  createdAt: string;
  scenarios: Scenario[];
  source: "claude" | "manual";
  generationHistory: GenerationRecord[];
};

export type GenerationRecord = {
  generatedAt: string;
  testFile: string;
};

export type ConflictType = "overlap" | "contradiction" | "redundant";

export type Conflict = {
  type: ConflictType;
  scenarioA: Scenario;
  groupA: ScenarioGroup;
  scenarioB: Scenario;
  groupB: ScenarioGroup;
  score: number;
  reason: string;
  suggestion: string;
};

export type ExpandedScenario = {
  title: string;
  steps: string[];
  expected: string[];
  tags?: string[];
};
