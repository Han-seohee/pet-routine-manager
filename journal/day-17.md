# Day 17. Routine API 및 Category / SubCategory API 구현

> 2026-09-07

## Context

Day 16에서 Pet의 활동 기록을 저장하기 위한 `Routine`, `Category`, `SubCategory` 데이터 모델과 마이그레이션을 완료했다.

Day 17에서는 해당 데이터 모델을 실제 서비스에서 사용할 수 있도록 Routine API를 구현하고, Routine 기록에 필요한 Category / SubCategory CRUD API를 추가했다.

또한 Pet 생성 시 기본 Category와 SubCategory를 자동으로 생성하도록 연결하여 Pet 생성 직후 바로 Routine 기록을 시작할 수 있도록 했다.

## Decision

### 1. Routine API 구현

Pet의 실제 활동 기록을 관리하기 위한 CRUD API를 구현했다.

- `POST /pets/:petId/routines`
- `GET /pets/:petId/routines`
- `GET /pets/:petId/routines/:routineId`
- `PATCH /pets/:petId/routines/:routineId`
- `DELETE /pets/:petId/routines/:routineId`

Routine 생성 시 다음 관계를 검증하도록 했다.

```text
Pet
 └── Category
      └── SubCategory
```

`categoryId`는 필수이며 `subCategoryId`는 선택적으로 사용할 수 있도록 했다.

따라서 다음과 같은 기록을 표현할 수 있다.

```text
사료 → categoryId: 밥 / subCategoryId: 사료
응가 → categoryId: 배변 / subCategoryId: 응가
쉬야 → categoryId: 배변 / subCategoryId: 쉬야
산책 → categoryId: 산책 / subCategoryId: null
약 → categoryId: 약 / subCategoryId: null
```

Routine 수정은 현재 MVP에서 `memo`만 변경할 수 있도록 제한했다.

### 2. Routine 접근 권한 검증

Routine은 Pet과 Family에 종속된 데이터이므로 기존 Family 권한 구조를 재사용했다.

1. `petId`로 Pet 조회
2. Pet이 존재하지 않으면 `404`
3. `FamilyService.assertFamilyMember()`로 Family Member 여부 확인
4. OWNER와 MEMBER 모두 Routine 조회 및 CRUD 가능
5. Routine 조회 및 수정/삭제 시 `routineId + petId`를 함께 조건으로 사용

이를 통해 다른 Family의 Pet이나 다른 Pet의 Routine에 접근할 수 없도록 했다.

또한 Routine 생성 시 Category와 SubCategory의 부모 관계도 함께 검증했다.

### 3. Category / SubCategory API 구현

Routine 기록을 위한 분류 데이터를 관리할 수 있도록 Category와 SubCategory CRUD API를 구현했다.

Category API:

* `GET /pets/:petId/categories`
* `POST /pets/:petId/categories`
* `PATCH /pets/:petId/categories/:categoryId`
* `DELETE /pets/:petId/categories/:categoryId`

SubCategory API:

* `GET /pets/:petId/categories/:categoryId/subcategories`
* `POST /pets/:petId/categories/:categoryId/subcategories`
* `PATCH /pets/:petId/categories/:categoryId/subcategories/:subCategoryId`
* `DELETE /pets/:petId/categories/:categoryId/subcategories/:subCategoryId`

Category와 SubCategory는 MVP에서 `name`만 생성 및 수정할 수 있도록 제한했다.

Prisma의 Unique Constraint를 활용해 같은 Pet 내에서 동일한 Category 이름이 생성되거나 같은 Category 내에서 동일한 SubCategory 이름이 생성되는 경우 `ConflictException`을 반환하도록 했다.

### 4. Category / SubCategory도 Pet 단위로 관리

Category와 SubCategory는 Family가 아니라 Pet에 종속되도록 설계했다.

```text
Family
 ├── Pet A
 │    ├── Category
 │    │    └── SubCategory
 │    └── Routine
 │
 └── Pet B
      ├── Category
      │    └── SubCategory
      └── Routine
```

