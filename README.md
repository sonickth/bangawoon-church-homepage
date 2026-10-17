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

게시판 데이터는 Firebase Firestore의 `posts` 컬렉션에서 실시간으로 읽습니다. 주보, 설교, 공지사항, 일정, 사진앨범, 공동체 이야기, 다음세대 이야기, 기도 나눔 메뉴가 게시판으로 연결되어 있습니다. 방문자는 게시물을 읽고, 관리자 `sonickthgmal@gmail.com`은 Firebase Authentication 로그인 후 게시물을 등록·삭제할 수 있습니다. 게시물 수정은 현재 제공하지 않습니다.

## Firebase 설정

Firebase 웹 앱 설정은 `src/firebase.ts`에 적용되어 있습니다. Firebase Console에서 Authentication의 이메일/비밀번호 로그인 제공자를 켜고 Firestore 데이터베이스와 Storage 버킷을 준비해야 합니다. 사이트 방문자는 이메일/비밀번호로 회원가입하고 로그인할 수 있습니다. 지정된 관리자 계정은 `sonickthgmal@gmail.com`입니다.

Firestore 보안 규칙과 게시판 복합 색인은 `firestore.rules`, `firestore.indexes.json`에, 파일 업로드 규칙은 `storage.rules`에 정의되어 있습니다. 모든 방문자는 게시물을 읽을 수 있습니다. 관리자는 모든 게시판에서 등록·삭제할 수 있고, 일반 회원은 사진앨범(`gallery`)과 기도 나눔(`prayer`)에서 게시물을 등록하고 본인이 등록한 글만 삭제할 수 있습니다. Firebase CLI가 설치되고 프로젝트에 로그인된 환경에서 규칙을 배포합니다.

```sh
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project bangawoon-church-homepage
```

규칙 배포와 로그인 제공자 활성화 전에는 Firestore/Storage 작업이 거절될 수 있습니다. 게시물 문서는 `posts` 컬렉션에 `category`, `title`, `body`, `date`, 첨부 파일 정보, `authorEmail`, `authorUid`, `createdAt` 필드를 사용합니다. JPG, PNG, WEBP, GIF 사진과 PDF를 최대 15MB까지 첨부할 수 있습니다. 등록·삭제 후에는 Firestore에서 다시 조회해 목록 상태를 확인합니다.

## 예정 콘텐츠 데이터 구분

- 게시물: 설교, 공지사항, 공동체 이야기, 다음세대 이야기
- 주보: 예배 날짜, 제목, 첨부 파일 URL, 작성·수정 시각
- 일정: 제목, 날짜와 시간, 장소, 설명
- 앨범: 앨범명, 촬영일, 사진 URL과 설명
- 사이트 정보: 예배 시간, 주소, SNS URL, 소개 문구

카테고리 값: `sermons`, `bulletin`, `notices`, `calendar`, `gallery`, `community`, `nextgen`, `prayer`.

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
