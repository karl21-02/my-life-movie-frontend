# Frontend Development Conventions

이 문서는 My Life Movie 프론트엔드 저장소의 협업 기준을 정의한다. 화면 개발, API 연동, 스타일 변경, 배포 준비는 이 기준을 기본 규칙으로 따른다.

## 1. 기본 원칙

- `develop` 기준으로 이슈를 만들고, 이슈 번호 기반 브랜치에서 작업한다.
- 사용자가 보는 문구, 주석, 문서는 한국어로 작성한다.
- 브라우저에서 백엔드 API를 직접 호출하지 않고 Next.js BFF route를 경유한다.
- API 에러는 `ApiError`와 공통 helper로 처리한다.
- 사용자 입력, token, 파일 내용, AI 프롬프트 전문은 로그에 남기지 않는다.
- 화면은 로딩, 빈 상태, 실패 상태, 재시도 흐름을 기본으로 포함한다.

## 2. Git Workflow

| Branch | Purpose | Rule |
| --- | --- | --- |
| `main` | 배포 가능한 안정 버전 | 직접 push 금지, PR merge만 허용 |
| `develop` | 다음 배포를 위한 통합 브랜치 | 기능 브랜치의 기본 base |
| `feature/*` | 신규 화면, 기능 개발 | `develop`에서 분기하고 `develop`으로 PR |
| `fix/*` | 일반 버그 수정 | `develop`에서 분기하고 `develop`으로 PR |
| `hotfix/*` | 운영 긴급 수정 | `main`에서 분기하고 `main`, `develop`에 반영 |
| `release/*` | 릴리스 안정화 | `develop`에서 분기하고 최종적으로 `main`에 merge |
| `docs/*` | 문서 변경 | 변경 범위에 따라 `develop` 또는 관련 브랜치로 PR |
| `chore/*` | 설정, 의존성, 빌드 작업 | 기능 변경과 분리 |

브랜치 이름은 소문자 kebab-case를 사용한다.

```text
<type>/<issue-number>-<short-description>
```

예시:

```text
feature/36-video-generation-status
fix/31-api-proxy-auth-routing
docs/45-frontend-conventions
chore/52-update-ci
```

## 3. 커밋 컨벤션

커밋 메시지는 Conventional Commits 형식을 유지하되, 제목은 한국어로 작성한다.

```text
<type>(<scope>): <한국어 제목>
```

권장 scope:

```text
api, app, auth, bff, config, docs, layout, movie, music, page, profile, routes, test, ui
```

예시:

```text
feat(movie): 영상 생성 상태 실시간 표시
fix(api): 브라우저 요청 BFF 경유 고정
docs(docs): 프론트 개발 컨벤션 정리
test(auth): 로그인 라우팅 테스트 추가
```

규칙:

- 제목은 한국어로 72자 이내로 작성한다.
- 마침표로 끝내지 않는다.
- 한 커밋에는 하나의 목적만 담는다.
- 변경 이유가 중요하면 본문에 `왜`와 `영향`을 적는다.
- 이슈 연결은 footer에 `Closes #12`, `Refs #18` 형식으로 적는다.

## 4. Pull Request Rules

- PR 제목은 커밋 컨벤션과 유사한 형식을 사용한다.
- 관련 이슈를 반드시 연결한다.
- 변경 사항, 검증 방법, 영향 범위를 적는다.
- UI 변경은 스크린샷 또는 화면 녹화를 첨부한다.
- 반응형 영향이 있으면 모바일/데스크톱 확인 결과를 적는다.
- API 계약 변경이 있으면 백엔드 PR 또는 Swagger 변경을 함께 연결한다.
- CI와 Vercel Preview가 통과한 뒤 리뷰 요청을 보낸다.
- 리뷰어 최소 1명의 승인을 받은 뒤 merge한다.
- 기본 전략은 일반 merge commit이다.
- merge 후 원격 feature 브랜치는 삭제한다.

## 5. Next.js App Router 패턴

라우팅:

- 페이지는 `src/app` 아래 App Router를 사용한다.
- 인증이 필요한 화면은 server route 또는 BFF에서 session 상태를 우선 확인한다.
- URL 생성은 문자열 하드코딩보다 `src/lib/routes.ts` helper를 우선 사용한다.
- `loading.tsx`, `error.tsx`는 주요 route segment에 둔다.

Server/Client Component:

