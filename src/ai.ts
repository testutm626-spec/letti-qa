import { spawn } from "child_process";
import { ExpandedScenario } from "./types";

export type AIOptions = {
  model?: string;
  timeout?: number;
};

export async function expandScenarios(
  userInput: string,
  options: AIOptions = {}
): Promise<ExpandedScenario[]> {
  const prompt = buildPrompt(userInput);
  const responseText = await callCodex(prompt, options);
  const parsed = safeJsonParse(responseText);
  if (!parsed || !Array.isArray(parsed.scenarios)) {
    throw new Error("시나리오 파싱에 실패했습니다. 응답 형식을 확인해 주세요.");
  }
  return parsed.scenarios.map((item: ExpandedScenario) => ({
    title: String(item.title || ""),
    steps: Array.isArray(item.steps) ? item.steps.map(String) : [],
    expected: Array.isArray(item.expected) ? item.expected.map(String) : [],
    tags: Array.isArray(item.tags) ? item.tags.map(String) : undefined,
  }));
}

function buildPrompt(userInput: string): string {
  return [
    "너는 QA 테스트 시나리오 작성 전문가야.",
    "사용자의 한 줄 요청을 바탕으로 5~8개의 테스트 시나리오를 생성해.",
    "",
    "대상 서비스: Letti (https://letti.nota.ai) - AI 기반 상품 사진 편집 서비스",
    "주요 기능: 배경 제거, 컬러 배경 생성, 대량 편집, 이미지 생성, 라이프스타일 사진 합성",
    "",
    "요구사항:",
    "- 정상 흐름, 엣지 케이스, 오류 처리, UI/UX 검증을 균형 있게 포함",
    "- 각 시나리오는 title, steps(배열), expected(배열), tags(선택)로 구성",
    "- 모든 문장은 한국어로",
    "- 반드시 JSON만 출력 (설명 없이)",
    "",
    "출력 형식:",
    '{"scenarios":[{"title":"시나리오 제목","steps":["단계1","단계2"],"expected":["기대결과1"],"tags":["태그"]}]}',
    "",
    "사용자 요청:",
    userInput,
  ].join("\n");
}

async function callCodex(prompt: string, options: AIOptions): Promise<string> {
  const timeout = options.timeout ?? 120000; // 2 minutes default

  return new Promise((resolve, reject) => {
    const args = ["exec", "-s", "read-only", prompt];

    const proc = spawn("codex", args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Codex 실행 오류 (code ${code}): ${stderr || stdout}`));
        return;
      }
      // Extract JSON from codex output (may contain thinking/exec logs)
      const jsonMatch = stdout.match(/\{[\s\S]*"scenarios"[\s\S]*\}/);
      if (jsonMatch) {
        resolve(jsonMatch[0]);
      } else {
        resolve(stdout);
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Codex 실행 실패: ${err.message}`));
    });
  });
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from text
    const start = text.indexOf('{"scenarios"');
    if (start === -1) {
      const altStart = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (altStart >= 0 && end > altStart) {
        try {
          return JSON.parse(text.slice(altStart, end + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
    const end = text.lastIndexOf("}");
    if (end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
