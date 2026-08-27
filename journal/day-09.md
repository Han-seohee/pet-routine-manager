# Day 09 · Family 생성 기능 구현

**Date:** 2026-08-27

## Context

Day 08까지 Google OAuth, Kakao OAuth, JWT 인증 기반을 구현했다.

인증된 사용자를 식별할 수 있는 구조는 완성되었지만, 실제 서비스 기능과 연결된 API는 아직 없었다.

이번 Day 09에서는 JWT 인증을 통해 현재 로그인한 사용자를 확인하고, 사용자가 Family를 생성했을 때 자동으로 해당 Family의 `OWNER`가 되도록 구현했다.

프로젝트를 잠시 쉬었다가 다시 시작한 날이었기 때문에, 기존 인증 흐름을 간단히 복습한 뒤 Family 생성 기능에 집중했다.

## Decision

### 1. User와 Family를 직접 연결하지 않고 FamilyMember 중간 모델 사용

Family 서비스에서는 사용자와 Family 사이에 역할 정보가 필요하다.

예를 들어 Family를 생성한 사용자는 `OWNER`, 초대받아 참여한 사용자는 `MEMBER` 역할을 가질 수 있다.

따라서 단순히 User에 `familyId`를 추가하는 대신 `FamilyMember`를 중간 모델로 사용한다.

```
User
    ↓
FamilyMember
    ↓
Family
```

FamilyMember에는 다음과 같은 관계 정보를 저장한다.

* `userId`
* `familyId`
* `role`
* `joinedAt`

또한 동일한 사용자가 같은 Family에 중복으로 가입하지 않도록 다음 unique constraint를 사용한다.

* `userId` + `familyId`

### 2. JWT 인증 정보를 Family 생성 API에 재사용

기존 Day 07에서 구현한 `JwtAuthGuard`와 `JwtStrategy`를 그대로 사용했다.

인증 과정은 다음과 같다.

```
Authorization: Bearer <accessToken>
    ↓
JwtAuthGuard
    ↓
JwtStrategy
    ↓
JWT 검증
    ↓
req.user.userId
    ↓
FamilyController
    ↓
FamilyService
```

새로운 인증 방식을 만들지 않고 기존 인증 구조를 재사용하도록 구현했다.

### 3. Family와 FamilyMember를 Transaction으로 생성

Family 생성은 실제로 두 개의 DB 작업이 필요하다.

* Family 생성
* FamilyMember 생성

Family만 생성되고 FamilyMember 생성이 실패하면 데이터가 불완전한 상태로 남을 수 있다.

따라서 Prisma `$transaction`을 사용해 두 작업을 하나의 단위로 처리했다.

```
Transaction 시작
    ↓
Family 생성
    ↓
FamilyMember 생성
    ↓
둘 다 성공 → Commit
하나라도 실패 → Rollback
```

### 4. Family 생성자를 자동으로 OWNER로 설정

Family를 생성한 사용자는 자동으로 해당 Family의 `OWNER`가 되도록 구현했다.

```
현재 로그인한 User
    ↓
POST /families
    ↓
Family 생성
    ↓
FamilyMember 생성
    ↓
role = OWNER
```

## Outcome

다음 구조로 Family 기능을 추가했다.

```
src/family/
├── dto/
│   └── create-family.dto.ts
├── family.module.ts
├── family.controller.ts
├── family.service.ts
├── family.service.spec.ts
└── family.controller.spec.ts
```

FamilyModule은 AppModule에 등록했다.

### POST /families 구현

JWT 인증이 필요한 Family 생성 API를 구현했다.

* `POST /families`

요청 예시:

```json
{
  "name": "우리 가족"
}
```

처리 과정:

```
JWT 인증
    ↓
현재 로그인한 userId 확인
    ↓
Family 생성
    ↓
FamilyMember 생성
    ↓
role = OWNER
    ↓
{ family, member } 반환
```

### FamilyService 핵심 로직

Family 이름의 앞뒤 공백을 제거하고, 빈 문자열인 경우 요청을 거부하도록 처리했다.

```
"   우리 가족   "
    ↓
"우리 가족"

"      "
    ↓
400 Bad Request
```

이후 Prisma Transaction 안에서 Family와 FamilyMember를 함께 생성한다.

```
Family 생성
    ↓
family.id 생성
    ↓
FamilyMember 생성
    ├── userId
    ├── familyId
    └── role = OWNER
```

두 작업이 모두 성공해야 최종적으로 데이터가 저장된다.

테스트 결과:

* `pnpm run build` ✅
* Unit Test: 8 test suites, 18 tests ✅
* E2E Test: 1 test suite, 10 tests ✅

Unit Test에서 확인한 내용:

* Family 생성 성공
* FamilyMember 동시 생성
* Family 생성자의 role이 OWNER
* `$transaction` 호출
* 빈 name 요청 처리
* Controller에서 userId와 DTO 전달
* Service 결과 반환

E2E Test에서 확인한 내용:

* JWT 없음 → `POST /families` → 401 Unauthorized
* 유효한 JWT → `POST /families` → 201 Created
* Family 생성 + `member.role = OWNER`

### 오늘 배운 것

이번 작업을 통해 JWT 인증이 실제 서비스 기능과 연결되는 과정을 구현했다.

기존에는 JWT를 발급하고 `/auth/me`에서 인증 여부를 확인하는 수준이었다.

이번에는 JWT에서 확인한 `userId`를 실제 Family 생성 로직에 전달했다.

```
OAuth
    ↓
User 생성 또는 조회
    ↓
JWT 발급
    ↓
Authorization Header
    ↓
JwtStrategy
    ↓
현재 User 식별
    ↓
Family 생성
    ↓
FamilyMember 생성
    ↓
OWNER 권한 부여
```

또한 User와 Family처럼 다대다 관계가 필요한 경우 중간 모델을 사용해 관계와 추가 정보를 함께 관리할 수 있다는 것을 확인했다.

FamilyMember는 단순한 연결 테이블이 아니라, 사용자가 특정 Family에서 가지는 역할과 가입 정보를 관리하는 모델이다.

## Next

다음 단계에서는 Family 생성 이후 사용자가 자신의 Family 정보를 조회할 수 있도록 기능을 확장한다.

예상 흐름:

```
JWT 인증
    ↓
현재 로그인한 User
    ↓
내가 속한 Family 조회
    ↓
FamilyMember 관계 확인
    ↓
Family 정보 반환
```

이후에는 FamilyMember를 추가하고, 다른 사용자를 Family에 초대하는 기능을 구현할 예정이다.

장기적으로는 Pet과 Routine 데이터도 Family를 기준으로 연결하여 가족 구성원이 함께 반려동물의 루틴을 관리할 수 있는 구조로 확장한다.
