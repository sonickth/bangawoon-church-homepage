# 반가운교회 홈페이지 초안

반가운교회 CI를 바탕으로 구성한 React + TypeScript + Vite 홈페이지 초안입니다.

## 시작하기

```sh
npm install
npm run dev
```

## 현재 초안 범위

- 반응형 홈페이지와 메뉴별 화면
- CI의 남색, 영성목회 블루, 공동체 베이지, 다음세대 세이지 색상 적용
- 주보 메뉴와 주차별 자료 목록을 놓을 화면 영역
- 교회소개, 예배안내, 오시는 길, 새가족안내, 설교·공지 등 기본 화면 골격
- 외부 인스타그램·유튜브·네이버 지도 연결
- 참고사진을 사용한 주보·설교 나눔지·소식지·교회 발자취·공동체 나눔 화면

게시판 데이터는 Firebase Firestore의 `posts` 컬렉션에서 실시간으로 읽습니다. 주보, 설교, 공지사항, 일정, 사진앨범, 공동체 이야기, 다음세대 이야기, 기도 나눔 메뉴가 게시판으로 연결되어 있습니다. 방문자는 게시물을 읽고, 관리자는 Firebase Authentication 로그인 후 게시물을 등록·삭제할 수 있습니다. 게시물 수정은 현재 제공하지 않습니다.

## Firebase 설정

Firebase 웹 앱 설정은 `src/firebase.ts`에 적용되어 있습니다. Firebase Console에서 Authentication의 이메일/비밀번호 로그인 제공자를 켜고 Firestore 데이터베이스와 Storage 버킷을 준비해야 합니다. 사이트 방문자는 이메일/비밀번호로 회원가입하고 로그인할 수 있습니다.

### 관리자 계정 추가

여러 관리자 계정을 지정할 수 있습니다. 관리자 계정으로 만들 사용자가 먼저 홈페이지에 회원가입해야 하며, 다음 정보를 Firebase Console의 Firestore에 직접 등록합니다.

1. **Authentication → 사용자**에서 해당 사용자를 열고 UID를 복사합니다.
2. **Firestore Database → 데이터**에서 `admins` 컬렉션을 만듭니다.
3. 문서 ID를 복사한 UID로 설정하고 필드 `role`을 문자열 `admin`으로 추가합니다.
4. 해당 사용자가 다시 로그인하거나 페이지를 새로고침하면 관리자 표시와 관리자 권한이 적용됩니다. 이미 로그인 중이면 권한 문서 변경을 실시간으로 감지합니다.

예: `admins/{Firebase Authentication UID}` 문서의 데이터는 `{ role: "admin" }`입니다. 홈페이지는 본인 UID에 해당하는 문서만 읽으며, 관리자 문서의 추가·변경·삭제는 Firebase Console에서만 할 수 있도록 규칙을 설정합니다. 기존 `sonickthgmal@gmail.com` 계정은 초기 관리자용으로 계속 허용됩니다.

Firestore 보안 규칙과 게시판 복합 색인은 `firestore.rules`, `firestore.indexes.json`에, 파일 업로드 규칙은 `storage.rules`에 정의되어 있습니다. 모든 방문자는 게시물을 읽을 수 있습니다. `admins/{uid}` 문서의 `role`이 `admin`인 관리자는 모든 게시판에서 등록·삭제할 수 있고, 일반 회원은 사진앨범(`gallery`)과 기도 나눔(`prayer`)에서 게시물을 등록하고 본인이 등록한 글만 삭제할 수 있습니다. Firebase CLI가 설치되고 프로젝트에 로그인된 환경에서 규칙을 배포합니다.

```sh
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project bangawoon-church-homepage
```

규칙 배포와 로그인 제공자 활성화 전에는 Firestore/Storage 작업이 거절될 수 있습니다. 새 관리자 문서를 인식시키려면 변경된 Firestore와 Storage 규칙도 배포해야 합니다. 게시물 문서는 `posts` 컬렉션에 `category`, `title`, `body`, `date`, 첨부 파일 정보, `authorEmail`, `authorUid`, `createdAt` 필드를 사용합니다. JPG, PNG, WEBP, GIF 사진과 PDF를 최대 15MB까지 첨부할 수 있습니다. 등록·삭제 후에는 Firestore에서 다시 조회해 목록 상태를 확인합니다.

