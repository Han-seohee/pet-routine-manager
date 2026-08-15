# Day 06 — Google OAuth 인증 연결하기

**Date:** 2026-08-15

## Context

Day 05에서는 AuthModule, AuthService, AuthController를 만들고 OAuth 로그인에 필요한 기본 구조를 구축했다.

당시에는 실제 Google이나 Kakao OAuth를 연결하지 않고, OAuth Provider가 사용자 정보를 전달해준다고 가정하여 `POST /auth/oauth/login` 스텀 엔드포인트를 만들어 User를 조회하거나 생성하는 흐름까지만 구현했다.

Day 06에서는 이 구조에 실제 Google OAuth를 연결해보기로 했다.

처음에는 OAuth가 단순히 "Google 로그인 버튼을 누르면 Google에서 로그인하고 돌아오는 것" 정도라고 생각했는데, 실제로 구현하려고 보니 Google, Passport, Strategy, Guard, Callback 등 여러 단계가 연결되어 있었다.

이번 Day 06에서는 그중 Google OAuth 인증 흐름을 Backend에서 연결하는 것에 집중했다.

JWT와 Kakao OAuth는 이번 단계에서는 구현하지 않기로 했다.

---

## 오늘 한 일

### 1. Google Cloud Console에서 OAuth Client 생성

Google OAuth를 사용하기 위해 Google Cloud Console에서 프로젝트를 생성하고 OAuth 동의 화면과 OAuth Client를 구성했다.

Google OAuth Client를 생성하면서 Client ID와 Client Secret을 발급받았다.

Backend `.env`에는 다음 환경변수를 추가했다.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Client Secret은 외부에 노출되면 안 되기 때문에 `.env`에서 관리하고 Git에는 포함하지 않도록 했다.

Google 인증이 끝난 후 Backend로 돌아올 callback URL도 설정했다.

`http://localhost:3001/auth/google/callback`

---

### 2. Passport 설치

NestJS에서 Google OAuth 인증을 구현하기 위해 Passport를 사용했다.

설치한 패키지는 다음과 같다.

- `@nestjs/passport`
- `passport`
- `passport-google-oauth20`
- `@types/passport-google-oauth20`

Passport는 다양한 인증 방식을 Strategy 형태로 사용할 수 있도록 도와주는 인증 미들웨어다.

이번에는 Google OAuth를 사용하기 때문에 Google 전용 Strategy를 사용했다.

---

### 3. GoogleStrategy 구현

`src/auth/google.strategy.ts`를 생성했다.

GoogleStrategy에서는 Google OAuth에 필요한 Client ID, Client Secret, Callback URL과 요청할 사용자 정보 범위를 설정했다.

Google 로그인에 성공하면 Google에서 사용자 Profile 정보를 전달해주고, Passport는 이 정보를 `validate()` 메서드에 전달한다.

`validate()`에서는 Google Profile을 우리 프로젝트에서 사용하는 `OAuthLoginDto` 형태로 변환했다.

Google에서 받은 정보 중 필요한 값은 다음과 같다.

- Google 사용자 ID → `providerId`
- 이메일 → `email`
- 이름 → `displayName`
- 프로필 이미지 → `profileImage`

그리고 Google이라는 Provider를 명시하기 위해 `provider: 'GOOGLE'`을 지정했다.

---

### 4. Day 05의 AuthService와 연결

GoogleStrategy에서 User를 직접 생성하거나 DB를 조회하지 않고 Day 05에서 만들었던 `AuthService.findOrCreateUser()`를 그대로 사용했다.

Google OAuth에서 받은 사용자 정보가 다음 흐름으로 전달된다.

Google Profile
→ OAuthLoginDto
→ AuthService.findOrCreateUser()
→ PrismaService
→ PostgreSQL

이를 통해 OAuth 인증을 담당하는 코드와 실제 User 데이터를 관리하는 코드를 분리할 수 있었다.

특히 Day 05에서 `provider + providerId`를 기준으로 User를 찾도록 만들어두었기 때문에 Google OAuth를 연결하면서 User 조회/생성 로직을 새로 만들 필요가 없었다.

---

### 5. GoogleAuthGuard 구현

`src/auth/guards/google-auth.guard.ts`를 생성했다.

Passport의 `AuthGuard('google')`를 기반으로 Google OAuth 인증을 처리하도록 구성했다.

Guard는 Controller에 요청이 도착했을 때 인증이 필요한지 확인하고 Passport의 Google Strategy를 실행하는 역할을 한다.

처음에는 Strategy와 Guard가 비슷하게 느껴졌지만, 구현하면서 역할을 구분할 수 있었다.

