# Day05 · Auth 기반 구축

**Date:** 2026-08-14

## Context

Day04에서 PostgreSQL과 Prisma를 NestJS Backend에 연결하고, 인증에 필요한 User, Family, FamilyMember 데이터 모델을 실제 DB에 반영했다.

이번 단계에서는 만들어 둔 User 모델을 실제 인증 흐름에서 사용할 수 있도록 Auth 기반을 구축하는 것을 목표로 했다.

아직 Google/Kakao OAuth 자체나 JWT를 구현하기보다는, OAuth 인증이 완료된 후 전달받은 사용자 정보를 우리 서비스의 User와 연결할 수 있는 구조를 먼저 만드는 데 집중했다.

기존 Backend에는 Auth 관련 코드가 없었기 때문에 AuthModule, AuthService, AuthController, DTO를 새롭게 구성했다.

## Decision

### 1. Auth 기능을 별도 Module로 분리

인증과 관련된 기능을 `src/auth/` 아래에 별도 모듈로 구성했다.

구조는 다음과 같다.

* AuthModule
* AuthService
* AuthController
* OAuthLoginDto

Controller는 HTTP 요청을 받고 응답하는 역할을 담당하고, 실제 User 조회 및 생성과 같은 인증 비즈니스 로직은 Service에서 처리하도록 분리했다.

이렇게 하면 이후 실제 OAuth Callback이나 JWT Guard를 추가하더라도 인증 관련 로직을 재사용하기 쉽다.

### 2. OAuth 사용자 정보를 User와 연결

OAuth 인증이 완료되면 Provider에서 사용자 식별 정보와 프로필을 전달받는다고 가정했다.

이번 단계에서는 다음 정보를 DTO로 정의했다.

* `provider`
* `providerId`
* `email`
* `displayName`
* `profileImage`

이 정보를 `AuthService.findOrCreateUser()`에서 처리하도록 구성했다.

동작 흐름은 다음과 같다.

```
OAuth Profile
    ↓
provider + providerId로 User 조회
    ↓
기존 User가 있으면 반환
    ↓
없으면 새로운 User 생성
```

### 3. provider + providerId를 사용자 식별자로 사용

Day04에서 User 모델에 다음 unique constraint를 설정해 두었다.

```
@@unique([provider, providerId])
```

Day05에서는 이 제약을 실제 Auth 로직에서 활용했다.

Google과 Kakao는 각각 사용자에게 고유한 ID를 제공하지만 서로 다른 Provider이기 때문에 `providerId`만으로는 충분하지 않다.

예를 들어 Google의 사용자 ID가 `123`이고 Kakao의 사용자 ID도 `123`이라고 하더라도 두 계정은 서로 다른 계정이다.

따라서 다음과 같이 조합해서 사용한다.

* `GOOGLE` + `123`
* `KAKAO` + `123`

이 두 값은 서로 다른 사용자로 처리된다.

또한 이메일은 변경되거나 제공되지 않을 수 있기 때문에 OAuth 계정의 기본 식별자로 사용하지 않았다.

### 4. findOrCreateUser()를 공통 진입점으로 구성

인증 과정에서 가장 중요한 로직은 `findOrCreateUser()`로 분리했다.

기존 사용자인지 확인하기 위해 Prisma의 `findUnique()`를 사용하고, 존재하지 않는 경우 `create()`를 사용해 User를 생성한다.

이를 통해 실제 OAuth가 연결된 이후에도 OAuth Callback에서 동일한 Service 메서드를 호출할 수 있도록 구조를 만들었다.

즉 현재는 스텁 API에서 호출하고 있지만, 이후 실제 OAuth 연동에서도 재사용할 수 있는 구조다.

### 5. OAuth Stub Endpoint 추가

실제 Google/Kakao OAuth 연동 전에 인증 구조를 테스트하기 위해 다음 API를 추가했다.

* `POST /auth/oauth/login`

현재 이 API는 실제 OAuth 로그인을 수행하지 않는다.

클라이언트가 OAuth Provider에서 이미 사용자 정보를 받아왔다고 가정하고, 해당 정보를 Backend로 전달하면 AuthService가 User를 조회하거나 생성한다.

따라서 현재 단계에서는 OAuth 전체 흐름 중 User를 식별하고 저장하는 Backend 내부 로직만 구현했다.

### 6. 실제 OAuth와 JWT는 다음 단계로 분리

이번 단계에서는 다음 기능은 구현하지 않았다.

* Google OAuth
* Kakao OAuth
* Authorization Code 처리
* OAuth Callback
* Access Token
* JWT
* Refresh Token
* Auth Guard

실제 OAuth를 구현하려면 Provider의 인증 페이지로 이동한 뒤 Callback을 처리하고, Authorization Code를 Provider의 Token으로 교환한 다음 사용자 정보를 가져오는 과정이 필요하다.

그 이후 `findOrCreateUser()`를 호출하고 우리 서비스에서 사용할 JWT를 발급하는 방식으로 확장할 예정이다.

이번 단계에서는 이러한 기능을 한꺼번에 구현하기보다 인증의 핵심 User 처리 로직을 먼저 분리했다.

## Outcome

Day05에서는 실제 OAuth 연동에 앞서 NestJS Backend의 Auth 기반을 구축했다.

현재 구조는 다음과 같다.

```
POST /auth/oauth/login
    ↓
AuthController
    ↓
AuthService.findOrCreateUser()
    ↓
PrismaService
    ↓
User
```

기존 User가 존재하는 경우에는 해당 User를 반환하고, 존재하지 않는 경우 OAuth 프로필 정보를 이용해 새로운 User를 생성한다.

또한 Day04에서 설정한 `provider` + `providerId` unique constraint를 이용해 동일한 OAuth 계정이 중복 User로 생성되지 않도록 DB 레벨에서도 보호했다.

테스트 결과:

* `pnpm run build` ✅
* `pnpm run test` ✅ 5 tests
* `pnpm run test:e2e` ✅ 3 tests

AuthService의 기존 User 조회와 신규 User 생성 동작을 테스트했고, Controller와 API endpoint에 대한 테스트도 추가했다.

현재까지 구축된 흐름은 다음과 같다.

```
OAuth Provider
    ↓
OAuth 사용자 정보
    ↓
AuthController
    ↓
AuthService.findOrCreateUser()
    ↓
provider + providerId로 User 조회
    ↓
기존 User 반환 / 신규 User 생성
    ↓
User
```

아직 이 다음 단계인 JWT 발급은 구현하지 않았다.

## Next

다음 단계에서는 실제 인증 흐름을 확장한다.

우선 Google과 Kakao OAuth 인증 과정을 연결하고, OAuth Callback에서 전달받은 사용자 정보를 `findOrCreateUser()`와 연결할 예정이다.

이후 인증이 완료된 사용자를 식별할 수 있도록 JWT 기반 인증을 추가한다.

목표 흐름은 다음과 같다.

```
Google / Kakao 로그인
    ↓
Authorization Code
    ↓
Backend Callback
    ↓
Provider 사용자 정보 조회
    ↓
findOrCreateUser()
    ↓
User 식별
    ↓
JWT 발급
    ↓
API 요청
    ↓
JWT 검증
    ↓
User 식별
    ↓
FamilyMember.role을 이용한 권한 확인
```

Day05에서는 이 전체 흐름 중 OAuth 사용자 정보를 우리 서비스의 User로 연결하는 기반까지 구현했다.
