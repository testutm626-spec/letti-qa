import https from "https";
import { ExpandedScenario } from "./types";

const DEFAULT_MODEL = process.env.LETTI_QA_CLAUDE_MODEL || "claude-3-5-sonnet-20240620";
const API_HOST = "api.anthropic.com";
const API_PATH = "/v1/messages";
const API_VERSION = "2023-06-01";

export type ClaudeOptions = {
  apiKey: string;
  model?: string;
  maxTokens?: number;
};

export async function expandScenarios(
  userInput: string,
  options: ClaudeOptions
): Promise<ExpandedScenario[]> {
  const prompt = buildPrompt(userInput);
  const responseText = await callClaude(prompt, options);
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
    "요구사항:",
    "- 정상 흐름, 엣지 케이스, 오류 처리, UI/UX 검증을 균형 있게 포함",
    "- 각 시나리오는 title, steps(배열), expected(배열), tags(선택)로 구성",
    "- 모든 문장은 한국어로",
    "- 반드시 JSON만 출력",
    "출력 형식:",
    "{\"scenarios\":[{\"title\":\"...\",\"steps\":[...],\"expected\":[...],\"tags\":[...]}]}",
    "사용자 요청:",
    userInput,
  ].join("\n");
}

async function callClaude(prompt: string, options: ClaudeOptions): Promise<string> {
  const payload = JSON.stringify({
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 1200,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
  });

  const requestOptions: https.RequestOptions = {
    hostname: API_HOST,
    path: API_PATH,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(payload),
      "x-api-key": options.apiKey,
      "anthropic-version": API_VERSION,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Claude API 오류: ${res.statusCode} ${body}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          const text = extractTextFromClaude(parsed);
          resolve(text);
        } catch (error) {
          reject(new Error("Claude 응답 파싱에 실패했습니다."));
        }
      });
    });

    req.on("error", (error) => reject(error));
    req.write(payload);
    req.end();
  });
}

function extractTextFromClaude(payload: any): string {
  if (!payload || !Array.isArray(payload.content)) {
    return "";
  }
  return payload.content
    .filter((item: any) => item.type === "text")
    .map((item: any) => String(item.text || ""))
    .join("\n");
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
