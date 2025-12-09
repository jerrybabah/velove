<div align="center">

# velove ❤️

**velog 사용자를 위한 브라우저 확장 프로그램**

내 글의 통계(조회수, 좋아요, 댓글)를 한눈에 보고, 코드 블록을 쉽게 복사하세요.

[![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](#)
[![Firefox](https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox&logoColor=white)](#)
[![WXT](https://img.shields.io/badge/Built%20with-WXT-646CFF?logo=vite&logoColor=white)](https://wxt.dev)

</div>

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📊 **사이드패널 통계** | 내 게시글의 조회수, 좋아요, 댓글 수를 한 곳에서 확인 |
| 🔄 **다양한 정렬** | 최신순, 조회수순, 좋아요순, 댓글순 등으로 정렬 |
| 📋 **코드 복사 버튼** | 게시글 내 모든 코드 블록에 복사 버튼 자동 추가 |
| 🌙 **테마 연동** | velog의 라이트/다크 테마 자동 감지 및 적용 |
| ⚡ **실시간 동기화** | 글 작성/수정/삭제 시 새로고침 없이 자동 반영 |

---

## 🚀 시작하기

### 요구 사항

- Node.js 18+
- Yarn

### 설치 및 실행

```bash
# 의존성 설치
yarn install

# Chrome 개발 모드
yarn dev

# Firefox 개발 모드
yarn dev:firefox
```

개발 모드로 실행하면 브라우저가 자동으로 열리고, 코드 변경 시 핫 리로드가 적용됩니다.

### 빌드

```bash
# 프로덕션 빌드
yarn build          # Chrome
yarn build:firefox  # Firefox

# 배포용 압축 파일 생성
yarn zip            # Chrome
yarn zip:firefox    # Firefox
```

빌드 결과물은 `.output` 디렉터리에 생성됩니다.

---

## 🏗️ 프로젝트 구조

```
entrypoints/
├── app.content/          # 콘텐츠 스크립트 (velog 페이지에 주입)
│   ├── index.tsx         # 메인 진입점, 이벤트 리스너 설정
│   ├── api.ts            # velog GraphQL API 호출
│   ├── Toggle.tsx        # 사이드패널 토글 버튼
│   └── Copy.tsx          # 코드 복사 버튼
│
├── tabSidepanel/         # 사이드패널 UI
│   ├── Sidepanel.tsx     # 메인 사이드패널 컴포넌트
│   ├── components/       # PostCard, StatsSection 등
│   └── hooks/            # 상태 관리 훅
│
├── background/           # 서비스 워커
│   ├── index.ts          # 메시지 라우팅, 사이드패널 연결 관리
│   ├── message/          # 메시지 핸들러
│   └── api/              # 외부 API (Mixpanel, LemonSqueezy)
│
├── optionalPopup/        # velog 외 도메인용 안내 팝업
│
└── interceptor-injected.ts  # GraphQL 요청 감시 (글 작성/수정/삭제 감지)

utils/
├── storage.ts            # 로컬 스토리지 타입 정의
├── message.ts            # 메시지 유틸리티
├── theme.ts              # 테마 관련 유틸리티
└── util.ts               # 공통 유틸리티
```

---

## ⚙️ 동작 원리

### 데이터 흐름

```
velog.io 페이지
     │
     ▼
┌─────────────────────────────────────────┐
│  Content Script (app.content)           │
│  - 사용자 정보 및 게시글 목록 fetch      │
│  - v3 GraphQL: 게시글 기본 정보          │
│  - v2 GraphQL: 조회수 통계               │
│  - 로컬 스토리지에 캐싱 (30분 TTL)       │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Interceptor (injected script)          │
│  - fetch/XHR 요청 감시                   │
│  - 글 작성/수정/삭제 감지                │
│  - postMessage로 콘텐츠 스크립트에 알림  │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Background Service Worker              │
│  - 사이드패널 연결 상태 관리             │
│  - 메시지 라우팅                         │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Side Panel                             │
│  - 저장된 데이터로 UI 렌더링             │
│  - 정렬, 필터링, 게시글 이동             │
└─────────────────────────────────────────┘
```

### 주요 기술

- **[WXT](https://wxt.dev)**: 브라우저 확장 프로그램 개발 프레임워크
- **React 19**: UI 컴포넌트
- **Ant Design 6**: UI 라이브러리
- **TypeScript**: 타입 안정성

---

## 🤝 기여하기

버그 리포트, 기능 제안, PR 모두 환영합니다!

1. 이 저장소를 Fork 합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

---

## 📝 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `WXT_MIXPANEL_PROJECT_TOKEN` | Mixpanel 프로젝트 토큰 (사용 분석용) | 선택 |

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
