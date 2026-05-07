# Frontend Development Conventions

이 문서는 My Life Movie 프론트엔드 저장소의 협업 기준을 정의한다. 모든 팀원은 화면 개발, API 연동, 스타일 변경, 배포 준비 시 이 기준을 기본 규칙으로 따른다.

## 1. Git Workflow

### Branch Roles

| Branch | Purpose | Rule |
|---|---|---|
| `main` | 배포 가능한 안정 버전 | 직접 push 금지, PR merge만 허용 |
| `develop` | 다음 배포를 위한 통합 브랜치 | 기능 브랜치의 기본 base |
| `feature/*` | 신규 화면, 기능 개발 | `develop`에서 분기하고 `develop`으로 PR |
| `fix/*` | 일반 버그 수정 | `develop`에서 분기하고 `develop`으로 PR |
| `hotfix/*` | 운영 긴급 수정 | `main`에서 분기하고 `main`, `develop`에 반영 |
| `release/*` | 릴리스 안정화 | `develop`에서 분기하고 최종적으로 `main`에 merge |
| `docs/*` | 문서 변경 | 변경 범위에 따라 `develop` 또는 관련 브랜치로 PR |
| `chore/*` | 설정, 의존성, 빌드 작업 | 기능 변경과 분리 |

### Branch Naming

브랜치 이름은 소문자 kebab-case를 사용한다. 공백, 한글, 특수문자는 사용하지 않는다.

```text
<type>/<issue-number>-<short-description>
```

예시:

```text
feature/12-upload-page
feature/15-movie-result-view
fix/18-mobile-layout
docs/21-frontend-conventions
chore/24-update-ci
```

이슈가 없는 작은 작업이라도 가능하면 이슈를 먼저 만들고 연결한다. 정말 단순한 오탈자 수정만 예외로 둘 수 있다.

## 2. Commit Convention

커밋 메시지는 Conventional Commits 형식을 따른다.

```text
<type>(<scope>): <subject>
```

### Commit Types

| Type | Usage |
|---|---|
| `feat` | 사용자에게 보이는 신규 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 포맷팅, 스타일 조정 등 동작 변경 없는 수정 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 기타 관리 작업 |
| `build` | 빌드 시스템, 패키지 변경 |
| `ci` | GitHub Actions 등 CI 설정 |
| `perf` | 성능 개선 |
| `revert` | 이전 커밋 되돌림 |

### Frontend Scopes

권장 scope:

```text
app, page, ui, layout, styles, api, config, ci, docs, deps, test
```

예시:

```text
feat(page): add upload entry screen
fix(layout): prevent mobile button overflow
docs(docs): add frontend development conventions
ci(build): run next build on pull requests
chore(deps): update next dependency
```

규칙:

- subject는 72자 이내로 작성한다.
- 마침표로 끝내지 않는다.
- 한 커밋에는 하나의 목적만 담는다.
- 변경 이유가 중요하면 본문에 `why`와 `impact`를 적는다.
- 이슈 연결은 footer에 `Closes #12`, `Refs #18` 형식으로 적는다.

## 3. Pull Request Rules

PR은 리뷰 가능한 크기로 유지한다. 화면 구현, API 연동, 리팩터링, 문서 변경, 의존성 변경은 가능하면 별도 PR로 분리한다.

PR 작성 기준:

- PR 제목은 커밋 컨벤션과 비슷한 형식을 권장한다.
- 관련 이슈를 반드시 연결한다.
- 변경 사항, 검증 방법, 영향 범위를 적는다.
- UI 변경은 스크린샷 또는 화면 녹화를 첨부한다.
- 반응형 영향이 있으면 모바일/데스크톱 확인 결과를 적는다.
- CI가 통과한 뒤 리뷰 요청을 보낸다.
- 리뷰어 최소 1명의 승인을 받은 뒤 merge한다.

Merge 기준:

- `main`, `develop` 직접 push 금지
- 기본 전략은 squash merge
- merge 후 원격 feature 브랜치 삭제
- 충돌 해결 시 기존 변경을 임의로 되돌리지 않는다