- 데이터 fetch와 인증 확인은 가능한 한 server route 또는 BFF에서 처리한다.
- 사용자 입력, 브라우저 이벤트, polling, audio playback은 client component에서 처리한다.
- client component는 필요한 props만 받는다.
- 거대한 client component가 되면 feature component로 분리한다.

BFF Route:

- 브라우저는 백엔드 API를 직접 호출하지 않는다.
- `/api/[...path]`, `/api/auth/[action]`, `/generated/[...path]` route를 통해 backend와 통신한다.
- BFF는 cookie/session, request id, backend URL, 에러 변환을 책임진다.
- 백엔드 Problem Details를 가능한 한 유지해서 프론트 helper가 일관되게 파싱하게 한다.

## 6. API 처리 패턴

- `src/lib/api.ts`의 공통 helper를 우선 사용한다.
- 요청마다 `X-Request-ID`를 포함한다.
- JSON 파싱 실패, network timeout, Problem Details 응답을 구분한다.
- 호출부에서 `fetch`를 직접 반복 작성하지 않는다.
- 백엔드 에러는 `ApiError`로 변환한다.
- 사용자가 보는 메시지와 개발자가 보는 로그 정보를 분리한다.
- `401 AUTH_REQUIRED`는 refresh 또는 로그인 유도 흐름과 연결한다.
- `403`은 권한 없음, `404`는 리소스 없음, `409`는 상태 충돌로 화면 문구를 분리한다.

Polling:

- 영상 생성 상태처럼 시간이 걸리는 작업은 짧은 polling interval을 쓰되, 완료/실패 시 즉시 중단한다.
- 화면 이탈 시 interval을 정리한다.
- 같은 endpoint를 여러 component에서 중복 polling하지 않는다.
- 실패가 반복되면 사용자에게 재시도 버튼을 보여준다.

## 7. UI와 컴포넌트 패턴

| 위치 | 역할 |
| --- | --- |
| `src/app` | route/page/layout/error/loading |
| `src/components` | 여러 화면에서 재사용하는 공용 UI |
| `src/features/*` | 도메인 단위 API, server action, component, type |
| `src/lib` | 공통 helper, logger, routes, request id |
| `src/types` | 여러 영역에서 공유하는 타입 |

모든 주요 화면은 아래 상태를 고려한다.

- 초기 로딩
- 빈 데이터
- 부분 실패
- 전체 실패
- 권한 만료
- 사용자의 재시도
- 모바일/데스크톱 레이아웃

스타일:

- Tailwind CSS를 기본으로 사용한다.
- 반복되는 시각 패턴은 component로 추출한다.
- 버튼/카드/입력 요소의 크기와 간격은 기존 화면 규칙을 우선 따른다.
- 텍스트가 버튼이나 카드 밖으로 넘치지 않게 한다.
- UI 문구로 기능 설명을 길게 늘어놓지 않는다.

## 8. Logging Standard

프론트엔드 로그는 사용자 흐름, API 연동 실패, 런타임 에러를 파악하기 위해 남긴다. 브라우저에 노출되는 환경이므로 개인정보와 토큰은 절대 기록하지 않는다.

| Level | Usage |
| --- | --- |
| `debug` | 로컬 개발용 상세 상태. 운영 기본 비활성화 |
| `info` | 주요 사용자 흐름 또는 정상 완료 이벤트 |
| `warn` | 복구 가능한 문제, API 재시도, fallback UI 표시 |
| `error` | 사용자 흐름을 막는 실패, 렌더링 예외, API 실패 |

로그 예시:

```json
{
  "timestamp": "2026-05-13T12:00:00Z",
  "level": "warn",
  "service": "my-life-movie-frontend",
  "environment": "production",
  "event": "api_request_failed",
  "path": "/api/movies/1/chat",
  "method": "POST",
  "request_id": "req_123",
  "status_code": 401,
  "error_code": "AUTH_REQUIRED"
}
```

규칙:

- `src/lib/logger.ts` wrapper를 사용한다.
- 운영에서는 기본적으로 `warn`, `error`만 출력한다.
- API 실패 로그에는 path, method, request_id, status_code, error_code를 포함한다.
- UI 이벤트 로그는 꼭 필요한 흐름만 남긴다.

로그 금지 정보:

- 업로드 파일 원문 또는 파일 내용
- 사용자의 이름, 이메일, 전화번호, 주소
- access token, refresh token, session cookie
- API key, OAuth token
- 개인 데이터가 포함된 전체 요청 payload
- AI 프롬프트 전문, 인생 이야기 원문
- presigned URL 전체 문자열

