# Day13. Family 멤버 삭제 API 구현

**Date: 2026-09-02**

## Context

Day12에서 Family의 OWNER가 새로운 사용자를 MEMBER로 추가할 수 있는 API를 구현했다.

이번에는 반대로 Family에 속해 있는 MEMBER를 제거하는 기능이 필요했다.

멤버를 삭제한다고 해서 User 자체를 삭제하는 것은 아니다. 한 User는 여러 Family에 속할 수 있기 때문에, 특정 Family와 연결된 `FamilyMember` 관계만 삭제해야 한다.

또한 Family의 멤버 관리 기능이므로 모든 사용자가 멤버를 삭제할 수 있도록 하면 안 되고, 기존 Family 권한 구조에 맞춰 OWNER만 삭제할 수 있도록 했다.

## Decision

기존 `addFamilyMember()`의 구현 패턴을 최대한 그대로 따라 `removeFamilyMember()`를 추가했다.

삭제 요청의 흐름은 다음과 같이 정리했다.

```text
JWT
 ↓
req.user.userId
 ↓
현재 요청자가 누구인지 확인
 ↓
assertFamilyOwner()
 ↓
OWNER인지 확인
 ↓
자기 자신을 삭제하는지 확인
 ↓
FamilyMember 조회
 ↓
존재하지 않으면 404
 ↓
FamilyMember 삭제
 ↓
204 No Content
```

`removeFamilyMember(ownerUserId, familyId, userId)`에서는 먼저 `assertFamilyOwner()`를 사용해 요청자가 해당 Family의 OWNER인지 확인한다.

OWNER가 아닌 사용자가 삭제를 요청하면 `403 Forbidden`을 반환한다.

OWNER가 자기 자신의 `userId`를 삭제 대상으로 전달하는 경우에는 Family에 OWNER가 없어지는 것을 방지하기 위해 `400 Bad Request`를 반환하도록 했다.

삭제 대상은 `User`가 아니라 `FamilyMember`에서 조회한다.

```text
userId + familyId
        ↓
FamilyMember
```

기존 Prisma schema의 `@@unique([userId, familyId])`를 이용해 `userId_familyId` 조건으로 조회하고, 해당 FamilyMember가 없으면 `404 Not Found`를 반환한다.

FamilyMember가 존재하면 `familyMember.delete()`를 사용해 Family와의 관계만 삭제한다. User 레코드 자체는 삭제하지 않는다.

Controller에서는 기존 `deleteFamily`와 동일한 방식으로 `@HttpCode(204)`를 적용하고, JWT에서 가져온 `req.user.userId`와 URL의 `familyId`, `userId`를 Service에 전달하도록 했다.

## Outcome

다음 API를 구현했다.

```text
DELETE /families/:id/members/:userId
```

처리 결과:

* OWNER가 MEMBER 삭제 → `204 No Content`
* MEMBER가 삭제 요청 → `403 Forbidden`
* OWNER가 자기 자신 삭제 → `400 Bad Request`
* 존재하지 않는 FamilyMember 삭제 → `404 Not Found`

User 자체는 삭제하지 않고 `FamilyMember` 관계만 삭제하도록 구현했다.

또한 Service 테스트 5개와 Controller 위임 테스트 1개를 추가했다.

```text
Test Suites: 2 passed, 2 total
Tests:       41 passed, 41 total
npm run build → 성공
```

이번 작업을 통해 Family 권한 흐름을 실제 코드와 연결해서 이해할 수 있었다.

```text
JWT
 ↓
req.user.userId
 ↓
FamilyMember
 ↓
role
 ↓
OWNER / MEMBER
 ↓
권한에 따라 FamilyMember 생성 또는 삭제
```

특히 JWT 인증을 통해 현재 사용자를 확인하는 것과 `FamilyMember.role`을 통해 Family 안에서의 권한을 확인하는 것은 서로 다른 단계라는 점을 정리했다.

## Next

Family의 기본적인 생성, 조회, 수정, 삭제와 멤버 추가 및 삭제 기능이 구현되었다.

다음 단계에서는 현재까지 구현한 Family API의 전체 흐름을 다시 확인하고, 필요한 기능을 추가하면서 인증과 권한 구조를 계속 확장한다.
