# velove

velog를 더 편하게 쓰도록 돕는 브라우저 익스텐션입니다. 통계·카테고리 관리용 사이드패널과 코드 블록 복사 버튼을 제공하며, velog 도메인에서만 동작합니다.

## 주요 기능
- 사이드패널: 내 게시글 목록/통계(조회수·좋아요·댓글) 표시, 최신/조회수/좋아요/댓글/오래된순 정렬, 클릭 시 해당 글로 이동
- 토글 버튼: 알림 아이콘 옆에 `velove❤️` 버튼을 삽입하여 사이드패널 열기/닫기
- 코드 복사: 게시글의 `pre` 코드 블록마다 복사 버튼 자동 부착 (툴팁 없이 즉시 복사)
- 자동 동기화: 글 작성/수정/삭제 GraphQL 요청을 가로채어 로컬 캐시를 갱신
- 테마 연동: velog `data-theme`(light/dark) 변경 시 UI 테마 동기화
- 도메인 보호 팝업: velog 외 도메인에서 아이콘을 누르면 안내 팝업과 velog 이동 버튼 노출

## 폴더 맵
- `entrypoints/app.content`: 콘텐츠 스크립트. 토글/복사 UI 렌더링, 게시글·통계 fetch 및 캐싱(30분 TTL).
- `entrypoints/interceptor-injected.ts`: velog GraphQL 요청 감시(작성/수정/삭제) 후 `postMessage`로 콘텐츠 스크립트에 전달.
- `entrypoints/tabSidepanel`: 사이드패널 UI. 저장된 게시글/통계 조회 및 정렬, 클릭 시 활성 탭을 velog 글로 이동.
- `entrypoints/background`: 메시지 라우터, 사이드패널 연결 관리, 브라우저 액션 동작 정의, Mixpanel/License API 래퍼.
- `entrypoints/optionalPopup`: velog 외 도메인 클릭 시 노출되는 안내 팝업.
- `utils`: 메시지/스토리지/테마 헬퍼, `chunkRun` 유틸 등.

## 빠른 시작
1. Node 18+와 Yarn을 준비합니다.
2. 의존성 설치: `yarn install`
3. 크로미움 개발 모드: `yarn dev` (프로필은 `.wxt/chrome-data` 사용)
4. 파이어폭스 개발 모드: `yarn dev:firefox`

## 빌드 & 패키징
- 프로덕션 빌드: `yarn build` (브라우저별 결과물은 WXT 기본 출력 디렉터리 `.output` 하위에 생성)
- 압축 패키지: `yarn zip` / `yarn zip:firefox`

## 환경 변수
- `WXT_MIXPANEL_PROJECT_TOKEN`: Mixpanel 프로젝트 토큰. 없으면 분석 이벤트 전송이 실패합니다.

## 동작 개요
- 콘텐츠 스크립트는 로그인된 사용자의 게시글을 v3 GraphQL로 페칭 후, 조회수 통계를 v2 GraphQL로 합산해 로컬 스토리지에 캐싱합니다.
- 새로고침 없이도 글 작성/수정/삭제 이벤트를 가로채 캐시를 최신 상태로 유지합니다.
- 사이드패널은 백그라운드와 포트 연결을 유지하며, 열려 있는 상태에서 다시 토글하면 패널을 닫습니다.

## 개인정보 및 라이선스
- Mixpanel을 통한 사용 이벤트 전송 로직이 포함되어 있습니다(토큰 설정 시 활성화).
- LemonSqueezy 라이선스 검증/활성화 API 호출 래퍼가 포함되어 있으니 실제 배포 시 키 보관과 호출 정책을 확인하세요.
