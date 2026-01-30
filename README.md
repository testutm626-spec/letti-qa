# Letti QA

Letti QA는 한 줄의 테스트 요청을 AI가 확장해 시나리오를 저장하고, Playwright 테스트 코드로 변환하는 CLI 도구입니다.

## 주요 기능

- 한 줄 요청을 5~8개의 테스트 시나리오로 확장
- 시나리오를 YAML로 저장하고 버전 관리에 적합하게 유지
- 기존 시나리오와의 중복/상충 여부 자동 감지
- Playwright `.test.ts` 파일 생성

## 설치

```bash
npm install
```

## 사용법

```bash
# 시나리오 추가
letti-qa add "배경 제거 기능 테스트"

# 시나리오 목록 보기
letti-qa list

# 테스트 파일 생성 (전체 또는 특정 ID)
letti-qa generate
letti-qa generate <id>

# 충돌 검사
letti-qa check
```

## 환경 변수

- `CLAUDE_API_KEY` 또는 `ANTHROPIC_API_KEY`: Claude API 키
- `LETTI_QA_CLAUDE_MODEL`: Claude 모델 이름 (선택, 기본값: `claude-3-5-sonnet-20240620`)

## 디렉터리 구조

```
letti-qa/
├── src/
│   ├── cli.ts
│   ├── ai.ts
│   ├── storage.ts
│   ├── converter.ts
│   ├── conflict.ts
│   └── commands/
├── scenarios/
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 시나리오 저장 형식

`scenarios/<id>.yml`

```yml
id: "..."
input: "배경 제거 기능 테스트"
createdAt: "2026-01-30T12:00:00.000Z"
source: "claude"
scenarios:
  - id: "..."
    title: "..."
    steps:
      - "..."
    expected:
      - "..."
    tags:
      - "..."
generationHistory:
  - generatedAt: "2026-01-30T12:10:00.000Z"
    testFile: "tests/<id>.test.ts"
```

## Playwright 테스트 생성 규칙

- `https://letti.nota.ai`를 기본 진입점으로 사용합니다.
- `data-testid`를 우선 사용하며, 없을 경우 CSS 셀렉터를 보조합니다.
- 시나리오 단계와 기대 결과는 주석과 기본 액션/검증으로 변환됩니다.
- 실제 셀렉터는 프로젝트 상황에 맞게 보완하세요.
- 파일 업로드 단계는 `tests/fixtures/sample.png`를 사용하므로 샘플 이미지를 준비하세요.

## 개발

```bash
npm run build
npm run test
```

## 참고 사항

- Claude API 호출은 Node.js의 `https` 모듈을 사용합니다.
- 시나리오 충돌 감지는 유사도 기반 휴리스틱이며, 최종 판단은 사람이 확인해야 합니다.
