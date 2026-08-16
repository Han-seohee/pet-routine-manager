# Day07 — JWT 인증 기반 구축

> 📅 2026-08-16

## Context

Day06에서는 Google OAuth를 연결하여 Google 로그인부터 User 조회/생성까지의 인증 기반을 구축했다.

하지만 Google 인증이 완료되었다고 해서 우리 서비스의 모든 API 요청에서 사용자를 계속 식별할 수 있는 것은 아니었다.

로그인 이후에도 사용자가 API를 요청할 때마다 "이 요청을 보낸 사용자가 누구인지" 확인할 수 있는 인증 수단이 필요했다.

그래서 Day07에서는 Google OAuth 인증이 완료된 User에게 JWT Access Token을 발급하고, 이후 API 요청에서 JWT를 검증할 수 있는 인증 구조를 구축했다.

---

## Decision

### JWT 기반 인증 구조 구축

Google OAuth 인증이 성공하면 User의 ID를 기준으로 JWT Access Token을 발급하도록 했다.

JWT payload에는 User의 UUID를 `sub`에 넣었다.

```ts
{
  sub: user.id
}
```

이후 Client가 API를 요청할 때 다음과 같이 JWT를 전달하면 Passport의 JWT Strategy가 Token을 검증하도록 구성했다.

```text
Authorization: Bearer <accessToken>
```

인증이 필요한 API에는 `JwtAuthGuard`를 적용할 수 있도록 했다.

### JWT에 User 정보를 최소한으로 포함

JWT에는 email, displayName, provider 등의 정보를 넣지 않고 User ID만 넣었다.

사용자를 식별하는 데 필요한 정보만 Token에 포함하고, 상세 User 정보가 필요할 경우 DB에서 조회하는 방향으로 결정했다.

### Refresh Token은 제외

이번 Day에서는 Access Token 발급과 검증에 집중하고 Refresh Token은 구현하지 않았다.

### Frontend 연동은 제외

현재 Google OAuth callback에서는 `{ user, accessToken }`을 반환하도록 구성했다.

Frontend redirect와 Token 저장 방식은 이후 Frontend 인증 연동 단계에서 구현하기로 했다.

---

## Outcome

### JWT 관련 환경변수 추가

Backend `.env`에 `JWT_SECRET`을 추가하고 `.env.example`에는 placeholder를 추가했다.

실제 Secret은 Git에 포함하지 않도록 관리했다.

### JWT 발급 로직 추가

`AuthService`에 `signAccessToken()`을 추가했다.

Google OAuth 인증이 완료되고 User가 조회/생성되면 User ID를 기반으로 Access Token을 발급한다.

Access Token의 만료 시간은 현재 1일로 설정했다.

### JwtStrategy 추가

`src/auth/jwt.strategy.ts`를 생성했다.

Client가 전달한 JWT를 검증하고 payload의 `sub` 값을 User ID로 변환하도록 구성했다.

### JwtAuthGuard 추가

`src/auth/guards/jwt-auth.guard.ts`를 생성했다.

`AuthGuard('jwt')`를 기반으로 인증이 필요한 API에서 재사용할 수 있도록 구성했다.

### `/auth/me` 추가

JWT 인증이 실제로 동작하는지 확인하기 위해 `GET /auth/me` endpoint를 추가했다.

JWT가 없는 요청과 잘못된 JWT는 `401 Unauthorized`를 반환하고, 유효한 JWT는 인증된 User 정보를 반환하도록 했다.

---

## Verification

### Build

`pnpm run build`

✅ 성공

### Unit Test

5 test suites, 11 tests

✅ 모두 통과

주요 검증 내용:

* `AuthService.signAccessToken()`
* Google OAuth callback의 JWT 발급
* `JwtStrategy.validate()`
* `/auth/me` Controller
* 기존 GoogleStrategy 테스트

### E2E Test

1 test suite, 7 tests

✅ 모두 통과

주요 검증 내용:

* JWT 없이 `/auth/me` 접근 → `401`
* 잘못된 JWT로 접근 → `401`
* 유효한 JWT로 접근 → `200`
* 기존 Health API 및 Google OAuth endpoint 유지

---

## Learned

Day06까지는 Google이 사용자를 인증해주는 과정이었다면, Day07에서는 Google 인증이 끝난 이후 우리 서비스가 사용자를 계속 식별할 수 있도록 JWT를 발급하는 구조를 추가했다.

현재 인증 흐름은 다음과 같다.

```text
Google 로그인
→ Google OAuth 인증
→ GoogleStrategy
→ User 조회/생성
→ JWT Access Token 발급
→ Client가 Bearer Token으로 API 요청
→ JwtAuthGuard
→ JwtStrategy
→ JWT 검증
→ 인증된 User 식별
→ 보호된 API 접근
```

이번 작업을 통해 OAuth 인증과 JWT 인증은 같은 개념이 아니라 서로 다른 단계에서 사용된다는 점을 이해했다.

OAuth는 외부 Provider인 Google을 통해 사용자를 인증하는 과정이고, JWT는 인증이 완료된 사용자가 이후 우리 서비스의 API를 이용할 때 자신의 신원을 증명하기 위한 Token이다.

---

## Next

다음 단계에서는 현재 구축한 JWT 인증을 Family 관련 API에 적용할 예정이다.

로그인한 사용자만 자신의 Family 데이터를 조회하거나 수정할 수 있도록 `JwtAuthGuard`를 보호 API에 적용하고, 이후 Family와 FamilyMember의 권한 구조까지 연결한다.

추후 필요에 따라 Kakao OAuth, Frontend redirect, Refresh Token 등을 확장할 수 있다.
