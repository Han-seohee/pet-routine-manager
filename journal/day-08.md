# Day 08 · Kakao OAuth 인증 연결

**Date:** 2026-08-17

## Context

Google OAuth 인증을 구현한 상태에서 Kakao OAuth 로그인도 추가하기로 했다.

Kakao Developers에서 앱을 생성하고 Kakao Login, Redirect URI, 닉네임 및 프로필 사진 동의항목을 설정했다.

이번 작업의 목표는 Google OAuth와 Kakao OAuth를 각각 따로 구현하는 것이 아니라, **Provider별 인증 방식의 차이는 Strategy에서 처리하고 이후 User 생성과 JWT 발급은 기존 로직을 재사용하는 구조**를 만드는 것이었다.

## Decision

### 1. Google OAuth와 동일한 구조로 Kakao OAuth 구현

기존 Google OAuth 구조를 기준으로 다음 요소를 추가했다.

* `KakaoStrategy`
* `KakaoAuthGuard`
* Kakao OAuth Controller endpoint
* `AuthModule`의 KakaoStrategy 등록
* KakaoStrategy 단위 테스트

Kakao OAuth의 Strategy 이름은 `kakao`로 사용했다.

### 2. Kakao 사용자 정보를 OAuthLoginDto로 변환

Kakao에서 전달받은 Profile을 그대로 User 생성 로직에 전달하지 않고 기존 `OAuthLoginDto` 형태로 변환하도록 했다.

* `provider` → `KAKAO`
* `providerId` → Kakao 고유 사용자 ID
* `email` → `null`
* `displayName` → Kakao 닉네임
* `profileImage` → Kakao 프로필 이미지

현재 Kakao 앱에서는 이메일 동의항목을 사용하지 않기 때문에 이메일은 `null`로 처리했다.

### 3. 기존 AuthService 재사용

Kakao 전용 User 생성 로직을 새로 만들지 않았다.

Google OAuth와 동일하게 다음 흐름으로 처리했다.

```
KakaoStrategy
    ↓
OAuthLoginDto
    ↓
findOrCreateUser()
    ↓
User
```

JWT 역시 기존 `signAccessToken()`을 그대로 사용했다.

```
User
    ↓
signAccessToken()
    ↓
{ sub: user.id }
    ↓
accessToken
```

### 4. Kakao OAuth endpoint 추가

다음 endpoint를 추가했다.

* `GET /auth/kakao`
* `GET /auth/kakao/callback`

로그인 완료 후에는 Google OAuth와 동일하게 다음 형태를 반환하도록 했다.

```json
{
  "user": "...",
  "accessToken": "..."
}
```

## Outcome

Kakao OAuth 인증을 Google OAuth와 동일한 Passport 기반 구조로 구현했다.

전체 흐름은 다음과 같다.

```
GET /auth/kakao
    ↓
KakaoAuthGuard
    ↓
Kakao 로그인 및 동의
    ↓
/auth/kakao/callback
    ↓
KakaoStrategy
    ↓
OAuthLoginDto
    ↓
findOrCreateUser()
    ↓
User
    ↓
signAccessToken()
    ↓
accessToken
```

이제 Google과 Kakao 모두 외부 OAuth Provider의 사용자 정보를 우리 서비스의 User로 연결할 수 있다.

테스트 결과:

* `pnpm run build` ✅
* Unit Test: 6 test suites, 14 tests ✅
* E2E Test: 1 test suite, 8 tests ✅

Kakao OAuth redirect 테스트를 추가했고 기존 Google OAuth와 JWT 인증 테스트도 모두 유지했다.

### 오늘 배운 것

OAuth Provider마다 사용자 정보를 전달하는 방식은 다르지만, Strategy에서 우리 서비스가 사용하는 형태로 변환하면 이후 인증 로직은 공통으로 사용할 수 있다는 것을 확인했다.

```
GoogleStrategy ─┐
                ├→ OAuthLoginDto
KakaoStrategy ──┘
                    ↓
             AuthService
                    ↓
                  User
                    ↓
                  JWT
```

즉, Provider별 차이는 Strategy에서 흡수하고 User와 JWT 처리는 공통 로직으로 재사용하는 구조를 만들었다.

## Next

Day 09부터는 완성된 인증 구조를 기반으로 Family 기능을 구현한다.

우선 다음 흐름을 연결할 예정이다.

```
JWT
    ↓
인증된 User
    ↓
FamilyMember
    ↓
Family
```

로그인한 사용자가 자신의 Family를 생성하고, FamilyMember를 통해 가족 구성원과 권한을 관리할 수 있도록 구현한다.

이후에는 JWT 인증을 Family 관련 API에 적용하여 자신이 속한 Family의 데이터만 접근할 수 있는 권한 구조까지 확장한다.
