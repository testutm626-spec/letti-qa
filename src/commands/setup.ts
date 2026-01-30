import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { spawnSync } from "child_process";

const CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".letti-qa"
);
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function checkCodexInstalled(): boolean {
  const result = spawnSync("which", ["codex"], { stdio: "pipe" });
  return result.status === 0;
}

function checkAnthropicKey(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
}

interface Config {
  apiKey?: string;
  model?: string;
  setupComplete?: boolean;
}

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function isSetupComplete(): boolean {
  const config = loadConfig();
  if (config.setupComplete) return true;
  // Also check environment variables
  if (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY) return true;
  return false;
}

export function getApiKey(): string | undefined {
  const config = loadConfig();
  return (
    config.apiKey ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );
}

export function getModel(): string {
  const config = loadConfig();
  return (
    config.model ||
    process.env.LETTI_QA_CLAUDE_MODEL ||
    "claude-sonnet-4-20250514"
  );
}

export async function handleSetup(): Promise<void> {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                                                              ║");
  console.log("║               🚀 Letti QA 설정 마법사                        ║");
  console.log("║                                                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("이 가이드를 따라하면 Letti QA를 바로 사용할 수 있습니다.");
  console.log("");

  // Step 1: Check Node.js
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 1단계: 환경 확인");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log(`   ✅ Node.js 버전: ${process.version}`);
  console.log(`   ✅ 운영체제: ${process.platform}`);
  console.log(`   ✅ Letti QA 설치 완료`);
  console.log("");

  // Step 2: Check Codex CLI
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🤖 2단계: Codex CLI 확인");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("   Letti QA는 Codex CLI를 통해 AI 시나리오를 생성합니다.");
  console.log("");
  
  const codexInstalled = checkCodexInstalled();
  if (codexInstalled) {
    console.log("   ✅ Codex CLI가 설치되어 있습니다!");
    console.log("");
  } else {
    console.log("   ❌ Codex CLI가 설치되어 있지 않습니다.");
    console.log("");
    console.log("   📋 Codex 설치 방법:");
    console.log("   1. 터미널에서 다음 명령 실행:");
    console.log("      npm install -g @openai/codex");
    console.log("");
    console.log("   2. 설치 확인:");
    console.log("      codex --version");
    console.log("");
    console.log("   📖 자세한 정보: https://github.com/openai/codex");
    console.log("");
    await prompt("   Codex를 설치한 후 Enter를 누르세요 (나중에 설치하려면 그냥 Enter): ");
    console.log("");
  }

  // Step 3: API Key
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 3단계: Anthropic API 키 설정");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("   Codex가 Claude AI를 사용하려면 Anthropic API 키가 필요합니다.");
  console.log("");

  const hasEnvKey = checkAnthropicKey();
  if (hasEnvKey) {
    console.log("   ✅ 환경변수에 API 키가 설정되어 있습니다!");
    console.log("");
  } else {
    console.log("   📋 API 키 설정 방법:");
    console.log("");
    console.log("   1️⃣  Anthropic API 키 발급:");
    console.log("      • https://console.anthropic.com 접속");
    console.log("      • 로그인 또는 회원가입");
    console.log("      • API Keys 메뉴에서 'Create Key' 클릭");
    console.log("      • 생성된 키 복사 (sk-ant-... 형태)");
    console.log("");
    console.log("   2️⃣  환경변수 설정 (터미널에서 실행):");
    console.log("      export ANTHROPIC_API_KEY=sk-ant-api03-...");
    console.log("");
    console.log("   3️⃣  영구 설정 (선택사항):");
    console.log("      # ~/.bashrc 또는 ~/.zshrc에 추가:");
    console.log("      echo 'export ANTHROPIC_API_KEY=sk-ant-api03-...' >> ~/.bashrc");
    console.log("      source ~/.bashrc");
    console.log("");
    await prompt("   API 키를 설정한 후 Enter를 누르세요 (나중에 설정하려면 그냥 Enter): ");
    console.log("");
  }

  // Step 4: Usage Guide
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📖 4단계: 사용 방법");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("   🎯 기본 워크플로:");
  console.log("");
  console.log("   1️⃣  시나리오 추가 (한 줄 요청 → AI가 5~8개 시나리오로 확장)");
  console.log('       $ letti-qa add "로그인 기능 테스트"');
  console.log("");
  console.log("   2️⃣  시나리오 목록 확인");
  console.log("       $ letti-qa list");
  console.log("");
  console.log("   3️⃣  Playwright 테스트 코드 생성");
  console.log("       $ letti-qa generate        # 전체 시나리오");
  console.log("       $ letti-qa generate <id>   # 특정 시나리오");
  console.log("");
  console.log("   4️⃣  시나리오 충돌 검사");
  console.log("       $ letti-qa check");
  console.log("");
  console.log("   5️⃣  웹 대시보드 실행");
  console.log("       $ npm run serve");
  console.log("       → http://localhost:3000 에서 시나리오 관리");
  console.log("");

  // Quick Start
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚡ 시작하기");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("   지금 바로 시작해보세요:");
  console.log("");
  console.log('   $ letti-qa add "회원가입 테스트"');
  console.log("");

  // Mark setup complete
  const config = loadConfig();
  config.setupComplete = true;
  saveConfig(config);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✨ 설정이 완료되었습니다!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("   도움이 필요하면: letti-qa --help");
  console.log("   다시 설정하려면: letti-qa setup");
  console.log("");
}

export async function checkFirstRun(): Promise<boolean> {
  if (isSetupComplete()) {
    return false;
  }

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  👋 Letti QA에 오신 것을 환영합니다!                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("   처음 사용하시는 것 같습니다.");
  console.log("   설정 마법사를 실행하시겠습니까?");
  console.log("");

  const answer = await prompt("   설정을 시작하시겠습니까? (Y/n): ");
  
  if (answer.toLowerCase() !== "n") {
    await handleSetup();
    return true;
  } else {
    console.log("");
    console.log("   ⏭️  나중에 'letti-qa setup' 명령으로 설정할 수 있습니다.");
    console.log("");
    
    // Still mark as complete to avoid asking again
    const config = loadConfig();
    config.setupComplete = true;
    saveConfig(config);
    return false;
  }
}
