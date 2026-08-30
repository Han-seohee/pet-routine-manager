# Day10 Family 조회 API 구현

**Date: 2026-08-30**

## Context

Day09에서 Family 생성 기능을 구현했다.

이제 생성된 Family를 실제 서비스에서 사용할 수 있도록, 로그인한 사용자가 자신이 속한 Family를 조회하고 특정 Family의 상세 정보와 구성원까지 확인할 수 있는 기능이 필요했다.

이번 작업에서는 Family를 조회할 때 단순히 데이터를 가져오는 것이 아니라, **현재 로그인한 사용자가 해당 Family의 구성원인지 먼저 확인한 뒤 접근하도록 만드는 것**을 중요하게 생각했다.

## Decision

### 1. 내 Family 목록 조회

`GET /families` API를 구현했다.

JWT 인증을 통과한 사용자의 `userId`를 기준으로 `FamilyMember`를 조회하고, 연결된 Family와 사용자의 role을 함께 반환하도록 했다.

```text
GET /families
      ↓
JwtAuthGuard
      ↓
JwtStrategy
      ↓
req.user.userId
      ↓
FamilyService.findMyFamilies()
      ↓
FamilyMember 조회
      ↓
Family + role 반환
```

User와 Family는 직접 연결되어 있지 않고 `FamilyMember`가 중간 테이블 역할을 하기 때문에, `FamilyMember`를 기준으로 조회하는 구조를 사용했다.

### 2. 특정 Family 상세 조회

`GET /families/:id` API를 추가했다.

특정 Family에 접근하기 전에 `userId + familyId`를 이용해 현재 사용자의 멤버십을 확인하도록 했다.

```text
FamilyMember.findUnique({
  where: {
    userId_familyId: {
      userId,
      familyId,
    },
  },
})
```

멤버십이 확인되면 relation을 통해 Family 정보를 함께 가져온다.

이를 통해 OWNER와 MEMBER 모두 자신이 속한 Family를 조회할 수 있도록 했다.

### 3. 401 / 403 / 404 구분

Family 접근 과정에서 인증과 권한을 명확하게 구분했다.

* `401`: JWT가 없거나 유효하지 않은 경우
* `403`: 로그인은 되어 있지만 해당 Family의 구성원이 아닌 경우
* `404`: Family 자체가 존재하지 않는 경우

특히 인증된 사용자라고 해서 모든 Family를 조회할 수 있도록 하지 않고, `FamilyMember`를 통해 실제 멤버십을 확인하도록 했다.

### 4. Family 구성원 목록 조회

특정 Family에 속한 구성원을 조회할 수 있도록 다음 API도 함께 구현했다.

`GET /families/:id/members`

이 API 역시 먼저 현재 사용자의 Family 멤버십을 확인한 후 구성원 목록을 조회한다.

```text
GET /families/:id/members
          ↓
JWT 인증
          ↓
Family 멤버십 확인
          ↓
FamilyMember.findMany()
          ↓
User 정보 + role 반환
```

구성원 목록에서는 UI에 필요한 정보만 반환하도록 `select`를 사용했다.

```text
User
├── id
├── displayName
└── profileImage

FamilyMember
└── role
```

OAuth provider, providerId, email 등 목록 화면에 필요하지 않은 정보는 반환하지 않았다.

### 5. Prisma relation 활용

이번 작업을 통해 Prisma의 relation 조회 방식도 적용했다.

`FamilyMember`에서 `family` 또는 `user` relation을 연결해서 필요한 데이터를 함께 가져오고, `select`를 이용해 실제 응답에 필요한 필드만 선택했다.

이를 통해 불필요한 데이터를 가져오거나 외부에 노출하는 것을 줄일 수 있었다.

## Outcome

이번 작업을 통해 Family 조회 기능을 한 단계 확장했다.

### 구현된 API

```text
POST /families
GET /families
GET /families/:id
GET /families/:id/members
```

현재 로그인한 사용자는 자신이 속한 Family 목록을 조회하고, 특정 Family의 상세 정보와 구성원 목록까지 확인할 수 있다.

또한 Family 접근 시 JWT 인증과 Family 멤버십 검증을 함께 적용했다.

### 테스트 결과

Unit Test:

```text
Test Suites: 8 passed, 8 total
Tests: 32 passed, 32 total
```

E2E Test:

```text
Test Suites: 1 passed, 1 total
Tests: 22 passed, 22 total
```

Build:

```text
pnpm run build → 성공
```

주요 테스트 케이스:

* JWT 없음 → `401`
* 유효한 JWT → Family 조회 성공
* Family 구성원 → `200`
* Family 비구성원 → `403`
* 존재하지 않는 Family → `404`
* Family 구성원 목록 정상 조회
* 구성원이 없는 Family → `200 + []`
* 필요한 User 필드만 반환
* 기존 Family 생성 API 정상 동작

## 배운 점

### 1. FamilyMember는 단순한 중간 테이블이 아니다

`FamilyMember`는 User와 Family를 연결하는 동시에 `OWNER`, `MEMBER` 같은 **Family 내 역할까지 관리하는 모델**이다.

```text
User
  ↕
FamilyMember
  ↕
Family
```

따라서 Family 권한을 관리하는 데 중요한 역할을 한다.

### 2. 인증과 권한은 다르다

JWT가 유효하다는 것은 **누구인지 확인했다는 것**이고,

FamilyMember에 존재한다는 것은 **그 Family에 접근할 권한이 있다는 것**이다.

```text
JWT 인증
→ "너 누구야?"

Family 멤버십
→ "이 Family에 들어와도 돼?"
```

이 둘을 분리해서 생각하는 것이 중요하다는 것을 배웠다.

### 3. `select`와 `include`

`include`는 relation 데이터를 함께 가져올 때 사용하고, `select`는 필요한 필드만 선택할 때 사용한다.

구성원 목록처럼 외부에 보여줄 데이터가 제한적인 경우 `select`를 활용하는 것이 적절하다.

### 4. 목록 조회에서 데이터가 없을 때

Family가 없는 경우 `404`를 반환하는 것이 아니라 목록 API에서는 `200 + []`를 반환하도록 했다.

"목록은 존재하지만 현재 결과가 없다"는 상황과 "요청한 리소스 자체가 존재하지 않는다"는 상황을 구분할 수 있었다.

## Next

다음 단계에서는 Family에 실제 구성원을 추가할 수 있는 기능을 구현한다.

1. Family 초대 기능
2. `MEMBER` 역할로 FamilyMember 추가
3. OWNER 권한 검증
4. 구성원 역할 변경
5. 구성원 제거
6. 필요하면 공통 멤버십 검증 로직 정리
7. 이후 Pet과 Family 연결

다음 작업부터는 단순한 조회를 넘어 **OWNER와 MEMBER의 권한을 실제 서비스 로직에 적용하는 단계**로 넘어간다.
