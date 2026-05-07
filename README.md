<div align="center">

# 🎬 My Life Movie - Frontend

**내 디지털 흔적을 AI가 분석해서, 나만의 인생 영화를 만들어주는 서비스**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap) • [Team](#-team)

</div>

---

## 💡 Vision

> **" 이력서, Spotify, 카카오톡 등 나의 데이터를 AI가 분석하여
> 장르·줄거리·포스터·OST가 담긴 세상에 단 하나뿐인 내 인생을 표현하는 영화를 만들어 드립니다. "**

| | |
|---|---|
| **Product** | My Life Movie (AI 기반 개인 맞춤형 콘텐츠 생성 서비스) |
| **Target Users** | 자신의 이야기를 특별한 콘텐츠로 표현하고 공유하고 싶은 MZ세대, 나의 인생을 내가 아닌 색다르고 다양한 시점으로 바라보고 싶은 사람. |
| **Problem** | 흩어져 있는 자신의 디지털 데이터(이력서, 음악, 대화 등)를 의미 있는 하나의 서사로 모아보고 싶은 흥미. |
| **Key Benefit** | 자신의 인생을 제3자의 시점(영화 장르 및 줄거리)에서 바라보는, 색다른 경험과 시각적 콘텐츠를 제공. |
| **Differentiation** | 단순히 텍스트를 요약하는 것을 넘어, OCR, 감성 분석(KoBERT), 장르 분류(KoELECTRA)를 결합하여, 포스터와 OST까지 포함된 종합적인 영화적 콘텐츠를 자동 생성. |

---

## ✨ Features

### 📊 다중 데이터 소스 분석
이력서 PDF(OCR), Spotify(취향), 카카오톡 내보내기 파일(인간관계) 파싱 및 분석.

### 🧠 AI 를 활용한 감성 & 장르 분류
KoBERT 및 KoELECTRA 모델을 활용하여 삶의 감성을 파악하고, 결과로 내보낼 영화의 장르를 결정.

### 🎨 시각적 & 청각적 이미지 생성
GPT(줄거리) · DALL-E(포스터) · Spotify API(OST) 를 연동하여 하나의 콘텐츠 패키지 완성.

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js, TypeScript, Tailwind CSS |
| **Backend** | Python FastAPI ([별도 레포](https://github.com/karl21-02/my-life-movie-backend)) |
| **ML** | KoBERT, KoELECTRA |
| **API** | GPT, DALL-E, Spotify |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/karl21-02/my-life-movie-frontend.git

# Navigate to project directory
cd my-life-movie-frontend

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Compose로 실행

```bash
# 환경 변수 예시 파일 복사
cp .env.example .env

# 프론트엔드 개발 서버 실행
docker compose up --build
```

기본 주소는 `http://localhost:3000`입니다. 브라우저 API 기본 주소는 `NEXT_PUBLIC_API_BASE_URL`로 관리하며, 기본값은 `http://localhost:8000`입니다. 컨테이너 내부 서버 라우트에서 백엔드로 호출할 때는 `SERVER_API_BASE_URL`을 사용합니다.

로컬 `3000` 포트가 이미 사용 중이면 `.env`에서 `FRONTEND_PORT=3001`처럼 변경해 실행합니다.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend Proxy Health Check | http://localhost:3000/api/backend-health |

### 인증 화면 뼈대

현재 인증 화면은 백엔드 인증 API 계약을 붙일 수 있는 최소 구조만 제공합니다. 토큰 저장, 세션 유지, 실제 로그인 완료 처리는 후속 구현에서 연결합니다.

| Page | URL |
|------|-----|
| 회원가입 | http://localhost:3000/auth/signup |
| 로그인 | http://localhost:3000/auth/login |

## 📚 Docs

- [개발 컨벤션](docs/CONVENTIONS.md): Git 브랜치 전략, 커밋 컨벤션, PR 규칙, 로그 기준

---

## 👥 Team

| 역할 | 이름 |
|------|------|
| 팀원1 | 김준희 |
| 팀원2 | 양웅진 |
| 팀원3 | 정윤찬 |

---

<div align="center">

**2026 Spring Software Engineering | Team 6**

[🔗 GitHub Repository](https://github.com/karl21-02/my-life-movie-frontend)

</div>
