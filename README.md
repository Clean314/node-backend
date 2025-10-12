# Node Backend Project

## 프로젝트 개요
이 프로젝트는 Node.js와 Express를 기반으로 한 백엔드 서버입니다. 장소(places)와 사용자(users) 관련 API를 제공합니다.

## 폴더 구조
```
├── app.js                # 메인 서버 파일
├── package.json          # 프로젝트 설정 및 의존성
├── controllers/          # 요청 처리 로직
│   ├── places-controller.js
│   └── users-controller.js
├── models/               # 데이터 모델 및 에러 처리
│   ├── http-error.js
│   ├── place.js
├── routes/               # API 라우팅
│   ├── places-routes.js
│   └── users-routes.js
├── util/                 # 유틸리티 함수
│   └── location.js
```

## 주요 기능
- 장소(Place) CRUD API
- 사용자(User) 관련 API
- 커스텀 에러 처리
- 위치 정보 유틸리티

## 실행 방법
1. 의존성 설치:
   ```bash
   npm install
   ```
2. 서버 실행:
   ```bash
   npm start
   ```

## 사용 기술
- Node.js
- Express

## 문의
프로젝트 관련 문의는 이슈로 남겨주세요.