이벤트 이름은 snake_case로 작성한다.

```text
api_request_started
api_request_failed
auth_login_succeeded
movie_draft_created
movie_generation_requested
movie_generation_status_polled
movie_download_clicked
movie_delete_succeeded
```

`console.log`는 운영 코드에 남기지 않는다. 임시 디버깅 로그는 커밋 전에 제거한다.

## 9. 인증과 세션

- access token은 브라우저 localStorage에 저장하지 않는다.
- refresh token cookie는 백엔드가 관리한다.
- 프론트는 BFF route를 통해 refresh/logout 흐름을 처리한다.
- 인증 실패 시 화면에서 무한 재시도하지 않는다.
- 로그인/회원가입 성공 후 이동 경로는 `routes` helper로 관리한다.

## 10. 미디어와 다운로드

- 생성 영상 다운로드는 백엔드 download endpoint를 사용한다.
- S3 presigned URL이 내려오면 브라우저가 해당 URL로 이동할 수 있다.
- 외부 URL을 로그에 남길 때는 host/path 수준만 남기고 query string은 제외한다.
- 음악 미리듣기는 preview URL이 있는 경우에만 재생 버튼을 활성화한다.
- 음원이 없으면 가짜 재생 UI를 보여주지 않는다.

## 11. 테스트 기준

기본 검증:

```bash
pnpm lint
pnpm build
pnpm test
git diff --check
```

| 유형 | 위치 | 기준 |
| --- | --- | --- |
| route/api | `src/app/**/route.test.ts`, `src/features/**/server/*.test.ts` | BFF, auth route, backend proxy |
| lib | `src/lib/*.test.ts` | API helper, logger, routes, movie helper |
| component | `*.test.tsx` | 사용자 상호작용, 조건부 렌더링 |

새 기능 최소 테스트:

- 정상 렌더링 1개
- API 성공 처리 1개
- API 실패 처리 1개
- 권한 만료 또는 empty state 1개
- 주요 helper가 있으면 unit test 1개

## 12. 배포와 환경 변수

- production 배포는 Vercel production deployment로 진행한다.
- Vercel env는 로컬 `.env.local`과 별개로 관리한다.
- 프론트에서 백엔드 도메인은 production 환경 변수로 관리한다.
- 운영 도메인은 `https://mylifemovie.site`, `https://www.mylifemovie.site` 기준으로 확인한다.
- 배포 후 최소 `/`, `/auth/login`, `/movies`, 주요 API proxy 응답을 확인한다.

## 13. 안티 패턴

금지 또는 지양한다.

- browser component에서 백엔드 원본 URL 직접 호출
- component마다 `fetch`와 에러 파싱을 복붙
- `console.log`로 운영 로그 남기기
- token, cookie, 사용자 입력 전문을 로그에 남기기
- 로딩/에러/빈 상태 없이 happy path만 구현
- `any`로 API 응답을 무시하고 화면에서 임의 접근
- route 문자열을 여러 파일에 하드코딩
- setInterval 정리 없이 polling 구현
- UI에 하드코딩된 가짜 영화/음악 데이터를 실제 데이터처럼 노출
- 외부 링크에 `rel="noopener noreferrer"` 없이 `target="_blank"` 사용
- Tailwind class를 과도하게 복붙해서 같은 UI 패턴을 여러 곳에 흩뿌리기
- `useEffect`에서 의존성 누락으로 stale state 만들기
- server-only secret을 `NEXT_PUBLIC_*`로 노출

## 14. Definition of Done

- 요구사항이 구현되었다.
- 모바일과 데스크톱에서 레이아웃이 깨지지 않는다.
- 필요한 로딩, 에러, 빈 상태가 처리되었다.
- API 실패와 인증 만료 흐름이 처리되었다.
- `pnpm lint`, `pnpm build`, 필요한 테스트가 통과한다.
- API 변경 또는 화면 흐름 변경 시 문서가 갱신되었다.
- PR 템플릿 체크리스트가 충족되었다.
- 이슈에 작업 결과와 검증 내역을 최신화했다.

## 15. CI Standard

프론트엔드 CI는 최소한 다음을 검증해야 한다.

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm test
git diff --check
```

테스트 실패를 `echo`나 `|| true`로 무시하지 않는다.
