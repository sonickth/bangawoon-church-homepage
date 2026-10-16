# 반가운교회 홈페이지

React, Vite와 Firebase로 만든 반가운교회 소개·사진·주보 홈페이지입니다.

## 로컬에서 실행

```sh
npm install
npm run dev
```

## Firebase 설정과 첫 자료 등록

사진 파일 자체는 Firebase Storage에 저장하고, 제목·게시판 종류·날짜·설명·이미지 URL은 Firestore `posts` 컬렉션에 저장합니다. 초기 사진 3장과 2026년 10월 11일 주보는 사이트에 포함되어 있어 Firebase 연결 전에도 화면에서 볼 수 있습니다. 관리자가 로그인한 뒤 계정 창의 **초기 사진 3장과 주보를 Firebase에 등록**을 누르면 네 파일을 Storage와 Firestore로 복사합니다.

1. Firebase Console의 Authentication에서 Email/Password 제공업체를 켭니다.
2. Firestore Database를 만들고 Storage 버킷을 준비합니다. Cloud Storage for Firebase는 현재 Blaze 요금제 연결이 필요합니다. Blaze에서는 무료 사용량을 넘으면 사용량에 따라 비용이 청구될 수 있으니 [Firebase Storage 요금 및 사용량](https://firebase.google.com/pricing)을 확인하세요.
3. 프로젝트 루트에서 규칙을 배포합니다.

   ```sh
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage
   ```

4. 홈페이지에서 관리자 이메일로 회원가입한 다음 로그인하고 UID를 복사합니다. Firebase Console의 Firestore에서 `admins` 컬렉션을 만들고 문서 ID를 복사한 UID로 지정합니다. 예를 들어 `{ "role": "admin" }` 필드를 넣을 수 있습니다. 관리자 문서는 홈페이지에서 만들 수 없으며 Firebase Console에서만 추가하도록 보안 규칙이 작성되어 있습니다.
5. 홈페이지에서 관리자 권한을 다시 확인한 뒤 초기 자료 등록 버튼을 누릅니다. 그 후부터 사진·주보 게시판에 관리자가 새 파일을 추가할 수 있습니다.

누구나 회원가입과 로그인을 할 수 있지만, 게시 권한은 `admins/{uid}` 문서가 있는 계정에만 부여됩니다. 화면의 관리자 확인과 더불어 `firestore.rules`, `storage.rules`가 서버에서 쓰기 권한을 제한합니다. 해당 규칙을 배포하기 전에는 게시 기능을 사용하지 마세요.

## 관리자 권한 구조

- `admins/{uid}` 문서는 Firebase Console에서만 생성합니다. 공개 회원가입 사용자가 자신의 권한을 관리자로 올릴 수 없습니다.
- `posts`의 공개된 게시물은 누구나 읽을 수 있고, 생성·수정·삭제는 관리자 UID만 할 수 있습니다.
- `public/gallery`와 `public/bulletins`의 파일은 공개 열람, 관리자 업로드로 설정됩니다. 게시물 이미지는 JPG, PNG, WebP, 8MB 이하만 허용합니다.
- Firebase 웹 설정의 API 키는 브라우저에 보이는 공개 설정값이며, 접근 통제는 Security Rules가 담당합니다.

