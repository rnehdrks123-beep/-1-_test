# Remix: 플레이스 진단기 (Naver SmartPlace SEO Diagnosis)

네이버 스마트플레이스 SEO 알고리즘을 기반으로 매장 노출 지수를 정밀 분석하고, 맞춤형 가산점 개선 전술을 솔루션으로 제시하는 인공지능 기반 분석 도구입니다.

---

## 🚀 주요 기능 (Key Features)

* **정밀 AI 진단**: `@google/genai` (Gemini 3.5 Flash) 모델을 연동하여 네이버 스마트플레이스 노출 가산점을 정밀 분석합니다.
* **실시간 인터랙티브 입력**: 플레이스 등록명, 타겟 지역명, 핵심 메뉴/업종, 등록 키워드를 간편하게 입력할 수 있습니다.
* **노출 등급 가이드**: 누락된 설정 도구, 유입 자산(영수증/블로그 리뷰 수) 가중치를 기반으로 점수를 측정합니다.
* **결과 이미지 다운로드**: 세련된 레이아웃의 고해상도 진단 리포트를 투명 SVG 링 레이아웃으로 왜곡 없이 PNG 파일로 즉시 다운로드할 수 있습니다.

---

## 🛠️ 준비 사항 (Prerequisites)

로컬 서버를 동작시키기 위해 아래의 도구가 필요합니다.

* **Node.js** (v18 또는 상위 버전 권장)
* **npm** (Node Package Manager)

---

## 📦 설치 및 시작 방법 (Installation & Getting Started)

### 1. 레포지토리 복제 및 의존성 설치
프로젝트 루트 폴더로 이동하여 패키지 설치를 완료합니다.

```bash
# 의존성 패키지 설치
npm install
```

### 2. 환경 변수 구성
`.env.example` 파일을 복사하여 루트 폴더에 `.env` 파일을 생성하고 획득한 Gemini API 키를 기재합니다.

```bash
# .env 파일 예시
GEMINI_API_KEY="본인의_실제_구글_제미나이_API_키"
PORT=3000
```

> 💡 **주의**: 브라우저 보안에 의해 API Key의 노출을 막기 위해 호출 처리는 서버 측(`server.ts`) 프록시 엔드포인트를 거쳐 안전하게 실행됩니다.

### 3. 개발 서버 구동 (Development)
로컬 TypeScript 서버 및 Vite 번들러 환경이 동시에 가동됩니다.

```bash
npm run dev
```
가동 완료 후 브라우저에서 `http://localhost:3000`으로 접속하실 수 있습니다.

### 4. 프로덕션 빌드 및 실행 (Build & Production Release)
최종 리소스를 압축 번들링하고 빌드된 단일 엔트리로 서비스를 실행합니다.

```bash
# 빌드 실행 (Vite 전처리 및 esbuild 단일 컴파일)
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 📁 주요 폴더 구조 (Project Architecture)

* `/server.ts`: Express 및 `@google/genai` 연동 로컬 Proxy API 서버 엔트리
* `/src/App.tsx`: 플레이스 진단 입력 란, 점수 위겟 및 이미지 보존 다운로드 컴포넌트가 담긴 메인 뷰
* `/src/index.css`: 프리텐다드 서체 연동 전용 디자인 테마 구조 및 v4 tailwindcss 규칙 지표
* `/src/types.ts`: 진단 정보 및 데이터 전송을 위한 TypeScript 공용 타입 파일
* `/vite.config.ts`: 번들러 및 라이브 워칭 중지(AI Studio 개발 제어 전용) 커스텀 설정

---

## 📄 라이선스 (License)

This project is private and developed for personal store diagnosis & promotion optimization.
