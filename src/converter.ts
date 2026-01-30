import { ScenarioGroup } from "./types";

export function scenarioGroupToPlaywright(group: ScenarioGroup): {
  fileName: string;
  content: string;
} {
  const fileName = `${group.id}.test.ts`;
  const lines: string[] = [];
  lines.push("import { test, expect } from '@playwright/test';");
  lines.push("");
  lines.push(`test.describe('${escapeQuote(group.input)}', () => {`);

  for (const scenario of group.scenarios) {
    lines.push(`  test('${escapeQuote(scenario.title)}', async ({ page }) => {`);
    lines.push("    await page.goto('https://letti.nota.ai');");
    lines.push("    await page.waitForLoadState('domcontentloaded');");
    for (const step of scenario.steps) {
      lines.push("    " + stepComment(step));
      const actions = stepToActions(step);
      for (const action of actions) {
        lines.push(`    ${action}`);
      }
    }
    lines.push("    await page.waitForLoadState('networkidle');");
    for (const expected of scenario.expected) {
      lines.push("    " + expectedComment(expected));
      const asserts = expectedToAssertions(expected);
      for (const assertion of asserts) {
        lines.push(`    ${assertion}`);
      }
    }
    lines.push("  });");
    lines.push("");
  }

  lines.push("});");

  return {
    fileName,
    content: lines.join("\n"),
  };
}

function stepComment(step: string): string {
  return `// 단계: ${step}`;
}

function expectedComment(expected: string): string {
  return `// 기대: ${expected}`;
}

function stepToActions(step: string): string[] {
  const actions: string[] = [];
  if (includesAny(step, ["접속", "페이지", "열기"])) {
    actions.push("await page.goto('https://letti.nota.ai');");
  }
  if (includesAny(step, ["업로드", "파일"])) {
    actions.push("await page.setInputFiles('input[type=\"file\"]', 'tests/fixtures/sample.png');");
  }
  if (includesAny(step, ["로그인", "로그 인"])) {
    actions.push("await page.getByRole('button', { name: /로그인/ }).click();");
  }
  if (includesAny(step, ["클릭", "누른다", "선택"])) {
    const label = extractQuoted(step) || "TODO";
    actions.push(`await page.getByRole('button', { name: /${escapeRegex(label)}/ }).click();`);
  }
  if (includesAny(step, ["입력", "작성"])) {
    const label = extractQuoted(step) || "TODO";
    actions.push(`await page.getByPlaceholder(/${escapeRegex(label)}/).fill('테스트 입력');`);
  }
  if (includesAny(step, ["드롭다운", "선택" ])) {
    const label = extractQuoted(step) || "TODO";
    actions.push(`await page.getByRole('option', { name: /${escapeRegex(label)}/ }).click();`);
  }
  if (actions.length === 0) {
    actions.push("// TODO: 필요한 사용자 동작을 추가하세요.");
  }
  return actions;
}

function expectedToAssertions(expected: string): string[] {
  const assertions: string[] = [];
  if (includesAny(expected, ["오류", "실패", "경고"])) {
    assertions.push("await expect(page.getByTestId('error')).toBeVisible();");
  } else if (includesAny(expected, ["성공", "완료", "정상"])) {
    assertions.push("await expect(page.getByTestId('toast')).toContainText(/성공|완료|정상/);");
  } else if (includesAny(expected, ["로딩", "대기"])) {
    assertions.push("await expect(page.getByTestId('loading')).toBeHidden();");
  } else if (includesAny(expected, ["표시", "보인다"])) {
    assertions.push("await expect(page.getByTestId('result')).toBeVisible();");
  } else {
    assertions.push(`await expect(page.locator('body')).toContainText('${escapeQuote(expected)}');`);
  }
  return assertions;
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((word) => text.includes(word));
}

function escapeQuote(text: string): string {
  return text.replace(/'/g, "\\'");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractQuoted(text: string): string | null {
  const match = text.match(/["“”']([^"“”']+)["“”']/);
  return match ? match[1] : null;
}