## 4. Logging Standard

프론트엔드 로그는 사용자 흐름, API 연동 실패, 런타임 에러를 파악하기 위해 남긴다. 브라우저에 노출되는 환경이므로 개인정보와 토큰은 절대 기록하지 않는다.

### Log Levels

| Level | Usage |
|---|---|
| `DEBUG` | 로컬 개발용 상세 상태. 운영 빌드에서는 제거 또는 비활성화 |
| `INFO` | 주요 사용자 흐름 또는 정상 완료 이벤트 |
| `WARNING` | 복구 가능한 문제, API 재시도, fallback UI 표시 |
| `ERROR` | 사용자 흐름을 막는 실패, 렌더링 예외, API 실패 |

### Required Fields

로그 이벤트는 가능한 한 객체 형태로 남긴다.

```json
{
  "timestamp": "2026-05-07T12:00:00Z",
  "level": "INFO",
  "service": "my-life-movie-frontend",
  "environment": "dev",
  "event": "movie_generate_clicked",
  "route": "/",
  "component": "UploadPage",
  "request_id": "req_123",
  "duration_ms": 180
}
```

필수 기준:

- `timestamp`는 UTC ISO 8601 형식을 사용한다.
- API 호출에는 `request_id`를 포함하고 가능하면 `X-Request-ID` 헤더로 백엔드에 전달한다.
- 화면 이벤트 이름은 snake_case 동사형으로 작성한다.
- 운영 코드에 임의의 `console.log`를 남기지 않는다.
- 에러 로그에는 사용자에게 보여준 메시지와 개발자가 확인할 error code를 구분한다.

### Sensitive Data Rules

아래 정보는 로그에 남기지 않는다.

- 업로드 파일 원문 또는 파일 내용
- 카카오톡 대화 내용
- 사용자의 이름, 이메일, 전화번호, 주소
- OAuth token, API key, session cookie
- 개인 데이터가 포함된 전체 요청 payload
- AI 프롬프트 전문

필요하면 최소한의 메타데이터만 남긴다.

```text
file_type=pdf
file_size_kb=842
upload_count=1
```

### Event Naming

이벤트 이름은 snake_case 동사형으로 작성한다.

```text
upload_button_clicked
file_selected
file_validation_failed
movie_generate_clicked
movie_generate_succeeded
movie_generate_failed
api_request_started
api_request_failed
```

## 5. Issue and Label Rules

기본 라벨:

| Label | Meaning |
|---|---|
| `🐛 bug` | 버그 |
| `✨ feature` | 기능 개선 또는 신규 기능 |
| `🛠️ task` | 일반 개발 작업 |
| `📝 docs` | 문서 |
| `💻 frontend` | 프론트엔드 관련 |
| `🎨 ui` | 화면, 스타일, UX 관련 |
| `🔌 api` | 백엔드 API 연동 관련 |
| `⚙️ infra` | CI, 배포, 환경 설정 |

이슈는 문제 배경, 기대 결과, 완료 조건을 포함해야 한다. UI 이슈는 가능하면 스크린샷, 브라우저, 화면 크기를 함께 적는다.

## 6. Definition of Done

작업 완료 기준:

- 요구사항이 구현되었다.
- 모바일과 데스크톱에서 레이아웃이 깨지지 않는다.
- 필요한 로딩, 에러, 빈 상태가 처리되었다.
- `pnpm lint`와 `pnpm build`가 통과한다.
- API 변경 또는 화면 흐름 변경 시 문서가 갱신되었다.
- PR 템플릿 체크리스트가 충족되었다.

## 7. CI Standard

프론트엔드 CI는 최소한 다음을 검증해야 한다.

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

Next.js 빌드가 외부 폰트 다운로드에 의존하면 CI 네트워크 정책에 영향을 받을 수 있다. 배포 안정성이 중요해지는 시점에는 로컬 폰트 또는 시스템 폰트 사용을 검토한다.
