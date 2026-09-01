# Day12. Family 멤버 추가 API 구현

**Date: 2026-09-01**

## Context

Day09~11에서 Family 생성 및 조회, Family 상세 조회, Family 멤버 조회, OWNER 권한을 이용한 Family 수정·삭제 기능까지 구현했다.

이번에는 Family의 OWNER가 다른 사용자를 Family의 MEMBER로 추가할 수 있도록 멤버 추가 기능을 구현했다.

이번 기능을 통해 기존에 구현한 **JWT 인증 → Family 멤버십 확인 → OWNER 권한 확인** 흐름을 실제 Family 관리 기능에 연결했다.

---

## Decision

### 1. OWNER만 멤버를 추가할 수 있도록 구현

멤버 추가는 Family를 관리하는 작업이므로 OWNER에게만 권한을 부여했다.

기존에 Family 수정·삭제에서 사용했던 `assertFamilyOwner()`를 그대로 재사용했다.

```text
POST /families/:id/members
        ↓
JWT 인증
        ↓
요청자의 Family 멤버십 확인
        ↓
OWNER인지 확인
        ↓
멤버 추가
```

MEMBER 또는 비구성원이 요청하면 `403 Forbidden`을 반환하고, Family가 존재하지 않으면 `404 Not Found`를 반환한다.

### 2. 새로운 멤버의 role은 MEMBER로 생성

Family를 생성한 사용자는 `OWNER`가 되지만, OWNER가 다른 사용자를 추가할 때는 `MEMBER` 역할로 생성하도록 했다.

```text
FamilyMember.create()
        ↓
role: MEMBER
```

### 3. 추가하려는 User가 존재하는지 먼저 확인

존재하지 않는 `userId`를 FamilyMember로 등록하지 않도록 User 존재 여부를 먼저 확인한다.

User가 존재하지 않으면 `404 Not Found`를 반환한다.

### 4. 중복 멤버를 Service에서 확인

`FamilyMember`에는 이미 다음과 같은 unique constraint가 존재한다.

```prisma
@@unique([userId, familyId])
```

따라서 같은 User가 같은 Family에 중복으로 가입할 수 없다.

DB 에러가 발생한 뒤 처리하기보다 Service에서 먼저 확인하고, 이미 가입된 경우 `409 Conflict`를 반환하도록 구현했다.

```text
FamilyMember.findUnique()
        ↓
이미 존재
        ↓
409 Conflict
```

### 5. 기존 권한 검증 로직 재사용

이번 기능에서는 새로운 권한 검증 로직을 만들지 않고 기존 `assertFamilyOwner()`를 재사용했다.

이를 통해 Family 수정, 삭제, 멤버 추가가 모두 동일한 OWNER 권한 정책을 사용하도록 했다.

---

## Outcome

### 구현된 API

```text
POST /families/:id/members
```

요청:

```json
{
  "userId": "추가할-user-id"
}
```

성공하면 해당 User가 `MEMBER` 역할로 FamilyMember에 등록된다.

### 주요 처리 흐름

```text
Client
  ↓
POST /families/:id/members
  ↓
JwtAuthGuard
  ↓
FamilyController
  ↓
FamilyService.addFamilyMember()
  ↓
OWNER 권한 확인
  ↓
User 존재 확인
  ↓
중복 멤버 확인
  ↓
FamilyMember 생성
  ↓
role = MEMBER
  ↓
201 Created
```

### HTTP 상태 코드

| 상태 코드 | 상황                      |
| ----- | ----------------------- |
| `401` | JWT가 없거나 유효하지 않음        |
| `403` | OWNER가 아닌 사용자가 멤버 추가 시도 |
| `404` | Family 또는 User가 존재하지 않음 |
| `409` | 이미 Family의 구성원임         |
| `201` | 멤버 추가 성공                |

### 테스트 결과

Unit Test:

```text
Test Suites: 8 passed, 8 total
Tests:       49 passed, 49 total
```

E2E Test:

```text
Test Suites: 1 passed, 1 total
Tests:       37 passed, 37 total
```

Build:

```text
pnpm run build
```

성공했다.

Day09~Day11에서 작성한 기존 테스트도 모두 통과했다.

### 변경된 파일

* `src/family/dto/add-family-member.dto.ts`
* `src/family/family.service.ts`
* `src/family/family.controller.ts`
* `src/family/family.service.spec.ts`
* `src/family/family.controller.spec.ts`
* `test/app.e2e-spec.ts`

Prisma schema 변경은 없었다.

---

## Next

다음 작업에서는 FamilyMember 관리 기능을 이어서 구현한다.

우선 **멤버 제거 / 탈퇴 API**를 구현할 예정이다.

이후 Family의 핵심 흐름을 정리한 뒤 초대 코드 또는 초대 링크 기능으로 확장한다.

또한 Day09~Day12에서 반복해서 사용한 Family 멤버십 및 OWNER 권한 검증 로직은 이후 기능이 더 늘어난 뒤 리팩토링 백로그를 참고해 공통 로직으로 정리할 수 있다.