## 예정 콘텐츠 데이터 구분

- 게시물: 설교, 공지사항, 공동체 이야기, 다음세대 이야기
- 주보: 예배 날짜, 제목, 첨부 파일 URL, 작성·수정 시각
- 일정: 제목, 날짜와 시간, 장소, 설명
- 앨범: 앨범명, 촬영일, 사진 URL과 설명
- 사이트 정보: 예배 시간, 주소, SNS URL, 소개 문구

카테고리 값: `sermons`, `bulletin`, `notices`, `calendar`, `gallery`, `community`, `nextgen`, `prayer`.

말씀과 예배 메뉴의 `주일예배`와 `수요예배` 화면은 각각 반가운교회 YouTube의 해당 재생목록을 YouTube Data API로 읽어옵니다. 날짜는 라이브 방송 영상이면 실제 방송 시작 시각(`liveStreamingDetails.actualStartTime`), 그 외 영상은 게시 시각(`snippet.publishedAt`)을 기준으로 한국 시간으로 표시합니다. 썸네일도 함께 표시하며, 새 영상은 화면 진입 시와 화면을 열어둔 동안 5분 간격으로 다시 확인합니다. 두 화면 모두 10개씩 페이징합니다. 주일예배 API 오류 시에는 확인된 34개 예시 목록을 표시하고, 수요예배는 오류 메시지를 표시합니다. Firestore 게시판도 전체 게시물 수신을 유지하면서 10개씩 페이징합니다.

자동 갱신을 사용하려면 Google Cloud Console에서 **YouTube Data API v3**를 활성화하고 API 키를 발급한 뒤, 웹사이트의 HTTP 리퍼러로 키를 제한하고 API 제한에서 YouTube Data API v3만 허용합니다. `.env.example`을 복사해 `.env.local` 파일을 만들고 `VITE_YOUTUBE_API_KEY`에 키를 입력하세요. `.env.local`은 Git에 커밋되지 않으므로 키를 저장소에 올리지 마세요. 운영 사이트를 빌드하는 서비스에도 같은 이름의 환경 변수를 별도로 등록한 뒤 다시 빌드·배포해야 합니다. 현재 저장소에는 운영 사이트 배포용 GitHub Actions 또는 Firebase Hosting 설정이 포함되어 있지 않습니다. 키 제한이 맞지 않거나 API가 활성화되지 않으면 기존 목록을 표시합니다.

```sh
cp .env.example .env.local
```

현재 브라우저에서 직접 API를 호출하므로 키는 사용자에게 완전히 비밀로 유지되는 서버 키가 아닙니다. 웹사이트 리퍼러와 YouTube Data API v3로 키 사용처를 제한하세요. 영상 목록은 YouTube Data API의 `playlistItems.list` 페이지네이션과 `videos.list`의 `snippet.publishedAt` 업로드 시각을 사용합니다. [재생목록 항목 API](https://developers.google.com/youtube/v3/docs/playlistItems/list) · [영상 API](https://developers.google.com/youtube/v3/docs/videos/list)

## CI 이미지

- `public/brand-lockup.png`: 홈페이지에서 쓰는 가로형 로고
- `public/brand-original.png`: 제공받은 CI 원본
- `public/images/`: 참고사진에서 복사하고 웹용으로 최적화한 화면 이미지

## 실제 운영 전에 받을 자료

- 담임목사 프로필 사진과 인사말 원고
- 어린이·학생 사역 소개, 예배 시간, 활동 사진
- 주차 및 건물 진입 안내, 엘리베이터 위치
- 설교 영상 URL, 설교 제목·본문·설교자 정보
- 공지, 일정, FAQ의 실제 운영 내용
- 사진 속 교인과 어린이의 홈페이지 게시 동의 여부
