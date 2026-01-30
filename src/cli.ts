#!/usr/bin/env node
import { Command } from "commander";
import { handleAdd } from "./commands/add";
import { handleList } from "./commands/list";
import { handleGenerate } from "./commands/generate";
import { handleCheck } from "./commands/check";
import { handleSetup, checkFirstRun } from "./commands/setup";

const program = new Command();

program
  .name("letti-qa")
  .description("Letti QA 시나리오 자동화 CLI")
  .version("0.1.0");

program.configureHelp({
  formatHelp: (cmd, helper) => {
    const commands = helper.visibleCommands(cmd);
    const options = helper.visibleOptions(cmd);
    let output = `${cmd.name()} - ${cmd.description()}\n\n`;
    output += `사용법:\n  ${helper.commandUsage(cmd)}\n`;
    if (commands.length > 0) {
      output += "\n명령어:\n";
      output += commands
        .map((sub) => `  ${sub.name()}\t${sub.description()}`)
        .join("\n");
      output += "\n";
    }
    if (options.length > 0) {
      output += "\n옵션:\n";
      output += options
        .map((opt) => `  ${helper.optionTerm(opt)}\t${opt.description}`)
        .join("\n");
      output += "\n";
    }
    output += "\n예시:\n  letti-qa add \"배경 제거 기능 테스트\"\n  letti-qa list\n  letti-qa generate [id]\n  letti-qa check\n";
    return output;
  },
});

program
  .command("add")
  .description("한 줄 요청을 시나리오로 확장하여 저장")
  .argument("[input]", "시나리오 요청 문장")
  .action(async (input) => {
    await handleAdd(input);
  });

program
  .command("list")
  .description("저장된 시나리오 그룹 목록 출력")
  .action(async () => {
    await handleList();
  });

program
  .command("generate")
  .description("Playwright 테스트 파일 생성")
  .argument("[id]", "시나리오 그룹 ID (선택)")
  .action(async (id) => {
    await handleGenerate(id);
  });

program
  .command("check")
  .description("전체 시나리오 충돌 분석")
  .action(async () => {
    await handleCheck();
  });

program
  .command("setup")
  .description("초기 설정 마법사 실행")
  .action(async () => {
    await handleSetup();
  });

// Check for first run before executing commands
async function main() {
  const args = process.argv.slice(2);
  const isSetupCommand = args[0] === "setup";
  const isHelpCommand = args.includes("--help") || args.includes("-h") || args.includes("-V") || args.includes("--version");
  
  // Only check first run for non-setup, non-help commands
  if (!isSetupCommand && !isHelpCommand && args.length > 0) {
    await checkFirstRun();
  }
  
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("실행 중 오류가 발생했습니다:", error);
  process.exitCode = 1;
});
