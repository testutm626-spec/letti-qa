# Letti QA — AI-Powered Test Scenario Automation

## Product Context
Target: https://letti.nota.ai — AI Photo Editor with features:
- Background Remover
- Color Background Maker  
- Bulk Edit (batch processing)
- Image Generator (text-to-backdrop)
- Lifestyle Photo Maker (product scene compositing)
- Image Playground (advanced multi-input creation)

## Core Requirements

### 1. Scenario Expansion
- User writes ONE casual line: "배경 제거 기능 테스트"
- AI expands into 5-8 comprehensive test scenarios covering:
  - Happy path (normal flows)
  - Edge cases (boundaries, unusual inputs)
  - Error handling (invalid files, network failures)
  - UI/UX validation (loading states, feedback)

### 2. Test Format Generation
- Convert scenarios to Playwright-compatible `.test.ts` files
- Support data-testid selectors and realistic CSS selectors
- Include assertions, waits, and proper test structure

### 3. Conflict Detection
- When adding new scenarios, auto-check against existing ones
- Detect: overlap (duplicate coverage), contradiction (conflicting expectations), redundant (fully covered by another)
- Provide suggestions for resolution

### 4. Scenario Management
- Store scenarios in YAML format (human-readable, version-controllable)
- CLI commands: add, list, generate, check
- Track generation history and test file associations

## Tech Stack
- TypeScript + Node.js
- Native HTTPS for Claude API (no SDK dependency)
- Playwright for test output format
- YAML for scenario storage
- Commander.js for CLI

## CLI Interface
```bash
letti-qa add "배경 제거 기능 테스트"     # Expand + save + auto conflict check
letti-qa list                            # Show all scenario groups
letti-qa generate [id]                   # Generate Playwright test files
letti-qa check                           # Run full conflict analysis
```

## Output Structure
```
letti-qa/
├── src/
│   ├── cli.ts              # CLI entry
│   ├── types.ts            # TypeScript types
│   ├── ai.ts               # Claude API integration
│   ├── storage.ts          # YAML scenario persistence
│   ├── converter.ts        # Scenario → Playwright converter
│   └── commands/           # CLI command handlers
├── scenarios/              # Generated scenario YAML files
├── tests/                  # Generated Playwright test files
├── package.json
├── tsconfig.json
└── README.md
