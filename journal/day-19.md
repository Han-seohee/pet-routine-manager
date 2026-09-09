# Day 19. Refresh Token 기반 인증 시스템 구축 및 Logout 구현

Date: 2026-09-09

## Context

하루멍냥의 OAuth 인증 이후 로그인 상태를 안정적으로 유지하기 위해 Refresh Token 기반 인증 구조를 구축했다.

기존에는 Access Token만 사용하는 구조였지만, Access Token의 수명을 짧게 가져가면서도 사용자가 매번 다시 로그인하지 않아도 되도록 Access Token과 Refresh Token을 분리하는 구조를 적용했다.

단순히 Refresh Token을 발급하는 것에서 끝내지 않고, 여러 기기에서의 로그인과 Refresh Token 탈취 상황까지 고려하여 Rotation, Reuse Detection, Logout까지 단계적으로 구현했다.

## Decision

### 1. Refresh Token DB 모델 구현

Refresh Token의 원본 값을 DB에 저장하지 않고 SHA-256 hash만 저장하도록 설계했다.

각 Refresh Token은 사용자와 연결되며 다음 상태를 관리할 수 있도록 했다.

* 만료 여부
* revoke 여부
* 다음 Token으로 교체되었는지 여부
* Token Chain 관계

또한 한 사용자가 여러 기기에서 로그인할 수 있도록 User와 RefreshToken을 1:N 관계로 구성했다.

### 2. Refresh Token 발급

OAuth 로그인 과정에서 Authorization Code를 교환할 때 Refresh Token도 함께 발급하도록 구현했다.

Refresh Token은 `randomBytes(32)`를 사용해 생성하고, 원본 Token은 HttpOnly Cookie에만 전달한다.

DB에는 raw Token이 아닌 hash만 저장한다.

Refresh Token의 유효기간은 30일로 설정했다.

```text
Browser
 ├─ Access Token → HttpOnly Cookie
 └─ Refresh Token → HttpOnly Cookie

DB
 └─ Refresh Token Hash만 저장
```

### 3. Access Token 갱신 API 구현

`POST /auth/refresh`를 구현하여 Refresh Token Cookie를 이용해 새로운 Access Token을 발급받을 수 있도록 했다.

Refresh Token의 존재 여부와 DB 상태를 확인하고 다음 조건을 만족하는 경우에만 Access Token을 발급한다.

* Token이 존재함
* revoke되지 않음
* 만료되지 않음
* 연결된 User가 존재함

### 4. Refresh Token Rotation 구현

Refresh Token을 한 번 사용한 뒤 계속 재사용하지 않고 새로운 Refresh Token으로 교체하는 Rotation 구조를 적용했다.

```text
Refresh Token A
      ↓ refresh
Refresh Token B 발급
      ↓
A revoke
A → B
```

새로운 Refresh Token 역시 raw 값은 Cookie에만 전달하고 DB에는 hash만 저장한다.

Token 생성과 기존 Token revoke는 하나의 DB transaction으로 처리하여 동시에 여러 Refresh 요청이 들어오는 상황에서도 기존 Token이 중복 사용되지 않도록 했다.

### 5. Refresh Token Reuse Detection 구현

Rotation된 이전 Refresh Token이 다시 사용되는 상황을 감지하도록 구현했다.

예를 들어:

```text
A → B → C → D
```

인 Token Chain에서 이미 사용된 A 또는 B가 다시 사용되면 해당 Chain 전체를 revoke한다.

이를 통해 탈취된 과거 Refresh Token이 다시 사용되는 상황에서 현재 사용 중인 Refresh Token까지 무효화할 수 있도록 했다.

다른 기기에서 생성된 Refresh Token Chain에는 영향을 주지 않도록 구성했다.

### 6. Backend Logout 구현

Refresh Token 기반 인증을 종료하기 위한 `POST /auth/logout` API를 구현했다.

Frontend에서 전달된 `prm_refresh_token` Cookie를 hash하여 현재 Refresh Token을 revoke한다.

로그아웃은 idempotent하게 동작하도록 구성하여 다음 상황에서도 성공 응답을 반환한다.

* Refresh Token Cookie가 없음
* 존재하지 않는 Token
* 이미 revoke된 Token

Backend에서는 Refresh Token의 DB 상태만 변경하고 브라우저 Cookie 삭제는 Frontend에서 담당하도록 역할을 분리했다.

### 7. Frontend Logout 구현

