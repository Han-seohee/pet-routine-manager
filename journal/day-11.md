# Day11 개발일지

**날짜: 2026-08-31**

## Context

Day09~Day10에서 Family 생성 및 조회 기능을 구현한 뒤, 오늘은 Family를 실제로 관리할 수 있도록 **수정 및 삭제 기능**을 구현했다.

Family의 모든 구성원이 Family 정보를 수정하거나 삭제할 수 있는 것은 아니기 때문에, JWT를 통한 인증 이후 `FamilyMember.role`을 확인하여 **OWNER만 수정·삭제할 수 있도록 권한 검증**을 추가했다.

또한 기능 구현을 마친 후 전체 코드베이스를 점검하여 중복 로직과 구조적으로 개선할 수 있는 부분을 확인하고, 당장 리팩토링을 진행하기보다는 향후 작업을 위한 **Refactoring Backlog**로 정리했다.

---

## Decision

### 1. Family 수정 API 구현

`PATCH /families/:id` API를 추가했다.

요청으로 전달받은 Family 이름을 `trim()`한 후 빈 문자열인지 검증하고, 이후 OWNER 권한을 확인한 뒤 Family를 수정하도록 구현했다.

```text
PATCH /families/:id
        ↓
JwtAuthGuard
        ↓
JwtStrategy
        ↓
req.user.userId
        ↓
FamilyController
        ↓
FamilyService
        ↓
name validation
        ↓
assertFamilyOwner()
        ↓
Family update
        ↓
200 OK
```

빈 이름이 전달된 경우 `BadRequestException`을 발생시켜 `400 Bad Request`를 반환하도록 했다.

---

### 2. Family 삭제 API 구현

`DELETE /families/:id` API를 추가했다.

삭제 요청 역시 먼저 JWT 인증을 수행하고, 해당 사용자가 Family의 OWNER인지 확인한 후 삭제하도록 구현했다.

삭제가 성공하면 응답 body가 필요하지 않기 때문에 `204 No Content`를 반환하도록 했다.

```text
DELETE /families/:id
        ↓
JwtAuthGuard
        ↓
OWNER 권한 검증
        ↓
Family.delete()
        ↓
204 No Content
```

---

### 3. `assertFamilyOwner()`를 통한 권한 검증 공통화

Family 수정과 삭제 모두 OWNER 여부를 확인해야 하기 때문에 동일한 권한 검증 로직을 `assertFamilyOwner()` private method로 분리했다.

```text
updateFamily()
      ↓
assertFamilyOwner()

deleteFamily()
      ↓
assertFamilyOwner()
```

이를 통해 동일한 권한 검증 로직을 여러 메서드에서 반복하지 않고 하나의 함수에서 관리할 수 있도록 했다.

---

### 4. 인증과 인가 분리

이번 작업에서 JWT 인증과 Family 권한 검증의 역할을 명확하게 분리했다.

JWT는 사용자가 **누구인지**를 확인하는 인증 수단이고, `FamilyMember.role`은 해당 사용자가 특정 Family에서 **어떤 역할을 가지고 있는지** 판단하는 데이터다.

```text
JWT
 ↓
userId 확인
 ↓
FamilyMember 조회
 ↓
role 확인
 ↓
OWNER / MEMBER 판단
 ↓
수정·삭제 가능 여부 결정
```

따라서 JWT가 유효하더라도 `MEMBER`라면 Family 수정 및 삭제는 허용하지 않는다.

---

### 5. HTTP 상태 코드 구분

각 상황에 맞는 HTTP 상태 코드를 적용했다.

| 상태 코드 | 의미     | 처리                    |
| ----- | ------ | --------------------- |
| `400` | 잘못된 요청 | Family 이름이 비어 있음      |
| `401` | 인증 실패  | JWT 없음 또는 유효하지 않은 JWT |
| `403` | 권한 없음  | OWNER가 아닌 사용자         |
| `404` | 리소스 없음 | 존재하지 않는 Family        |
| `204` | 삭제 성공  | Family 삭제 완료          |

특히 `401`과 `403`을 구분했다.

* `401`: 인증 자체가 되지 않은 경우
* `403`: 인증은 되었지만 해당 작업을 수행할 권한이 없는 경우

---

### 6. Family 삭제 시 Cascade 처리

Prisma schema에서 Family와 FamilyMember 관계에 `onDelete: Cascade`가 설정되어 있기 때문에 Family를 삭제하면 연결된 FamilyMember도 함께 삭제된다.

따라서 별도로 FamilyMember를 먼저 삭제하지 않고 Family만 삭제하도록 구현했다.

```text
Family.delete()
      ↓
Family 삭제
      ↓
연결된 FamilyMember 자동 삭제
```

---

### 7. 전체 코드베이스 리팩토링 검토

기능 구현 후 Cursor를 이용해 현재 코드베이스를 전체적으로 점검했다.

현재 `auth`, `family`, `health`, `prisma` 모듈이 기능별로 분리되어 있고 Unit Test와 E2E Test도 구성되어 있어 전체 구조를 크게 변경할 필요는 없다고 판단했다.

다만 다음과 같은 개선 항목을 확인했다.

* Family 권한 검증 로직 중복
* Family 응답 mapping 중복
* Family 이름 validation 중복
* `ValidationPipe` 및 `class-validator` 미사용
* Controller의 `@Req()` 및 `userId` 추출 반복
* OAuth callback 로직 중복
* localhost URL 하드코딩
* 테스트 mock 코드 중복
* Prisma 에러 처리 개선 필요

이번에는 실제 코드 리팩토링을 진행하지 않고, **Refactoring Backlog 문서로 정리**했다.

---

## Outcome

Family 생성과 조회에 이어 **수정과 삭제까지 구현하면서 Family의 기본적인 관리 기능을 완성했다.**

특히 단순 CRUD가 아니라 JWT 인증과 `FamilyMember.role`을 이용하여 사용자 역할에 따른 접근 제어를 적용했다.

```text
JWT 인증
  ↓
사용자 식별
  ↓
FamilyMember 조회
  ↓
role 확인
  ↓
OWNER
  → 수정 / 삭제 가능

MEMBER
  → 수정 / 삭제 불가능
```

또한 `assertFamilyOwner()`를 별도의 private method로 분리하여 수정과 삭제에서 공통으로 사용할 수 있도록 했고, Family 삭제 시 Prisma의 Cascade 동작을 이용해 관련 FamilyMember 데이터가 함께 정리되도록 했다.

테스트와 빌드도 기존 기능을 포함하여 모두 통과했다.

### Test

```text
pnpm test
→ 8 suites, 41 tests passed

pnpm test:e2e
→ 1 suite, 31 tests passed
```

### Build

```text
pnpm run build
→ 성공
```

기능 구현 이후에는 전체 코드베이스를 점검하여 향후 개선할 부분을 Refactoring Backlog로 기록했다.

---

## Next

다음 단계에서는 Family의 **구성원 관리 기능**을 확장한다.

* Family 초대 및 구성원 추가
* `MEMBER` 역할로 Family 가입
* 구성원 제거
* 구성원 역할 변경
* OWNER / MEMBER 권한 정책 확장
* 이후 Pet 리소스와 Family 연결

기능이 더 추가된 이후 현재 작성해둔 Refactoring Backlog를 기준으로 실제 리팩토링을 진행한다.