따라서 같은 Family에 속한 Pet이라도 서로 다른 Category 구성을 가질 수 있다.

OWNER와 MEMBER는 Family Member인 경우 Category / SubCategory를 조회, 생성, 수정, 삭제할 수 있도록 했다.

### 5. Pet 생성 시 기본 Category / SubCategory 자동 생성

기존 Pet 모델에 `PetSpecies` enum을 추가했다.

```text
PetSpecies
├── DOG
└── CAT
```

Pet 생성 시 species에 따라 기본 Category와 SubCategory를 자동으로 생성하도록 했다.

DOG:

```text
밥
 └── 사료
배변
 ├── 응가
 └── 쉬야
산책
약
```

CAT:

```text
밥
 └── 사료
배변
 ├── 응가
 └── 쉬야
약
```

이를 통해 Pet 생성 직후 별도의 초기 설정 없이 기본적인 Routine 기록을 시작할 수 있도록 했다.

### 6. Pet + 기본 Category / SubCategory 생성은 Transaction으로 처리

Pet 생성과 기본 Category / SubCategory 생성을 하나의 Prisma Transaction으로 묶었다.

```text
Pet 생성
 ↓
Category 생성
 ↓
SubCategory 생성
 ↓
Commit
```

중간 단계에서 오류가 발생하면 전체 작업이 rollback되도록 하여 Pet만 생성되거나 기본 데이터가 일부만 생성되는 상태를 방지했다.

### 7. Category 기본 순서는 현재 별도 필드 없이 보류

기본 Category는 다음 순서로 생성하도록 했다.

```text
밥 → 배변 → 산책 → 약
```

하지만 PostgreSQL에서는 INSERT 순서가 조회 순서를 보장하지 않는다.

현재 MVP에서는 `sortOrder` 필드를 추가하지 않고 보류했으며, 실제 Frontend 구현 과정에서 Category 순서가 중요한 요구사항으로 확인되면 `sortOrder`와 같은 정렬 기준을 추가하기로 했다.

## Outcome

### 구현 완료

* Routine CRUD API 구현
* Routine DTO 및 Response DTO 구현
* Routine Family Member 권한 검증
* Pet / Category / SubCategory 관계 검증
* Routine의 Pet 단위 접근 범위 검증
* Category CRUD API 구현
* SubCategory CRUD API 구현
* Category / SubCategory 중복 검증
* Pet Species 추가
* Pet 생성 시 기본 Category / SubCategory 자동 생성
* Pet + 기본 데이터 Transaction 적용
* Swagger 문서 반영
* Pet 관련 Unit / E2E 테스트 보완

### 테스트 및 검증

* Unit Test: 16 suites, 158 tests passed
* E2E Test: 77 tests passed
* `pnpm run build`: 성공
* Swagger `/api`: `200 OK`
* Category / SubCategory Swagger 문서 확인
* Routine API 회귀 테스트 통과
* 다른 Family 및 다른 Pet에 대한 접근 제한 검증
* 기본 Category / SubCategory 자동 생성 검증
* Transaction rollback 동작 검증

이번 작업에서는 별도의 런타임 장애나 심각한 오류가 발생하지 않았다.

대신 구현 과정에서 Category 조회 순서가 INSERT 순서에 의존할 수 없다는 점을 확인했고, 현재 MVP에서는 `sortOrder`를 추가하지 않고 향후 요구사항에 따라 결정하기로 했다.

## Next

Backend의 핵심 데이터 API가 갖춰졌으므로 Frontend 개발을 시작한다.

사용자가 실제로 Routine을 기록하는 핵심 흐름을 화면으로 구현한다.

```text
로그인
 ↓
Family
 ↓
Pet
 ↓
날짜 선택
 ↓
Category
 ↓
SubCategory
 ↓
Routine 기록
 ↓
Timeline
```

Day 18에서는 기존 인증 상태와 API 구조를 확인한 후, 모바일 중심의 Pet 및 Routine 기록 화면부터 구현한다.