Next.js Route Handler를 통해 Backend Logout과 브라우저 세션 종료를 연결했다.

```text
Logout Button
      ↓
POST /auth/logout
      ↓
Next.js Route Handler
      ↓
Backend POST /auth/logout
      ↓
Refresh Token revoke
      ↓
Access Token Cookie 삭제
Refresh Token Cookie 삭제
      ↓
/login
```

`prm_access_token`과 `prm_refresh_token`을 모두 `Max-Age=0`, `Path=/`로 만료시켰다.

Logout Button만 Client Component로 분리하고 보호된 Layout 전체는 Server Component로 유지했다.

로그아웃 진행 중에는 버튼을 비활성화하여 중복 요청을 방지했다.

### 8. Logout 실패 상황 처리

사용자가 명시적으로 로그아웃을 요청한 경우 Backend 오류나 네트워크 오류가 발생하더라도 브라우저의 로컬 세션은 종료하도록 구현했다.

Backend Logout 요청 결과와 관계없이 Frontend의 Access Token과 Refresh Token Cookie를 삭제하여 사용자가 로그인 화면으로 이동할 수 있도록 했다.

### 9. 기존 인증 구조 유지

이번 작업에서는 기존 OAuth 및 Route Protection 구조를 유지했다.

변경하지 않은 주요 부분:

* Google OAuth
* Kakao OAuth
* Authorization Code
* `/auth/token`
* `/auth/refresh`
* `/auth/me`
* `proxy.ts`
* Access Token TTL

현재 Access Token TTL은 1일로 유지하고, 다음 작업에서 약 30분으로 단축할 예정이다.

## Outcome

Refresh Token을 중심으로 한 인증 시스템을 Backend와 Frontend 전체에 연결했다.

현재 구조는 다음과 같다.

```text
Google / Kakao OAuth
        ↓
Authorization Code
        ↓
Access Token 발급
        ↓
HttpOnly Cookie

        +

Refresh Token 발급
        ↓
DB에는 Hash만 저장
        ↓
Refresh
        ↓
Rotation
        ↓
Reuse Detection
        ↓
Logout 시 revoke
        ↓
Frontend Cookie 삭제
```

테스트를 통해 Refresh Token 발급, 갱신, Rotation, Reuse Detection, Logout의 각 동작을 검증했다.

또한 실제 브라우저에서 다음 전체 흐름을 직접 확인했다.

```text
로그인
 ↓
Access Token / Refresh Token Cookie 확인
 ↓
로그아웃 클릭
 ↓
두 Cookie 삭제
 ↓
/login 이동
 ↓
/family 접근 차단
```

Cookie가 없는 상태의 Logout, 잘못된 Access Token, Refresh 요청 실패 등의 예외 상황도 확인했다.

## Test

```text
pnpm test
→ 5 files, 19 tests passed

pnpm lint
→ 통과

pnpm build
→ 통과
```

실행 중인 Frontend와 Backend를 대상으로 다음 항목도 확인했다.

* Cookie 없는 `POST /auth/logout` → `200 { ok: true }`
* Dummy Refresh Cookie를 포함한 Logout → `200 { ok: true }`
* Logout 응답에 Token이 포함되지 않음
* 두 인증 Cookie에 `Max-Age=0`, `Path=/` 적용
* Cookie 없는 `/family` 접근 → `/login`
* 잘못된 Access Token으로 `/family` 접근 → Logout fallback
* Cookie 없는 `/auth/refresh` → `401`
* Backend Logout의 unknown Token → `200 { ok: true }`

## Next

다음 작업에서는 Access Token TTL을 현재 1일에서 약 30분으로 단축한다.

이후 실제 Access Token 만료 상황에서 Refresh Token을 이용해 새로운 Access Token이 발급되고 로그인 상태가 계속 유지되는지 검증한다.

그 다음 지금까지 구축한 전체 인증 흐름을 처음부터 다시 공부한다.

```text
OAuth
→ Authorization Code
→ Access Token
→ Refresh Token
→ Rotation
→ Reuse Detection
→ Logout
→ Cookie
→ proxy
```

각 단계가 **왜 필요한지, 실제 요청이 어떻게 이동하는지, DB에는 무엇이 저장되는지**를 이해한 뒤 인증 파트를 최종 마무리한다.

인증 흐름 최종 점검이 끝나면 하루멍냥의 핵심 기능 구현으로 넘어간다.

```text
Pet
→ Category / SubCategory
→ Routine
→ Frontend 화면
```