- Guard → 인증 과정을 시작하고 연결
- Strategy → 실제 Google 인증 방식과 사용자 정보 처리

---

### 6. Google OAuth Endpoint 추가

AuthController에 두 개의 endpoint를 추가했다.

`GET /auth/google`

Google 로그인을 시작하는 endpoint다.

사용자가 이 주소로 접근하면 GoogleAuthGuard가 동작하고 Google 로그인 페이지로 redirect된다.

`GET /auth/google/callback`

Google 로그인과 동의가 완료되면 Google이 이 주소로 사용자를 돌려보낸다.

Callback에서는 GoogleStrategy가 전달받은 Profile을 처리하고, 기존 User가 있는지 확인하거나 새로운 User를 생성한다.

현재는 JWT를 아직 구현하지 않았기 때문에 인증이 완료된 User 정보를 JSON으로 반환하도록 구성했다.

---

## Google OAuth 흐름 이해하기

오늘 구현한 전체 흐름을 정리하면 다음과 같다.

Client
→ `GET /auth/google`
→ GoogleAuthGuard
→ Google 로그인 페이지
→ Google 로그인 및 동의
→ `/auth/google/callback`
→ GoogleStrategy.validate()
→ Google Profile
→ OAuthLoginDto
→ AuthService.findOrCreateUser()
→ PrismaService
→ PostgreSQL
→ User 반환

결국 Google은 "이 사람이 Google에서 인증된 사용자라는 것"과 사용자 정보를 전달해주고,

우리 Backend는 그 정보를 이용해서 우리 서비스의 User를 찾거나 생성하는 역할을 한다.

---

## 테스트

구현 후 기존 코드가 깨지지 않았는지 확인하기 위해 Build와 테스트를 실행했다.

- `pnpm run build` → 성공
- Unit Test → 4 suites / 8 tests 통과
- E2E Test → 1 suite / 4 tests 통과

특히 E2E 테스트에서는 `/auth/google` 요청을 실제 HTTP 요청으로 확인하고 Google OAuth 페이지로 정상적인 `302 redirect`가 발생하는지 테스트했다.

Unit Test에서는 GoogleStrategy의 Profile 매핑과 AuthController의 callback 처리를 확인했다.

---

## 오늘 알게 된 것

오늘 가장 크게 이해한 것은 OAuth가 단순히 "Google 로그인" 하나의 기능이 아니라 여러 단계가 연결된 인증 흐름이라는 것이다.

처음에는 Passport, Strategy, Guard가 모두 비슷해 보였지만 실제 구조를 만들어보면서 각각 담당하는 역할이 다르다는 것을 알게 됐다.

특히 중요한 흐름은 다음과 같다.

Guard
→ 인증 과정 시작

Strategy
→ Google OAuth 인증 처리 및 Profile 전달

AuthService
→ 우리 서비스의 User 조회/생성

PrismaService
→ Database 접근

PostgreSQL
→ 실제 User 데이터 저장

그리고 Day 05에서 만들어둔 `findOrCreateUser()`가 Day 06에서 실제 Google OAuth와 연결되면서 이전에 만든 코드가 왜 필요한지 조금 더 명확하게 이해할 수 있었다.

---

## JWT를 아직 구현하지 않은 이유

Google OAuth 인증 자체는 구현했지만 아직 JWT는 발급하지 않는다.

현재는 다음 단계까지 구현된 상태다.

Google 로그인
→ Google 인증
→ Callback
→ User 조회/생성
→ User 반환

실제 서비스에서는 여기에서 JWT Access Token 등을 발급하고 Frontend가 로그인 상태를 유지할 수 있도록 만들어야 한다.

하지만 JWT까지 한 번에 구현하면 인증 구조가 너무 커지기 때문에 이번 Day 06에서는 Google OAuth 흐름을 이해하고 연결하는 것에 집중했다.

JWT는 이후 별도의 단계에서 구현하기로 했다.

Kakao OAuth 역시 Google OAuth 구조를 먼저 이해한 뒤 같은 방식으로 추가할 예정이다.

---

## Next

다음 단계에서는 Google OAuth 인증이 완료된 후 실제 로그인 상태를 유지할 수 있도록 JWT 인증을 추가할 예정이다.

예상 흐름은 다음과 같다.

Google OAuth
→ GoogleStrategy
→ User 조회/생성
→ JWT 발급
→ Frontend 전달
→ 인증이 필요한 API 요청
→ JWT 검증
→ User 식별

오늘은 Google OAuth 인증 흐름을 Backend에 연결하고 테스트까지 완료했다.

Day 05에서 만든 Auth 구조가 실제 OAuth Provider와 연결되면서 인증 시스템의 전체적인 형태가 조금씩 보이기 시작했다.