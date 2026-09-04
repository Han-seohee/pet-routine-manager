# Day 15. Pet CRUD API 완성 + Swagger 문서화

**Date: 2026-09-04**

## Context

Pet 모델을 기반으로 Family에서 반려동물을 관리할 수 있는 CRUD API를 구현했다.

Pet은 특정 User가 아닌 Family에 속하는 데이터이므로 Family를 기준으로 Pet API를 설계했다.

또한 API를 구현하면서 Swagger를 도입해 현재까지 만든 Auth, Family, FamilyMember, Pet, Health API를 문서화하고 직접 확인할 수 있도록 구성했다.

이번 작업에서는 단순히 CRUD를 구현하는 것뿐만 아니라, Family 권한과 Pet의 소속 관계를 API 레벨에서 어떻게 보장할지 함께 고려했다.

## Decision

### 1. Pet API는 Family 하위 리소스로 설계

Pet이 Family에 속하기 때문에 다음과 같이 Nested API 구조를 사용했다.

- `POST /families/:familyId/pets`
- `GET /families/:familyId/pets`
- `GET /families/:familyId/pets/:petId`
- `PATCH /families/:familyId/pets/:petId`
- `DELETE /families/:familyId/pets/:petId`

Pet을 단독 리소스로 다루기보다 Family와의 관계를 URL에 표현하는 방식으로 설계했다.

### 2. Pet 권한을 기능별로 분리

Family의 OWNER와 MEMBER가 모든 Pet 기능을 동일하게 사용할 필요는 없기 때문에 권한을 구분했다.

- 목록 조회: OWNER + MEMBER
- 상세 조회: OWNER + MEMBER
- 생성: OWNER
- 수정: OWNER
- 삭제: OWNER

JWT 인증을 통해 현재 사용자를 확인한 후, `FamilyMember.role`을 기준으로 실제 권한을 판단하도록 했다.

### 3. Pet 조회 시 `petId`와 `familyId`를 함께 검증

Pet의 ID만으로 조회하거나 수정/삭제하지 않고 `petId + familyId`를 함께 조건으로 사용했다.

이를 통해 다른 Family에 속한 Pet을 현재 Family의 Pet처럼 접근하는 것을 방지했다.

예를 들어 다른 Family의 Pet ID를 알고 있더라도 현재 Family의 URL로 요청하면 해당 Pet을 찾지 못해 `404 Not Found`를 반환하도록 했다.

### 4. Pet 수정은 PATCH 방식으로 구현

수정 API에서는 모든 필드를 필수로 요구하지 않고 변경하려는 필드만 전달할 수 있도록 했다.

기존 `CreatePetDto`를 기반으로 `PartialType(CreatePetDto)`를 사용해 `UpdatePetDto`를 만들었다.

이를 통해 생성 DTO의 필드 구조를 재사용하면서 수정 시에는 모든 필드를 optional로 처리했다.

예를 들어 이름만 변경하는 경우:

```json
{
  "name": "새 이름"
}
```

처럼 요청할 수 있다.

변경할 필드가 없는 빈 `{}` 요청은 백엔드에서도 `400 Bad Request`로 거부하도록 했다.

프론트에서는 변경사항이 없을 경우 수정 버튼을 disabled 처리할 수 있지만, API 자체는 UI를 거치지 않는 요청도 받을 수 있기 때문에 백엔드 검증도 유지했다.

### 5. registrationNumber 중복 처리

Pet의 `registrationNumber`는 `@unique`로 설정되어 있기 때문에 서로 다른 Pet이 같은 등록번호를 가질 수 없도록 했다.

수정 시 다른 Pet이 이미 사용하고 있는 등록번호를 사용하려 하면 `409 Conflict`를 반환하도록 했다.

단, 현재 Pet이 기존에 가지고 있는 동일한 등록번호를 다시 전달하는 것은 허용했다.

### 6. 입력값 검증

Pet 생성/수정 시 다음 규칙을 적용했다.

* `name`: 공백 문자열 불가
* `breed`: 공백 문자열 불가
* `birthDate`: 선택
* `gender`: 선택 또는 생성 시 필수
* `image`: 선택
* `registrationNumber`: 선택, 중복 불가

### 7. Swagger 도입

현재까지 구현한 API를 직접 확인하고 테스트할 수 있도록 Swagger를 구성했다.

Swagger UI:

`/api`

OpenAPI JSON:

`/api-json`

JWT가 필요한 API에는 Bearer 인증을 적용하고, Controller와 DTO에 Swagger 관련 decorator를 추가했다.

API를 모두 구현한 뒤 한꺼번에 문서화하기보다, 실제 API 구현과 함께 Swagger를 확인할 수 있도록 구성했다.

## Outcome

Pet CRUD API를 모두 구현했다.

### Pet API

* 생성 API 구현
* 목록 조회 API 구현
* 상세 조회 API 구현
* 수정 API 구현
* 삭제 API 구현

### 수정 API

* `UpdatePetDto` 추가
* `PartialType(CreatePetDto)` 적용
* 부분 수정 지원
* 빈 PATCH body 검증
* name/breed 공백 검증
* registrationNumber 중복 검증

### 삭제 API

* OWNER만 삭제 가능
* `petId + familyId` 검증
* 삭제 성공 시 `204 No Content`
* 다른 Family의 Pet 삭제 방지

### 테스트

Unit Test:

* 10 suites
* 100 tests passed

E2E Test:

* 1 suite
* 77 tests passed

TypeScript build:

* 성공

Swagger를 통해 현재까지 구현한 API 구조도 확인할 수 있게 되었다.

## Next

Day 16에서는 Routine 모델을 설계한다.

Pet과 마찬가지로 Routine이 어느 Family/Pet과 어떤 관계를 가지는지 먼저 정의하고, 필요한 필드와 관계를 결정한 후 Prisma Schema에 반영할 예정이다.

특히 Routine이 특정 Pet에게만 적용되는지, Family 전체가 공유하는 루틴인지 관계를 먼저 명확하게 설계한다.
