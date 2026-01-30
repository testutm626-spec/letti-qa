# Letti QA

Letti QA는 한 줄의 테스트 요청을 AI가 확장해 시나리오를 저장하고, Playwright 테스트 코드로 변환하는 CLI 도구입니다.

## 🚀 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone https://github.com/yourorg/letti-qa.git
cd letti-qa

# 의존성 설치
npm install

# 빌드
npm run build

# 전역 설치 (선택)
npm link
```

### 2. Codex CLI 설치

Letti QA는 AI 시나리오 생성을 위해 Codex CLI를 사용합니다.

```bash
# Codex 설치
npm install -g @openai/codex

# 설치 확인
codex --version
```

### 3. API 키 설정

Anthropic API 키가 필요합니다.

```bash
# API 키 발급: https://console.anthropic.com

# 환경변수 설정
export ANTHROPIC_API_KEY=sk-ant-api03-...

# 영구 설정 (선택)
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-...' >> ~/.bashrc
source ~/.bashrc
```

### 4. 설정 마법사 실행

처음 사용하시면 설정 마법사가 자동으로 실행됩니다. 수동으로 실행하려면:

```bash
letti-qa setup
```

## 📖 사용법

### 시나리오 추가

한 줄 요청을 5~8개의 테스트 시나리오로 확장합니다.

```bash
letti-qa add "배경 제거 기능 테스트"
letti-qa add "로그인 시나리오"
letti-qa add "이미지 업로드 테스트"
```

### 시나리오 목록 보기

```bash
letti-qa list
```

### Playwright 테스트 파일 생성

```bash
# 전체 시나리오
letti-qa generate

# 특정 시나리오
letti-qa generate <id>
```

### 충돌 검사

기존 시나리오와의 중복/상충 여부를 확인합니다.

```bash
letti-qa check
```

### 웹 대시보드

시나리오를 브라우저에서 관리할 수 있습니다.

```bash
npm run serve
# http://localhost:3000 접속
```

## 🎯 주요 기능

- ✨ 한 줄 요청을 5~8개의 테스트 시나리오로 확장
- 📁 시나리오를 YAML로 저장하고 버전 관리에 적합하게 유지
- 🔍 기존 시나리오와의 중복/상충 여부 자동 감지
- 🎭 Playwright `.test.ts` 파일 생성
- 🌐 웹 대시보드로 시나리오 관리

## 📂 디렉터리 구조

```
letti-qa/
├── src/
│   ├── cli.ts              # CLI 진입점
│   ├── ai.ts               # AI 시나리오 생성
│   ├── storage.ts          # YAML 저장/로드
│   ├── converter.ts        # Playwright 코드 변환
│   ├── conflict.ts         # 충돌 감지
│   ├── server.ts           # 웹 대시보드 서버
│   └── commands/           # CLI 명령어
├── scenarios/              # 생성된 시나리오 (YAML)
├── tests/                  # 생성된 테스트 파일
├── public/                 # 웹 대시보드 정적 파일
└── dist/                   # 컴파일된 JS
```

## 📝 시나리오 저장 형식

`scenarios/<id>.yml`

```yaml
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

## ⚙️ 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 | ✅ |
| `CLAUDE_API_KEY` | Anthropic API 키 (대체) | - |
| `LETTI_QA_CLAUDE_MODEL` | Claude 모델 이름 | - |

## 🔧 개발

```bash
# 빌드
npm run build

# 개발 모드 (파일 변경 감지)
npm run dev

# 테스트
npm run test
```

## 📌 Playwright 테스트 생성 규칙

- `https://letti.nota.ai`를 기본 진입점으로 사용
- `data-testid`를 우선 사용, 없을 경우 CSS 셀렉터 보조
- 파일 업로드는 `tests/fixtures/sample.png` 사용

## 🆘 문제 해결

### "Codex CLI가 설치되어 있지 않습니다"

```bash
npm install -g @openai/codex
```

### "API 키가 설정되어 있지 않습니다"

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 다시 설정하기

```bash
letti-qa setup
```

## 라이선스

MIT
